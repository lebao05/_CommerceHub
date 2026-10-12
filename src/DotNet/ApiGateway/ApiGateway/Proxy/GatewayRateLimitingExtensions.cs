using System.Security.Claims;
using System.Threading.RateLimiting;
using ApiGateway.Configuration;
using ApiGateway.Responses;
using Microsoft.AspNetCore.RateLimiting;

namespace ApiGateway.Proxy;

/// <summary>
/// The gateway's request-rate ceilings.
/// </summary>
/// <remarks>
/// <para>
/// This is ASP.NET Core's built-in rate limiter, not a proxy-specific one, so the same counters back
/// a request to a downstream service and a request to <c>/health</c>, and the rejection is produced
/// by the same middleware that runs for a minimal API. A second, proxy-specific limiter would mean
/// two sets of numbers, two sets of metrics and two ways for a caller to be throttled.
/// </para>
/// <para>
/// Partitions are keyed by the calling client where the token says who is calling, and by remote IP
/// otherwise. Keying only on client id would be useless for an anonymous flood, because an anonymous
/// caller has no client id; keying only on IP would let one office behind a single NAT throttle
/// itself as one caller.
/// </para>
/// </remarks>
public static class GatewayRateLimitingExtensions
{
    /// <summary>
    /// Paths that are never limited. A health probe that can be throttled turns a traffic spike into
    /// a restart loop, and a CORS preflight that can be throttled breaks a browser rather than
    /// protecting anything.
    /// </summary>
    private static readonly string[] ExemptPaths = ["/health", "/swagger"];

    /// <summary>Adds the global limiter and the per-route authentication limiter.</summary>
    public static IServiceCollection AddGatewayRateLimiting(
        this IServiceCollection services,
        GatewayOptions options)
    {
        var global = options.RateLimiting.Global;
        var authentication = options.RateLimiting.Authentication;

        services.AddRateLimiter(limiter =>
        {
            limiter.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            limiter.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
                context => IsExempt(context)
                    ? RateLimitPartition.GetNoLimiter("exempt")
                    : RateLimitPartition.GetFixedWindowLimiter(
                        PartitionKey(context),
                        _ => Window(global)));

            // Applied to a route by naming it in RouteConfig.RateLimiterPolicy, which puts the
            // policy name into the endpoint's metadata for UseRateLimiter to find. The token and
            // authorize endpoints are the only ones where a caller can make the identity server do
            // password hashing, so they get a much lower ceiling than a catalog browse.
            limiter.AddPolicy(RateLimitPolicies.AuthenticationRoutes, context =>
                IsExempt(context)
                    ? RateLimitPartition.GetNoLimiter("exempt")
                    : RateLimitPartition.GetFixedWindowLimiter(
                        PartitionKey(context),
                        _ => Window(authentication)));

            limiter.OnRejected = async (context, _) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var after))
                {
                    context.HttpContext.Response.Headers.RetryAfter =
                        ((int)Math.Ceiling(after.TotalSeconds)).ToString();
                }

                await ErrorResponse.WriteAsync(
                    context.HttpContext,
                    StatusCodes.Status429TooManyRequests,
                    "Too many requests. Slow down and retry once the window has passed.");
            };
        });

        return services;
    }

    private static FixedWindowRateLimiterOptions Window(RateLimitPolicyOptions options) => new()
    {
        PermitLimit = options.PermitLimit,
        Window = TimeSpan.FromSeconds(options.WindowSeconds),
        QueueLimit = options.QueueLimit,
        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
        AutoReplenishment = true
    };

    private static bool IsExempt(HttpContext context) =>
        HttpMethods.IsOptions(context.Request.Method) ||
        ExemptPaths.Any(path => context.Request.Path.StartsWithSegments(path, StringComparison.OrdinalIgnoreCase));

    /// <summary>
    /// The client's id when the token names one, the remote address otherwise.
    /// </summary>
    /// <remarks>
    /// The two are prefixed apart on purpose. A client whose id happens to be an IP address string
    /// would otherwise share a partition with the anonymous caller at that address, so one of them
    /// could exhaust the other's allowance.
    /// </remarks>
    private static string PartitionKey(HttpContext context)
    {
        var clientId = context.User.FindFirstValue("client_id")
                       ?? context.User.FindFirstValue("azp");

        if (!string.IsNullOrWhiteSpace(clientId))
        {
            return $"client:{clientId}";
        }

        var address = context.Connection.RemoteIpAddress;

        return address is null ? "ip:unknown" : $"ip:{address}";
    }
}
