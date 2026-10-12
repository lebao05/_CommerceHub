using System.Text;
using ApiGateway.Configuration;
using ApiGateway.Responses;
using OpenIddict.Abstractions;

namespace ApiGateway.Middleware;

/// <summary>
/// Turns a rejected access token into a 401 instead of letting it become a 500.
/// </summary>
/// <remarks>
/// <para>
/// This middleware exists because of a specific, verified behaviour of OpenIddict 7.7.1. When token
/// validation fails -- a forged signature, an unknown key id, an expired token, a token whose
/// <c>iss</c> is not the configured issuer -- the validation handler throws
/// <see cref="OpenIddictExceptions.ValidationException"/>. The ASP.NET Core authentication pipeline
/// does not catch it: neither <c>AuthenticationHandler</c> nor <c>AuthenticationMiddleware</c> wraps
/// the call, so the exception unwinds past <c>UseAuthentication</c> and past
/// <c>UseAuthorization</c>.
/// </para>
/// <para>
/// Left alone it lands in <see cref="ExceptionHandlingMiddleware"/>, which is correct for a fault in
/// the gateway and badly wrong for a bad token. The caller would get a 500 for sending a token that
/// was their own mistake, which tells them nothing and tells an operator that the gateway is broken
/// when it is not. RFC 6750 section 3 requires 401 with
/// <c>WWW-Authenticate: Bearer error="invalid_token"</c> for exactly this case. An observed run
/// before this middleware existed returned 500 for a forged token, which is what prompted it.
/// </para>
/// <para>
/// It is registered outside <see cref="ExceptionHandlingMiddleware"/>, not inside it, and that is
/// load-bearing. Middleware runs in registration order, outermost first, and an exception handler
/// only sees what reaches it. Placed after the exception handler this middleware would be dead
/// code, because the 500 would already have been written. Placed before it, it intercepts the one
/// exception type it owns and lets every other exception fall through to the 500 path untouched.
/// </para>
/// <para>
/// The <c>error_description</c> is deliberately generic. The precise reason -- bad signature versus
/// expired versus unknown key -- is written to the log against the correlation id. Echoing it back
/// would tell an anonymous caller which part of a forged token to fix, which is a free oracle for
/// an attacker probing the gateway.
/// </para>
/// </remarks>
public sealed class TokenValidationExceptionMiddleware
{
    /// <summary>
    /// The realm advertised in the challenge. RFC 6750 defines it as a scope of protection on the
    /// authorization server, and the issuer's authority is the only thing here that identifies one.
    /// </summary>
    private readonly string _realm;

    private readonly RequestDelegate _next;
    private readonly ILogger<TokenValidationExceptionMiddleware> _logger;

    public TokenValidationExceptionMiddleware(
        RequestDelegate next,
        ILogger<TokenValidationExceptionMiddleware> logger,
        IdentityEndpoints endpoints)
    {
        _next = next;
        _logger = logger;
        _realm = endpoints.Issuer.Authority;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (OpenIddictExceptions.ValidationException exception)
        {
            await HandleAsync(context, exception);
        }
    }

    private async Task HandleAsync(HttpContext context, OpenIddictExceptions.ValidationException exception)
    {
        var correlationId = context.Items.TryGetValue(CorrelationIdMiddleware.ItemKey, out var value)
            ? value as string
            : null;

        // Same reasoning as the exception handler: a caller that has gone away is not a token
        // problem, and writing a 401 to a connection nobody is reading only produces noise.
        if (context.RequestAborted.IsCancellationRequested)
        {
            _logger.LogInformation(
                "The request was abandoned by the caller. {Method} {Path} ({CorrelationId})",
                context.Request.Method,
                context.Request.Path,
                correlationId);

            return;
        }

        // Warning, not Error. A rejected token is an expected event on a public gateway and often the
        // caller's own bug, and logging it at Error would bury the faults that matter under the
        // volume of a client sending a stale token on every request. The full OpenIddict message,
        // which names the actual failure, goes along so an operator does not have to guess.
        _logger.LogWarning(
            exception,
            "Rejected the access token on {Method} {Path} ({CorrelationId})",
            context.Request.Method,
            context.Request.Path,
            correlationId);

        // The response may already be committed if the failure surfaced after the proxy had begun
        // streaming a downstream body. There is then no status line left to correct, and appending a
        // JSON envelope to a partial stream would corrupt what the caller is reading.
        if (context.Response.HasStarted)
        {
            _logger.LogWarning(
                "The response had already started, so no 401 could be written. The caller will see " +
                "a truncated body. ({CorrelationId})",
                correlationId);

            return;
        }

        context.Response.Headers.WWWAuthenticate = BuildChallengeHeader();

        await ErrorResponse.WriteAsync(
            context,
            StatusCodes.Status401Unauthorized,
            "The access token is missing, expired or not valid. Obtain a new token and send it in the " +
            "Authorization header as 'Bearer <token>'.");
    }

    /// <summary>
    /// Builds the RFC 6750 challenge header by hand rather than delegating to
    /// <c>HttpContext.ChallengeAsync</c>.
    /// </summary>
    /// <remarks>
    /// Re-entering the challenge would run OpenIddict's own challenge handler over the same request
    /// that has just thrown, and the only thing that separates a successful challenge from a second
    /// throw is the shape of the failure. Writing the header directly is deterministic, cannot loop,
    /// and produces the same three fields the framework would have written.
    /// </remarks>
    private string BuildChallengeHeader()
    {
        var builder = new StringBuilder()
            .Append("Bearer realm=").Append('"').Append(_realm).Append('"')
            .Append(", error=\"invalid_token\"")
            .Append(", error_description=\"The access token is missing, expired or not valid.\"");

        return builder.ToString();
    }
}
