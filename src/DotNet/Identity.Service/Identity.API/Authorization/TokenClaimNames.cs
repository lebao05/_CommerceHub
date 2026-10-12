namespace Identity.API.Authorization;

/// <summary>
/// The non-standard claim names this platform adds to its access tokens.
/// </summary>
public static class TokenClaimNames
{
    /// <summary>The account's kind: Customer, SalesAdmin or SystemAdmin. Mirrors <c>AccountType</c>.</summary>
    public const string AccountType = "account_type";

    /// <summary>
    /// The account's lifecycle state. Written on every issuance and re-read by the gateway, which is
    /// what lets a suspension take effect on the next token.
    /// </summary>
    public const string Status = "status";

    /// <summary>The only <see cref="Status"/> value that is allowed to use a token.</summary>
    public const string ActiveStatus = "Active";
}
