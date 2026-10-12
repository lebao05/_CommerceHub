using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;

namespace ApiGateway.Authorization;

/// <summary>
/// Runs after the authorization middleware has decided, and turns a "forbidden" decision into a body
/// the caller can act on.
/// </summary>
/// <remarks>
/// <para>
/// The framework's own result handler sets a 403 status and writes nothing. For a machine client
/// that is nearly useless: the request failed and the response says nothing about why. Since this
/// gateway is the only enforcement point for the whole solution, a caller that cannot tell a missing
/// scope from a suspended account from a route that needs no token at all will spend its debugging
/// time in the wrong place.
/// </para>
/// <para>
/// The replacement message is derived from the policy's own requirements, not from the reason a
/// handler failed with. That keeps it accurate for whichever policy ran, and it keeps the handler
/// failure reasons out of the response, where they would be an enumeration oracle for a caller's own
/// privileges.
/// </para>
/// </remarks>
public sealed class GatewayAuthorizationResultHandler : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler _default = new();
    private readonly ILogger<GatewayAuthorizationResultHandler> _logger;

    /// <param name="logger">Records a 403 so a rejected request leaves a trace without a body.</param>
    public GatewayAuthorizationResultHandler(ILogger<GatewayAuthorizationResultHandler> logger)
    {
        _logger = logger;
    }

    public async Task HandleAsync(
        RequestDelegate next,
        HttpContext context,
        AuthorizationPolicy policy,
        PolicyAuthorizationResult authorizeResult)
    {
        // The default handler owns the challenge: it turns an unauthenticated request into a 401
        // with a WWW-Authenticate header, which is what makes the bearer flow work at all. It also
        // owns the short-circuit when the policy is satisfied, so nothing below may run in that case.
        await _default.HandleAsync(next, context, policy, authorizeResult);

        if (authorizeResult.Succeeded || context.Response.HasStarted)
        {
            return;
        }

        if (context.Response.StatusCode != StatusCodes.Status403Forbidden)
        {
            return;
        }

        var reason = Describe(policy);

        _logger.LogInformation(
            "Denied {Method} {Path}. {Reason}",
            context.Request.Method,
            context.Request.Path,
            reason);

        await Responses.ErrorResponse.WriteAsync(context, StatusCodes.Status403Forbidden, reason);
    }

    /// <summary>
    /// Builds a message naming the policy's own requirements. The required scopes are part of the
    /// published API surface (they are in the Swagger security definition), so repeating them costs
    /// nothing; what the caller actually holds does not appear.
    /// </summary>
    private static string Describe(AuthorizationPolicy? policy)
    {
        if (policy is null)
        {
            return "The request was not authorized.";
        }

        var scopes = policy.Requirements
            .OfType<ScopeRequirement>()
            .SelectMany(requirement => requirement.Scopes)
            .ToArray();

        var requiresActiveAccount = policy.Requirements.Any(r => r is ActiveAccountRequirement);

        if (scopes.Length == 0)
        {
            return requiresActiveAccount
                ? "This route requires an access token issued for an account in state " +
                  $"'{ActiveAccountRequirement.ActiveStatus}'."
                : "This route requires an authenticated caller.";
        }

        return "This route requires an access token issued for an account in state " +
               $"'{ActiveAccountRequirement.ActiveStatus}' and carrying one of the scopes: " +
               $"{string.Join(", ", scopes)}.";
    }
}
