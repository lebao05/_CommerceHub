using ApiGateway.Authorization;
using ApiGateway.Sessions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Caching.StackExchangeRedis;
using OpenIddict.Validation.AspNetCore;

namespace ApiGateway.Sessions;

/// <summary>
/// Registers the session stack: <see cref="IDistributedCache"/> backed by Redis, the store, the
/// authentication handler, and the policy scheme that picks between bearer (OpenIddict) and
/// session per request.
/// </summary>
/// <remarks>
/// <para>
/// The policy scheme is the load-bearing piece. <see cref="AuthenticationSchemeOptions"/> can have
/// at most one default scheme, so the framework's auth middleware has to be told which scheme runs
/// for a given request before the auth pipeline picks the matching handler. Without this, requests
/// with a bearer header and no session would fall through to the session handler, which would
/// refuse them, and a request with a session cookie and no bearer would fall through to the bearer
/// handler, which would also refuse it.
/// </para>
/// <para>
/// The selection is by header presence: a bearer header means the caller is doing
/// service-to-service, which means it has its own token and does not want the gateway to spend a
/// round trip reading a session; a session cookie means the caller is a browser, which means the
/// token is in Redis and the gateway should build the principal from there. A request with neither
/// has neither.
/// </para>
/// </remarks>
public static class SessionAuthenticationExtensions
{
    /// <summary>
    /// Wires the Redis-backed session store, the session auth handler, and the multi-auth policy
    /// scheme.
    /// </summary>
    public static IServiceCollection AddGatewaySession(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var options = configuration.GetSection(SessionOptions.SectionName).Get<SessionOptions>()
            ?? throw new InvalidOperationException(
                $"The '{SessionOptions.SectionName}' configuration section is required.");

        // A missing client secret is reported at startup rather than at the first /oauth/callback,
        // because the failure mode without it is a confusing 401 from the identity server rather
        // than a clear configuration error here.
        if (string.IsNullOrWhiteSpace(options.GatewayClientSecret))
        {
            throw new InvalidOperationException(
                "Session:GatewayClientSecret is required. Set it in user secrets or the environment " +
                "before starting the gateway.");
        }

        services.AddSingleton(options);

        services.AddStackExchangeRedisCache(redis =>
        {
            redis.Configuration = options.Redis;
        });

        services.AddSingleton<ISessionStore, RedisSessionStore>();

        var builder = services.AddAuthentication(SessionDefaults.MultiSchemeName);

        // The session scheme. Bearer is already registered by AddGatewayTokenValidation as the
        // OpenIddict validation scheme, so this is the only new scheme registered here.
        builder.AddScheme<AuthenticationSchemeOptions, SessionAuthenticationHandler>(
            authenticationScheme: SessionDefaults.SessionSchemeName,
            displayName: "Session cookie",
            configureOptions: null);

        // The policy scheme picks bearer or session based on the incoming request. It runs first
        // because it is the default scheme, and it chooses which handler actually authenticates.
        builder.AddPolicyScheme(
            authenticationScheme: SessionDefaults.MultiSchemeName,
            displayName: "Bearer or session cookie",
            configureOptions: policy =>
                policy.ForwardDefaultSelector = context =>
                {
                    var authorization = context.Request.Headers.Authorization.ToString();

                    if (authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                    {
                        return OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;
                    }

                    return SessionDefaults.SessionSchemeName;
                });

        // The default policy with the multi-auth scheme, so a bare [Authorize] works against the
        // new pipeline without renaming it on every existing controller.
        services.AddAuthorization();

        return services;
    }
}