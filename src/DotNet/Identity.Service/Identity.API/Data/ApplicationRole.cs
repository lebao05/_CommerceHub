using Microsoft.AspNetCore.Identity;

namespace Identity.API.Data;

/// <summary>
/// An application role. Roles are what role-based policies such as "Admin" are matched against, so
/// the names here are the vocabulary of every <c>RequireRole</c> call across the gateway and the
/// downstream services.
/// </summary>
public class ApplicationRole : IdentityRole<Guid>
{
    public string? Description { get; set; }
}
