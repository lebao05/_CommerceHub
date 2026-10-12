using Identity.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Identity.API.Data;

/// <summary>
/// Holds the ASP.NET Core Identity tables alongside the OpenIddict tables (applications, scopes,
/// authorizations, tokens). The two share the same database so a single migration brings a fresh
/// store up to a state that can issue and validate tokens.
/// </summary>
public class IdentityDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
    public IdentityDbContext(DbContextOptions<IdentityDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // OpenIddict's applications, authorizations, scopes and tokens. Sharing the same DbContext
        // keeps a single transaction around the rotate-and-issue sequence in /api/auth/refresh.
        builder.UseOpenIddict();

        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(user => user.FirstName).HasMaxLength(128).IsRequired();
            entity.Property(user => user.LastName).HasMaxLength(128).IsRequired();
            entity.Property(user => user.ProfilePictureUrl).HasMaxLength(512);
            entity.Property(user => user.LastLoginIp).HasMaxLength(64);

            entity.HasIndex(user => user.Status).HasDatabaseName("IX_AspNetUsers_Status");
            entity.HasIndex(user => user.NormalizedEmail).HasDatabaseName("IX_AspNetUsers_NormalizedEmail");
        });

        builder.Entity<ApplicationRole>(entity =>
        {
            entity.Property(role => role.Description).HasMaxLength(512);
        });
    }
}
