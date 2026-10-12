using ApiGateway.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OpenIddict.Validation.AspNetCore;
using OpenIddict.Validation.SystemNetHttp;

namespace ApiGateway.Authentication;

/// <summary>
/// Configures the gateway to validate the access tokens the identity server issues.
/// </summary>
/// <remarks>
/// <para>
/// The gateway is a separate process from the identity server, so validation is the remote
/// kind: OpenIddict fetches the discovery document once, learns the JWKS URL from it, and caches
/// the keys, re-fetching only when a token carries a key id it has not seen. That is why
/// <c>UseSystemNetHttp</c> is used and not <c>UseLocalServer</c>. The latter compiles happily
/// and then rejects every token, because there is no authorization server in this process to ask.
/// </para>
/// <para>
/// The issuer is set once, on the validation options. The SystemNetHttp builder has no SetIssuer
/// of its own -- verified against 7.7.1 -- because its configuration retriever derives the
/// discovery URL from this same Issuer value rather than keeping a second copy of it that could
/// be set to something else.
/// </para>
/// <para>
/// No audience is required. The identity server sets the token's audience to the resource server
/// each granted scope belongs to, so a token obtained for the catalog legitimately has an
/// audience the order service does not share. Constraining the audience at the gateway would
/// reject a multi-scope token for the wrong reason. What the token is allowed to <i>do</i> is
/// decided by the scope policies instead, which is what a gateway is for.
/// </para>
/// <para>
/// The default scheme is not set here. <see cref="Sessions.SessionAuthenticationExtensions.AddGatewaySession"/>
/// sets the default to a policy scheme that forwards bearer requests to the OpenIddict validation
/// scheme and everything else to the session scheme. Both schemes must be registered before that
/// call, so this method only contributes the OpenIddict handler.
/// </para>
/// </remarks>
public static class GatewayTokenValidationExtensions
{
    /// <summary>
    /// Adds the OpenIddict validation handler so requests that carry an <c>Authorization: Bearer</c>
    /// header can be authenticated. The default scheme is set by
    /// <see cref="Sessions.SessionAuthenticationExtensions.AddGatewaySession"/>, not here.
    /// </summary>
    public static IServiceCollection AddGatewayTokenValidation(
        this IServiceCollection services,
        IdentityEndpoints endpoints)
    {
        services.AddAuthorization();

        services.AddOpenIddict()
            .AddValidation(options =>
            {
                options.SetIssuer(endpoints.Issuer);
                options.UseSystemNetHttp();
                options.UseAspNetCore();
            });

        return services;
    }
}