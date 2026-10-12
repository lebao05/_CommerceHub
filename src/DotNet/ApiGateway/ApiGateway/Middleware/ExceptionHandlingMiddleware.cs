using ApiGateway.Responses;

namespace ApiGateway.Middleware;

/// <summary>
/// Turns an unhandled exception into a 500 with the solution's standard JSON error body, and logs
/// the exception against the request's correlation id.
/// </summary>
/// <remarks>
/// <para>
/// This is the gateway's only backstop. The individual services have their own
/// <c>ExceptionMiddleware</c> and will usually handle their own failures, so anything reaching this
/// one is either a failure in the gateway itself or a failure that happened while the gateway was
/// talking to a service before that service could respond.
/// </para>
/// <para>
/// The body says nothing about what went wrong. A gateway fronts every service, so an exception
/// message that escaped one of them is a map of this system's internals handed to an anonymous
/// caller. The detail goes to the log with the correlation id, which is also on the response, so the
/// caller can quote it and an operator can find the line.
/// </para>
/// </remarks>
public sealed class ExceptionHandlingMiddleware
{
    private const string GenericMessage =
        "The gateway could not complete the request. Quote the correlation id when reporting this.";

    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            await HandleAsync(context, exception);
        }
    }

    private async Task HandleAsync(HttpContext context, Exception exception)
    {
        var correlationId = context.Items.TryGetValue(CorrelationIdMiddleware.ItemKey, out var value)
            ? value as string
            : null;

        // A cancelled request is the caller going away, not a fault. Writing a body to a connection
        // nobody is reading any more only produces noise, and the response is already gone.
        if (context.RequestAborted.IsCancellationRequested)
        {
            _logger.LogInformation(
                exception,
                "The request was abandoned by the caller. {Method} {Path} ({CorrelationId})",
                context.Request.Method,
                context.Request.Path,
                correlationId);

            return;
        }

        _logger.LogError(
            exception,
            "Unhandled exception while handling {Method} {Path} ({CorrelationId})",
            context.Request.Method,
            context.Request.Path,
            correlationId);

        if (context.Response.HasStarted)
        {
            // Bytes are already on the wire. There is no honest way to change the status now, and
            // appending a JSON object to a partial stream would corrupt whatever the caller is
            // still reading. The exception is logged, which is all that is left to do.
            _logger.LogWarning(
                "The response had already started, so no error body could be written. " +
                "The caller will see a truncated body. ({CorrelationId})",
                correlationId);

            return;
        }

        await ErrorResponse.WriteAsync(context, StatusCodes.Status500InternalServerError, GenericMessage);
    }
}
