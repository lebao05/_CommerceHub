using ApiGateway.Configuration;

namespace ApiGateway.Proxy;

/// <summary>
/// Cross-origin access for the React storefront.
/// </summary>
/// <remarks>
/// <para>
/// The storefront is served from its own dev server on a different port, so every call it makes is
/// cross-origin and every call is credentialed. That combination is why the origins are listed
/// explicitly: the CORS specification forbids <c>Access-Control-Allow-Origin: *</c> together with
/// <c>Access-Control-Allow-Credentials</c>, and the usual workaround of reflecting whatever origin
/// was requested is worse than the wildcard, because it makes the gateway willing to attach a
/// caller's credentials to a request from any site on the internet.
/// </para>
/// <para>
/// Credentials here means the browser's cookies for this gateway's origin, not bearer tokens, which
/// the storefront holds in memory and sends in an <c>Authorization</c> header. The allowance is
/// still required, because the same policy has to be in place before anyone moves the token into a
/// cookie, and tightening CORS later is easier than loosening it.
/// </para>
/// </remarks>
public static class GatewayCorsExtensions
{
    /// <summary>Adds the storefront CORS policy from the configured origins.</summary>
    public static IServiceCollection AddGatewayCors(
        this IServiceCollection services,
        GatewayOptions options)
    {
        var origins = options.Cors.Origins
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .Select(origin => origin.TrimEnd('/'))
            .ToArray();

        if (origins.Length == 0)
        {
            throw new InvalidOperationException(
                $"{GatewayOptions.SectionName}:Cors:Origins is empty. A credentialed CORS policy " +
                "cannot be built without an explicit origin list, so the gateway refuses to start " +
                "rather than fall back to a wildcard.");
        }

        services.AddCors(cors => cors.AddPolicy(
            CorsOptions.PolicyName,
            policy => policy
                .WithOrigins(origins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials()));

        return services;
    }
}
