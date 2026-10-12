using Identity.API.Models;
using Microsoft.AspNetCore.Identity;

namespace Identity.API.Data;

/// <summary>
/// The application user. Extends ASP.NET Core Identity's <see cref="IdentityUser{TKey}"/> with the
/// commerce-specific fields rather than replacing it, so password hashing, lockout and the security
/// stamp keep working as the framework intends.
/// </summary>
public class ApplicationUser : IdentityUser<Guid>
{
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string? ProfilePictureUrl { get; set; }

    public UserStatus Status { get; set; } = UserStatus.Active;

    public AccountType AccountType { get; set; } = AccountType.Customer;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public string? LastLoginIp { get; set; }

    public string FullName => $"{FirstName} {LastName}".Trim();
}
