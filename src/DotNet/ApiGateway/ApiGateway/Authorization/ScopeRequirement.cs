using Microsoft.AspNetCore.Authorization;

namespace ApiGateway.Authorization;

/// <summary>
/// Requires the validated access token to carry at least one of a set of scopes.
/// </summary>
/// <remarks>
/// One requirement holds a set rather than a single scope so that a route can accept any one of
/// several equivalent privileges without needing a second requirement to pass alongside it. The
/// handler treats the set as "any of", never "all of": an access token is issued with the exact
/// grant the user consented to, so requiring every scope of a service would couple unrelated
/// features together and turn one missing consent into a 403 on all of them.
/// </remarks>
public sealed class ScopeRequirement : IAuthorizationRequirement
{
    /// <param name="scopes">
    /// The acceptable scopes. At least one is required, because a requirement that can never be
    /// satisfied is indistinguishable from a bug at the call site, and an empty one would quietly
    /// succeed or fail depending on the handler's handling of an empty set.
    /// </param>
    /// <exception cref="ArgumentException">No scope was supplied.</exception>
    public ScopeRequirement(params string[] scopes)
    {
        if (scopes is null || scopes.Length == 0)
        {
            throw new ArgumentException(
                "A scope requirement needs at least one scope.", nameof(scopes));
        }

        if (scopes.Any(string.IsNullOrWhiteSpace))
        {
            throw new ArgumentException(
                "A scope requirement cannot contain a null or blank scope.", nameof(scopes));
        }

        Scopes = scopes;
    }

    /// <summary>The scopes that satisfy this requirement, any one of which is enough.</summary>
    public IReadOnlyList<string> Scopes { get; }
}
