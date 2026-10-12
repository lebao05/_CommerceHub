namespace Identity.API.Models;

// =====================================================================
// Authentication flow: token endpoints (/api/auth/login, /refresh, /revoke).
// =====================================================================

public sealed record LoginRequest(string Email, string Password);

public sealed record LoginResponse(
    string AccessToken,
    DateTime AccessTokenExpiresAtUtc,
    string? RefreshToken,
    DateTime? RefreshTokenExpiresAtUtc,
    IReadOnlyList<string> Roles);

public sealed record RefreshRequest(string RefreshToken);

public sealed record RevokeRequest(string? RefreshToken);

public sealed record MessageResponse(string Message);
