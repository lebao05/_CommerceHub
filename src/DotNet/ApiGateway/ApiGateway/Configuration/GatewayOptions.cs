namespace ApiGateway.Configuration;

/// <summary>
/// Everything the gateway needs to know that is not part of the proxy itself: who issues tokens,
/// which origins may call it, where each service listens, and how hard to push back.
/// </summary>
/// <remarks>
/// Bound from the <c>Gateway</c> configuration section. Nothing in this class is a secret, and
/// nothing should ever be: a client's secret or a signing key belongs in user secrets or the
/// environment, because a value in a file that is committed to the repository is a published value.
/// </remarks>
public sealed class GatewayOptions
{
    /// <summary>The configuration section this is bound from.</summary>
    public const string SectionName = "Gateway";

    /// <summary>Where tokens come from, and who this gateway trusts to have issued them.</summary>
    public IdentityOptions Identity { get; set; } = new();

    /// <summary>Browser origins allowed to call the gateway with credentials.</summary>
    public CorsOptions Cors { get; set; } = new();

    /// <summary>
    /// The downstream services, keyed by the name the route table uses. Ports live here rather than
    /// in the route table so that moving a service to another port, or to a container address, is a
    /// configuration edit and not a code edit.
    /// </summary>
    public Dictionary<string, DownstreamService> Services { get; set; } =
        new(StringComparer.OrdinalIgnoreCase);

    /// <summary>Request-rate ceilings.</summary>
    public RateLimitingOptions RateLimiting { get; set; } = new();

    /// <summary>Settings for the development-only Swagger UI.</summary>
    public SwaggerOptions Swagger { get; set; } = new();
}

/// <summary>
/// The identity server's address. The gateway runs as a separate process from it, so this issuer is
/// both what it validates tokens against and where it fetches the discovery document and signing
/// keys from.
/// </summary>
public sealed class IdentityOptions
{
    /// <summary>
    /// The issuer identifier, exactly as the identity server publishes it. Trailing slash included,
    /// because the issuer is compared as a string and "http://localhost:5063" and
    /// "http://localhost:5063/" are different issuers to a token validator.
    /// </summary>
    public string Issuer { get; set; } = string.Empty;

    /// <summary>
    /// Optional, and normally left empty. It exists so the health check and the Swagger UI can be
    /// pointed at a different host than the token validator when a deployment terminates TLS in
    /// front of the identity server but the identity server itself only speaks plain HTTP.
    /// </summary>
    public string? PublicIssuer { get; set; }
}

/// <summary>
/// Cross-origin settings for the browser clients.
/// </summary>
public sealed class CorsOptions
{
    /// <summary>Policy name used by <c>UseCors</c> and referenced by nothing else.</summary>
    public const string PolicyName = "storefront";

    /// <summary>
    /// Exact origins, never a wildcard. The gateway sends <c>Access-Control-Allow-Credentials</c>,
    /// and the CORS specification forbids combining that with <c>Access-Control-Allow-Origin: *</c>,
    /// so a wildcard here would either be rejected by the browser or, if the server "fixed" it by
    /// reflecting the request origin, would turn the gateway into a reflector that serves any
    /// origin's cookies.
    /// </summary>
    public string[] Origins { get; set; } = [];
}

/// <summary>
/// One downstream service's address.
/// </summary>
public sealed class DownstreamService
{
    /// <summary>Base address including the scheme, e.g. <c>http://localhost</c>.</summary>
    public string Host { get; set; } = "http://localhost";

    /// <summary>TCP port the service listens on in development.</summary>
    public int Port { get; set; }

    /// <summary>
    /// A complete address that wins over <see cref="Host"/> and <see cref="Port"/> when set. This is
    /// how a deployed environment points a route at a service-discovery name such as
    /// <c>http://order-api:8080</c> without touching the route table.
    /// </summary>
    public string? Address { get; set; }

    /// <summary>
    /// The address YARP forwards to. Trailing slashes are stripped because YARP appends the
    /// forwarded path to this value, and a trailing slash here produces a doubled separator in the
    /// outgoing request line.
    /// </summary>
    public string ResolveAddress()
    {
        if (!string.IsNullOrWhiteSpace(Address))
        {
            return Address.TrimEnd('/');
        }

        if (Port <= 0)
        {
            throw new InvalidOperationException(
                $"Downstream service '{Host}' has no port. Set the port, or set an explicit address.");
        }

        return $"{Host.TrimEnd('/')}:{Port}";
    }
}

/// <summary>
/// Request-rate ceilings, expressed as a permit count per fixed window rather than as tokens per
/// second. A fixed window is what an operator can reason about, and its one weakness, a burst
/// across the window boundary, is acceptable at the volumes a storefront sees.
/// </summary>
public sealed class RateLimitingOptions
{
    /// <summary>The ceiling for everything the gateway forwards.</summary>
    public RateLimitPolicyOptions Global { get; set; } = new();

    /// <summary>
    /// The tighter ceiling for the token, authorize and logout endpoints. Those are the only routes
    /// where a caller can make the identity server do password hashing and key lookups, so they get
    /// a lower ceiling than a catalog browse costs.
    /// </summary>
    public RateLimitPolicyOptions Authentication { get; set; } = new();
}

/// <summary>One rate-limit ceiling.</summary>
public sealed class RateLimitPolicyOptions
{
    /// <summary>Requests allowed per window, per partition.</summary>
    public int PermitLimit { get; set; } = 300;

    /// <summary>Length of the window in seconds.</summary>
    public int WindowSeconds { get; set; } = 60;

    /// <summary>
    /// How many requests may wait for a permit. Zero rejects immediately, which is the honest
    /// behaviour for an API: a caller that is being throttled should be told so, not silently
    /// parked until its own client times out.
    /// </summary>
    public int QueueLimit { get; set; }
}

/// <summary>
/// Swagger UI settings. There is no secret here on purpose: the UI's password flow needs a client id
/// and a client secret typed by a human, and the secret is supplied at the browser, not configured
/// here.
/// </summary>
public sealed class SwaggerOptions
{
    /// <summary>
    /// The first-party client the Swagger UI authenticates as. The password grant is granted to
    /// exactly one confidential client on the identity server, and this has to be that one.
    /// </summary>
    public string ClientId { get; set; } = "commercehub-firstparty";
}
