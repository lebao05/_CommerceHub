using System.Text.Json;
using ApiGateway.Middleware;

namespace ApiGateway.Csrf;

/// <summary>
/// Enforces a double-submit cookie pattern on unsafe HTTP methods from browser-style requests.
/// </summary>
/// <remarks>
/// <para>
/// A request is treated as browser-style when it has a session cookie and no
/// <c>Authorization: Bearer</c> header. A request with no cookie at all is not a session-based
/// request and is not protected here, and a request with a bearer header is service-to-service and
/// is also not protected here. The check applies to POST, PUT, PATCH, and DELETE; safe methods
/// (GET, HEAD, OPTIONS) bypass it because they cannot mutate state on their own.
/// </para>
/// <para>
/// The pattern is double-submit: a non-HttpOnly cookie holds the token, and the caller is
/// required to echo it in the <c>X-CSRF</c> header. An attacker on a different origin cannot set
/// the header from a form submission (the header is the entire point), and cannot read the cookie
/// (cross-origin script cannot), so the two only match for requests the user wrote in the script.
/// </para>
/// <para>
/// The middleware is placed after authentication so that the only paths it has to think about are
/// the ones that successfully reach the body. A 401 short-circuits before CSRF even runs, and a
/// missing session cookie short-circuits before the CSRF check.
/// </para>
/// </remarks>
public sealed class CsrfProtectionMiddleware
{
    /// <summary>HTTP methods considered state-mutating for the purposes of this check.</summary>
    private static readonly HashSet<string> UnsafeMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "POST", "PUT", "PATCH", "DELETE"
    };

    private readonly RequestDelegate _next;
    private readonly ILogger<CsrfProtectionMiddleware> _logger;

    public CsrfProtectionMiddleware(RequestDelegate next, ILogger<CsrfProtectionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!RequiresCsrf(context))
        {
            await _next(context);
            return;
        }

        var cookie = context.Request.Cookies[CsrfDefaults.CookieName] ?? string.Empty;
        var header = context.Request.Headers[CsrfDefaults.HeaderName].ToString();

        if (string.IsNullOrEmpty(cookie) || string.IsNullOrEmpty(header) || !CsrfToken.Equals(cookie, header))
        {
            await RejectAsync(context);
            return;
        }

        await _next(context);
    }

    /// <summary>
    /// True when the request is browser-style and method-mutating.
    /// </summary>
    /// <remarks>
    /// Bearer-authenticated requests bypass the check entirely. The bearer path is server-side and
    /// is the documented API surface for service-to-service callers; a CSRF token on those would be
    /// a maintenance burden rather than a defence, because nothing can mount a cross-origin attack
    /// against a caller that controls the request headers.
    /// </remarks>
    private static bool RequiresCsrf(HttpContext context)
    {
        if (!UnsafeMethods.Contains(context.Request.Method))
        {
            return false;
        }

        var authorization = context.Request.Headers.Authorization.ToString();

        if (authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        // A session cookie is what distinguishes a browser from an anonymous caller. An anonymous
        // browser request never reaches a mutating endpoint behind a [Authorize] anyway, and the
        // controller-level authorization will turn it into a 401. Treating "no session cookie" as
        // "no CSRF check needed" is what keeps the public read endpoints of the catalog from
        // needing the header.
        return context.Request.Cookies.ContainsKey("ch_session");
    }

    private async Task RejectAsync(HttpContext context)
    {
        var correlationId = context.Items.TryGetValue(CorrelationIdMiddleware.ItemKey, out var value)
            ? value as string
            : null;

        // Warning rather than Information. A failed CSRF check is almost always either a developer
        // who forgot to send the header or a probing attacker, and the operator wants to see both.
        // Logging the full set of values would help debugging but would also leak the CSRF token to
        // anyone reading the log line; the correlation id is enough to find the request from the
        // gateway's other log entries.
        _logger.LogWarning(
            "Rejected {Method} {Path} for a missing or mismatched CSRF token ({CorrelationId}).",
            context.Request.Method,
            context.Request.Path,
            correlationId);

        if (context.Response.HasStarted)
        {
            return;
        }

        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        context.Response.ContentType = "application/json; charset=utf-8";

        var body = JsonSerializer.SerializeToUtf8Bytes(new
        {
            succeeded = false,
            error = new
            {
                code = "csrf_failed",
                message = $"The {CsrfDefaults.HeaderName} header is required on this request and must " +
                          $"match the value of the {CsrfDefaults.CookieName} cookie."
            }
        });

        await context.Response.Body.WriteAsync(body);
    }
}