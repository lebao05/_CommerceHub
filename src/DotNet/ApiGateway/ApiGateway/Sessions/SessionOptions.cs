namespace ApiGateway.Sessions;

/// <summary>
/// Bound from the <c>Session</c> configuration section. Owns the lifetimes and the Redis
/// connection.
/// </summary>
/// <remarks>
/// <para>
/// The lifetimes are deliberately not coupled: idle is a sliding window renewed on every hit, and
/// absolute is the upper bound no renewal can extend. A token whose session has expired on one
/// side is gone on the other; the two together are what stop a stolen cookie from being renewed
/// forever.
/// </para>
/// <para>
/// <see cref="CookieName"/> is here rather than as a constant on the handler because the same name
/// appears in the response shape and in the auth handler, and a rename has to be one edit rather
/// than two that have to be kept in step.
/// </para>
/// </remarks>
public sealed class SessionOptions
{
    /// <summary>The configuration section this is bound from.</summary>
    public const string SectionName = "Session";

    /// <summary>The scheme name registered by the session authentication handler.</summary>
    public const string SchemeName = "Session";

    /// <summary>The scheme name registered by the bearer authentication handler (existing).</summary>
    public const string BearerSchemeName = "Bearer";

    /// <summary>The name of the policy scheme that picks between bearer and session per request.</summary>
    public const string MultiSchemeName = "MultiAuth";

    /// <summary>How long a session can sit idle before it is dropped.</summary>
    public int IdleMinutes { get; set; } = 30;

    /// <summary>
    /// The hard upper bound on a session's age, no matter how often it is touched. Renewals inside
    /// this window slide the idle timer; reaching it ends the session.
    /// </summary>
    public int AbsoluteDays { get; set; } = 7;

    /// <summary>
    /// When the access token is within this many seconds of expiry, the handler uses the refresh
    /// token to get a fresh access token before serving the request. Sixty is small enough that a
    /// request never serves with an already-stale one, and large enough that a page-load doesn't
    /// trigger a refresh on every navigation.
    /// </summary>
    public int RefreshWindowSeconds { get; set; } = 60;

    /// <summary>The connection string used for the Redis-backed session store.</summary>
    public string Redis { get; set; } = "localhost:6379";

    /// <summary>The name of the cookie that carries the opaque session id.</summary>
    public string CookieName { get; set; } = "ch_session";

    /// <summary>
    /// The name of the client the gateway presents itself as when calling the identity server's
    /// token endpoint.
    /// </summary>
    public string GatewayClientId { get; set; } = "commercehub-gateway";

    /// <summary>
    /// The gateway's client secret. Pulled from configuration because a secret committed to the
    /// repository is a published secret. The placeholder value fails startup loudly rather than
    /// letting a misconfigured gateway silently authenticate without a secret.
    /// </summary>
    public string? GatewayClientSecret { get; set; }

    /// <summary>Where the SPA expects to land after a successful sign-in.</summary>
    public string StorefrontOrigin { get; set; } = "http://localhost:5173";

    /// <summary>Where the admin SPA expects to land after a successful sign-in.</summary>
    public string AdminOrigin { get; set; } = "http://localhost:5174";

    /// <summary>The set of client ids the gateway will act on behalf of. Anything else is rejected.</summary>
    public string[] AllowedClients { get; set; } = ["commercehub-web", "admin-dashboard"];

    /// <summary>The base address the gateway listens on, used to build the OAuth callback URL.</summary>
    public string GatewayOrigin { get; set; } = "http://localhost:5108";

    public TimeSpan IdleTimeout => TimeSpan.FromMinutes(IdleMinutes);

    public TimeSpan AbsoluteTimeout => TimeSpan.FromDays(AbsoluteDays);

    public TimeSpan RefreshWindow => TimeSpan.FromSeconds(RefreshWindowSeconds);
}