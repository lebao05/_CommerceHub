namespace Identity.API.Models;

// =====================================================================
// Self-service account flow: register, password recovery, profile.
// =====================================================================

public sealed record RegisterRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string? PhoneNumber = null);

public sealed record ForgotPasswordRequest(string Email);

public sealed record ResetPasswordRequest(
    string Email,
    string Token,
    string NewPassword);

public sealed record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword);

public sealed record UpdateProfileRequest(
    string FirstName,
    string LastName,
    string? PhoneNumber,
    string? ProfilePictureUrl);

public sealed record UserProfileResponse(
    Guid Id,
    string Email,
    bool EmailConfirmed,
    string FirstName,
    string LastName,
    string FullName,
    string? PhoneNumber,
    string? ProfilePictureUrl,
    string AccountType,
    string Status,
    bool TwoFactorEnabled,
    IReadOnlyList<string> Roles,
    DateTime CreatedAt,
    DateTime? LastLoginAt);
