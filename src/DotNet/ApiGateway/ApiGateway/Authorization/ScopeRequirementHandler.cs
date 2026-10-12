using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace ApiGateway.Authorization;

/// <summary>
/// Grants a <see cref="ScopeRequirement"/> when the validated principal's <c>scope</c> claim
/// contains at least one of the required scopes.
/// </summary>
/// <remarks>
/// <para>
/// The claim is read from <see cref="AuthorizationHandlerContext.User"/>, which for a protected
/// route is the principal OpenIddict produced after verifying the token's signature against the
/// identity server's published keys. Reading a header instead would authorize on something the
/// caller chose.
/// </para>
/// <para>
/// Splitting on whitespace rather than comparing the claim whole is what OAuth 2.0 actually
/// specifies, and it is also why the check has to tolerate the claim arriving more than once: a
/// JSON Web Token normally carries one space-delimited <c>scope</c> claim, but a token that has been
/// through a token-introspection response or a claim-mapping pass can arrive as several values.
/// Treating only the first as authoritative would silently drop scopes.
/// </para>
/// </remarks>
public sealed class ScopeRequirementHandler : AuthorizationHandler<ScopeRequirement>
{
    /// <summary>
    /// The claim that carries the granted scopes. Spelled out here rather than taken from
    /// <c>OpenIddictConstants.Claims.Private.Scope</c> so that the gateway's dependency on the
    /// token's shape is visible in one place.
    /// </summary>
    private const string ScopeClaimType = "scope";

    /// <summary>
    /// Separates scopes inside a single claim value. OAuth 2.0 defines the value as
    /// space-delimited (<c>scope = "order.read order.write"</c>), and RFC 6749 forbids a space
    /// inside a scope token, so a plain split on whitespace is exact rather than a shortcut.
    /// </summary>
    private static readonly char[] ScopeSeparators = [' ', '\t', '\r', '\n'];

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ScopeRequirement requirement)
    {
        var granted = ReadGrantedScopes(context.User);

        if (granted.Count == 0)
        {
            // A missing or empty scope claim is the normal shape of an access token issued to a
            // client that was granted nothing, and of a hand-rolled token. Failing with a message
            // rather than silently succeeding is the point: a route that expects a scope must never
            // be reachable without one.
            context.Fail(new AuthorizationFailureReason(
                this,
                $"The access token carries no '{ScopeClaimType}' claim, so it cannot satisfy the " +
                $"required scope(s) {string.Join(", ", requirement.Scopes)}."));

            return Task.CompletedTask;
        }

        if (requirement.Scopes.Any(granted.Contains))
        {
            context.Succeed(requirement);
        }
        else
        {
            // The scopes actually held are deliberately not included in the message. Reporting them
            // would turn a 403 into an oracle for enumerating another user's privileges, and the
            // requirement is a public, already-documented part of the API surface.
            context.Fail(new AuthorizationFailureReason(
                this,
                $"The access token does not grant any of the scope(s) required by this route: " +
                $"{string.Join(", ", requirement.Scopes)}."));
        }

        return Task.CompletedTask;
    }

    /// <summary>
    /// Collects every scope in the token, whether it arrived as one space-delimited value or as
    /// several <c>scope</c> claims.
    /// </summary>
    private static HashSet<string> ReadGrantedScopes(ClaimsPrincipal? principal)
    {
        var granted = new HashSet<string>(StringComparer.Ordinal);

        if (principal is null)
        {
            return granted;
        }

        foreach (var claim in principal.FindAll(ScopeClaimType))
        {
            foreach (var scope in claim.Value.Split(ScopeSeparators, StringSplitOptions.RemoveEmptyEntries))
            {
                granted.Add(scope);
            }
        }

        return granted;
    }
}
