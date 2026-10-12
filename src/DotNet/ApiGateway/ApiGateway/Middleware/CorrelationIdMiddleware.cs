using System.Diagnostics;

namespace ApiGateway.Middleware;

/// <summary>
/// Gives every request a correlation id, echoes it back, and puts it into the logging scope.
/// </summary>
/// <remarks>
/// <para>
/// The gateway is the front door to five services that log independently. Without an id that travels
/// with the request, answering "why did this checkout fail" means correlating five log files by
/// timestamp, which is exactly the work a correlation id exists to remove.
/// </para>
/// <para>
/// An inbound id is trusted only after it has been checked. It is echoed into a response header and
/// into a log line, so an unchecked value is both a response-splitting vector and a log-forging one:
/// a caller could otherwise write its own line into this application's log. Anything containing a
/// control character, or longer than <see cref="MaxLength"/>, is discarded and replaced.
/// </para>
/// </remarks>
public sealed class CorrelationIdMiddleware
{
    /// <summary>The header the id is read from and written to.</summary>
    public const string HeaderName = "X-Correlation-Id";

    /// <summary>
    /// The item key the id is stored under, for middleware that runs after this one.
    /// </summary>
    public const string ItemKey = "ApiGateway.CorrelationId";

    /// <summary>
    /// Longest id accepted from a caller. 128 characters is well beyond any real trace id and keeps
    /// a caller from using the header as a way to push megabytes into this application's logs.
    /// </summary>
    public const int MaxLength = 128;

    private readonly RequestDelegate _next;
    private readonly ILogger<CorrelationIdMiddleware> _logger;

    public CorrelationIdMiddleware(RequestDelegate next, ILogger<CorrelationIdMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = Resolve(context);

        context.Items[ItemKey] = correlationId;

        // Set before the rest of the pipeline runs, because once a proxied response starts
        // streaming the status line and headers are already committed and this would be ignored.
        context.Response.Headers[HeaderName] = correlationId;

        // A dictionary scope, not a string. Serilog promotes each entry to a property, which is
        // what makes the id queryable in the log sink; a plain string would be interpolated into
        // the message and could no longer be filtered on.
        using var scope = _logger.BeginScope(new Dictionary<string, object>(StringComparer.Ordinal)
        {
            [HeaderName] = correlationId
        });

        await _next(context);
    }

    /// <summary>
    /// Returns the caller's id when it is usable, and a fresh one otherwise.
    /// </summary>
    private static string Resolve(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue(HeaderName, out var supplied))
        {
            var candidate = supplied.ToString();

            if (!string.IsNullOrWhiteSpace(candidate)
                && candidate.Length <= MaxLength
                && !candidate.Any(char.IsControl))
            {
                return candidate;
            }
        }

        // TraceContext keeps the id consistent with whatever the rest of the distributed trace is
        // using, so a request that arrives with W3C trace headers stays joinable by a log analyser.
        return Activity.Current?.TraceId.ToString() ?? Guid.NewGuid().ToString("N");
    }
}
