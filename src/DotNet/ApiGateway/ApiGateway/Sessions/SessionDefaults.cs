namespace ApiGateway.Sessions;

/// <summary>
/// String constants the session code uses more than once. Held here rather than scattered through
/// the handler and the OAuth controller so a rename is one edit.
/// </summary>
internal static class SessionDefaults
{
    /// <summary>The session-id cookie name. Must match <see cref="SessionOptions.CookieName"/>'s default.</summary>
    public const string CookieName = "ch_session";

    /// <summary>The CSRF cookie name, the non-HttpOnly partner of the session cookie.</summary>
    public const string CsrfCookieName = "ch_csrf";

    /// <summary>The header a browser must send on every unsafe request.</summary>
    public const string CsrfHeaderName = "X-CSRF";

    /// <summary>The short-lived cookie that carries the PKCE verifier and state across the authorize round-trip.</summary>
    public const string PkceCookieName = "ch_pkce";

    /// <summary>The bearer scheme name (the OpenIddict validation scheme).</summary>
    public const string BearerSchemeName = SessionOptions.BearerSchemeName;

    /// <summary>The session scheme name.</summary>
    public const string SessionSchemeName = SessionOptions.SchemeName;

    /// <summary>The policy scheme name that selects between bearer and session per request.</summary>
    public const string MultiSchemeName = SessionOptions.MultiSchemeName;
}