namespace Identity.API.Models;

/// <summary>
/// Lifecycle of an account. Only <see cref="Active"/> users are allowed to hold a live token: the
/// identity server refuses to issue and to honour refresh tokens for anyone else, so a suspension
/// takes effect on the next token refresh rather than whenever the access token happens to expire.
/// </summary>
public enum UserStatus
{
    Active = 1,
    Inactive = 2,
    Suspended = 3,
    Deleted = 4
}
