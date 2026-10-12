namespace ApiGateway.Sessions;

/// <summary>
/// The data the session cookie references. Stored in Redis, keyed by an opaque session id.
/// </summary>
/// <remarks>
/// <para>
/// The access token is stored alongside the refresh token so the gateway can hand the bearer
/// through to a downstream service that grows its own token validation later. Forwarding the same
/// principal the gateway authenticated is what stops a service validating against a different
/// identity server or noticing that two tokens disagree on claims.
/// </para>
/// <para>
/// <see cref="AbsoluteExpiresAt"/> is fixed at session creation and never moves. <see cref="IdleExpiresAt"/>
/// is recomputed on every hit. The handler treats the earlier of the two as the moment the session
/// stops existing.
/// </para>
/// </remarks>
public sealed record class SessionRecord
{
    /// <summary>The token's <c>sub</c> claim. The lookup key for the user.</summary>
    public required string Subject { get; init; }

    /// <summary>The client the session was opened for (e.g. <c>commercehub-web</c>).</summary>
    public required string ClientId { get; init; }

    /// <summary>The granted scopes, split on whitespace the way OAuth 2.0 requires.</summary>
    public required IReadOnlyList<string> Scopes { get; init; }

    /// <summary>The roles the identity server stamped into the principal.</summary>
    public required IReadOnlyList<string> Roles { get; init; }

    /// <summary>
    /// The token's <c>account_type</c> claim (<c>Customer</c>, <c>SalesAdmin</c>, <c>SystemAdmin</c>).
    /// </summary>
    public string? AccountType { get; init; }

    /// <summary>The token's <c>status</c> claim. <c>Active</c> is the only value that grants access.</summary>
    public string? Status { get; init; }

    /// <summary>The access token the gateway can forward to downstream services.</summary>
    public required string AccessToken { get; init; }

    /// <summary>
    /// The refresh token, used by the handler when the access token is about to expire. <c>null</c>
    /// for flows that do not issue one (client-credentials).
    /// </summary>
    public string? RefreshToken { get; init; }

    /// <summary>When the access token stops being valid, per the identity server.</summary>
    public DateTimeOffset AccessTokenExpiresAt { get; init; }

    /// <summary>When the session was created. Used as the absolute-expiry anchor.</summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the session was last used. The idle timer is anchored here on every refresh.</summary>
    public DateTimeOffset LastSeenAt { get; init; }

    /// <summary>
    /// When the session stops existing no matter how often it is refreshed. Set on creation and
    /// never moved.
    /// </summary>
    public DateTimeOffset AbsoluteExpiresAt { get; init; }

    /// <summary>The new idle-expiry anchor after the most recent refresh.</summary>
    public DateTimeOffset IdleExpiresAt { get; set; }
}