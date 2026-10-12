using ApiGateway.Sessions;

namespace ApiGateway.Csrf;

/// <summary>
/// Names shared between the CSRF middleware and the OAuth controller's cookie setters.
/// </summary>
/// <remarks>
/// The CSRF cookie name and the header name are paired: a request is considered protected when the
/// header matches the cookie value, so changing one without the other would silently disable the
/// check. Held here so the two stay together.
/// </remarks>
internal static class CsrfDefaults
{
    /// <summary>The cookie name. JavaScript reads this to populate the header.</summary>
    public const string CookieName = SessionDefaults.CsrfCookieName;

    /// <summary>The header a browser must send on every unsafe request.</summary>
    public const string HeaderName = SessionDefaults.CsrfHeaderName;

    /// <summary>The number of random bytes in a CSRF token.</summary>
    public const int TokenByteLength = 32;
}