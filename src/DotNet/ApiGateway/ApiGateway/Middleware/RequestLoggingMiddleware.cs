using System.Diagnostics;
using System.Security.Claims;

namespace ApiGateway.Middleware;

/// <summary>
/// Writes one log line per request: method, path, status, elapsed time, correlation id and the
/// caller's subject.
/// </summary>
/// <remarks>
/// <para>
/// The access token is never logged, and neither is any other header. This process sits in front of
/// an authorization server, so its log files are the most likely place for a bearer token to be
/// captured by accident and the least acceptable: a log line is copied into ticketing systems,
/// shipped to log aggregation and retained far longer than a token's lifetime. Only named, already
/// non-secret fields are recorded, which is why the line is assembled from explicit values rather
/// than from a serialized request.
/// </para>
/// <para>
/// Serilog's own request-logging middleware is deliberately not used. It cannot report the caller's
/// subject, and the field set here is fixed by what makes a proxied request diagnosable.
/// </para>
/// </remarks>
public sealed class RequestLoggingMiddleware
{
    /// <summary>
    /// Paths that are not worth a line each. Probes and health checks arrive every few seconds from
    /// whatever is watching the container, and logging them buries the requests that matter.
    /// </summary>
    private static readonly string[] QuietPaths = ["/health", "/favicon.ico"];

    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            Log(context, stopwatch.Elapsed);
        }
    }

    private void Log(HttpContext context, TimeSpan elapsed)
    {
        if (IsQuiet(context.Request.Path))
        {
            return;
        }

        var correlationId = context.Items.TryGetValue(CorrelationIdMiddleware.ItemKey, out var value)
            ? value as string
            : null;

        // The subject only, and only once the pipeline has had the chance to authenticate. On a
        // route with no policy the principal is anonymous and this is null, which is the correct
        // answer rather than a missing field.
        var subject = context.User.FindFirstValue("sub");

        var message = "Handled {Method} {Path} with {StatusCode} in {ElapsedMilliseconds} ms " +
                      "for {Subject} ({CorrelationId})";

        if (context.Response.StatusCode >= StatusCodes.Status500InternalServerError)
        {
            _logger.LogError(message, context.Request.Method, context.Request.Path,
                context.Response.StatusCode, elapsed.TotalMilliseconds, subject ?? "anonymous",
                correlationId);
        }
        else if (context.Response.StatusCode >= StatusCodes.Status400BadRequest)
        {
            // A 4xx is the caller's problem and is worth noticing, but it is not a fault of this
            // process, so it is logged as a warning rather than an error that pages somebody.
            _logger.LogWarning(message, context.Request.Method, context.Request.Path,
                context.Response.StatusCode, elapsed.TotalMilliseconds, subject ?? "anonymous",
                correlationId);
        }
        else
        {
            _logger.LogInformation(message, context.Request.Method, context.Request.Path,
                context.Response.StatusCode, elapsed.TotalMilliseconds, subject ?? "anonymous",
                correlationId);
        }
    }

    private static bool IsQuiet(PathString path) =>
        QuietPaths.Any(quiet => path.StartsWithSegments(quiet, StringComparison.OrdinalIgnoreCase));
}
