namespace Identity.API.Models;

// =====================================================================
// Administrative flow: operations on other people's accounts.
// =====================================================================

public sealed record AdminUserResponse(
    Guid Id,
    string Email,
    bool EmailConfirmed,
    string FullName,
    string AccountType,
    string Status,
    bool LockoutEnabled,
    DateTimeOffset? LockoutEnd,
    IReadOnlyList<string> Roles,
    DateTime CreatedAt,
    DateTime? LastLoginAt);

public sealed record ChangeUserRoleRequest(
    string Email,
    string Role,
    bool Grant);

public sealed record ChangeUserStatusRequest(
    string Email,
    string Status);
