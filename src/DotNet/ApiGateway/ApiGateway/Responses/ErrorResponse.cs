using BuildingBlocks.Core.Domain;

namespace ApiGateway.Responses;

/// <summary>
/// Writes error bodies in the shape the rest of this solution already returns.
/// </summary>
/// <remarks>
/// <para>
/// Every microservice in the solution answers a failure with
/// <c>ResultModel&lt;string&gt;.Create(value, isError, message)</c> from BuildingBlocks.Core, either
/// through <c>ResultExtensions.ToHttpResult</c> or through <c>ExceptionMiddleware</c>. The gateway is
/// the one component that produces errors no service produced, so if it invented a second shape the
/// storefront would need one error parser for proxied responses and another for its own. Reusing the
/// type keeps a single parser working for both.
/// </para>
/// <para>
/// The message text is intentionally generic. A gateway sits in front of every service, so an
/// exception message from any of them is a description of this system's internals handed to an
/// anonymous caller. The specifics go to the log, keyed by correlation id, where an operator can
/// find them.
/// </para>
/// </remarks>
public static class ErrorResponse
{
    /// <summary>
    /// Serializes the error envelope and sets the status code.
    /// </summary>
    /// <remarks>
    /// Does nothing if the response has already started. That is not a race to be retried: once
    /// bytes are on the wire the status line and content type are already committed, and appending
    /// a JSON object to a partial stream would corrupt the body. The caller logs instead.
    /// </remarks>
    public static async Task WriteAsync(HttpContext context, int statusCode, string message)
    {
        if (context.Response.HasStarted)
        {
            return;
        }

        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json; charset=utf-8";

        await context.Response.WriteAsJsonAsync(
            ResultModel<string>.Create(string.Empty, true, message),
            context.RequestAborted);
    }
}
