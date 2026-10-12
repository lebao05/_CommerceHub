namespace ApiGateway.Configuration;

/// <summary>
/// The identity server's URLs, derived once from configuration.
/// </summary>
/// <remarks>
/// Derived rather than configured separately so the three places that need an identity server URL,
/// the token validator, the health check and the Swagger UI, cannot disagree about where it is. A
/// gateway that validates against one issuer and health-checks another is green while serving
/// nothing.
/// </remarks>
public sealed class IdentityEndpoints
{
    private IdentityEndpoints(Uri issuer, Uri discoveryEndpoint, Uri tokenEndpoint)
    {
        Issuer = issuer;
        DiscoveryEndpoint = discoveryEndpoint;
        TokenEndpoint = tokenEndpoint;
    }

    /// <summary>The issuer tokens are validated against.</summary>
    public Uri Issuer { get; }

    /// <summary>The discovery document, which is where the signing keys are published from.</summary>
    public Uri DiscoveryEndpoint { get; }

    /// <summary>The token endpoint the Swagger UI's password flow posts to.</summary>
    public Uri TokenEndpoint { get; }

    /// <summary>
    /// Builds the endpoints from the configured issuer.
    /// </summary>
    /// <exception cref="InvalidOperationException">
    /// No issuer was configured, or the value is not an absolute URI. Failing here rather than at the
    /// first token means a misconfigured gateway says so at startup instead of answering 401 to
    /// everybody with no explanation.
    /// </exception>
    public static IdentityEndpoints FromIssuer(string? issuer)
    {
        if (string.IsNullOrWhiteSpace(issuer) || !Uri.TryCreate(issuer, UriKind.Absolute, out var uri))
        {
            throw new InvalidOperationException(
                $"{GatewayOptions.SectionName}:Identity:Issuer must be an absolute URI, for example " +
                "'http://localhost:5063/'. Note the trailing slash: the issuer is compared as a " +
                "string, so an issuer without one will not match the tokens that server issues.");
        }

        return new IdentityEndpoints(
            issuer: uri,
            discoveryEndpoint: new Uri(uri, ".well-known/openid-configuration"),
            tokenEndpoint: new Uri(uri, "connect/token"));
    }
}
