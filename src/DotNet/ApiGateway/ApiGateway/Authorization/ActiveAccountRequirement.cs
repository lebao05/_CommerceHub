using Identity.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;

namespace ApiGateway.Authorization;

/// <summary>
/// Rejects a token whose <c>status</c> claim says the account is no longer active.
/// </summary>
/// <remarks>
/// <para>
/// An OAuth 2.0 access token is self-contained: nothing in a downstream service or in the gateway
/// calls the identity server to ask whether the subject is still entitled to what the token grants.
/// Suspending a user would therefore have no effect at all until the access token expired on its
/// own, which is up to an hour for the clients in this solution. Carrying the account's lifecycle
/// state in the token and refusing anything but <c>Active</c> here is what makes a suspension take
/// effect immediately instead of at the next token refresh.
/// </para>
/// <para>
/// The state is checked, not the specific bad value, so that a lifecycle value added later
/// (<c>Deleted</c>, a lockout, a password reset requirement) is refused by default rather than
/// accidentally passing as "not one of the states I thought of".
/// </para>
/// </remarks>
public sealed class ActiveAccountRequirement : IAuthorizationRequirement
{
    /// <summary>
    /// The claim the identity server writes into the access token. Its value is the
    /// <c>Identity.Domain.Enums.UserStatus</c> member name. Sourced from the same constant the
    /// identity server writes it from, so the two cannot drift apart unnoticed.
    /// </summary>
    public const string StatusClaimType = TokenClaimNames.Status;

    /// <summary>
    /// The only value that satisfies this requirement. Compared case-insensitively because the
    /// claim is a serialized enum name and an enum naming convention is not a security control.
    /// </summary>
    public const string ActiveStatus = TokenClaimNames.ActiveStatus;
}
