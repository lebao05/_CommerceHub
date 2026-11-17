using Microsoft.AspNetCore.Identity;

namespace Identity.Server.Data;

public sealed class ApplicationUser : IdentityUser
{
    public string? Street { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? ZipCode { get; set; }
    public string? Name { get; set; }
    public string? LastName { get; set; }
}
