using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace ApiGateway.Authorization;

/// <summary>
/// Grants an <see cref="ActiveAccountRequirement"/> when the access token shows the account is
/// still active, and also when it says nothing about an account at all.
/// </summary>
/// <remarks>
/// <para>
/// The absent-claim case is allowed on purpose. A client-credentials token has no user behind it:
/// the identity server issues it from the client's own registration, so there is no account whose
/// status could be asserted and no account for an administrator to suspend. Refusing those tokens
/// would break every service-to-service call in the solution, including the background workers that
/// are the whole point of the <c>commercehub-services</c> client. The risk that matters is a token
/// that asserts a non-active account, and that case is refused.
/// </para>
/// <para>
/// The alternative reading, "absent means unknown, so refuse it", is the safer-sounding choice and
/// the wrong one: it turns a missing claim into a denial-of-service lever against background work
/// and would be worked around in the first week by whoever owns those workers. The risk that
/// matters is a token that asserts a non-active account, and that case is refused.
/// </para>
/// </remarks>
public sealed class ActiveAccountRequirementHandler : AuthorizationHandler<ActiveAccountRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ActiveAccountRequirement requirement)
    {
        var statuses = context.User?
            .FindAll(ActiveAccountRequirement.StatusClaimType)
            .Select(claim => claim.Value)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .ToArray() ?? [];

        if (statuses.Length == 0)
        {
            // No user, no account state: see the type remarks. A token is only ever missing this
            // claim if it was not issued for a user.
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        if (statuses.Any(status => string.Equals(
                status,
                ActiveAccountRequirement.ActiveStatus,
                StringComparison.OrdinalIgnoreCase)))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // The message names the state the token carries. It reveals nothing the holder of the token
        // does not already know, and it is the single most useful fact when diagnosing why a
        // suspended user can no longer check out.
        context.Fail(new AuthorizationFailureReason(
            this,
            $"The account behind this access token is in state " +
            $"'{string.Join("', '", statuses)}' and only '{ActiveAccountRequirement.ActiveStatus}' " +
            "may use it. Sign in again, or ask an administrator to reactivate the account."));

        return Task.CompletedTask;
    }
}
