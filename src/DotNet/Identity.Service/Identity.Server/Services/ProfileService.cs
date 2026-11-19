using System.Security.Claims;
using Duende.IdentityServer.Models;
using Duende.IdentityServer.Services;
using Identity.Server.Data;
using Microsoft.AspNetCore.Identity;

namespace Identity.Server;

public sealed class ProfileService(UserManager<ApplicationUser> userManager) : IProfileService
{
    public async Task GetProfileDataAsync(
        ProfileDataRequestContext context,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.GetUserAsync(context.Subject);
        if (user is null)
        {
            return;
        }

        var claims = new List<Claim>();
        claims.AddRange(await userManager.GetClaimsAsync(user));
        claims.AddRange((await userManager.GetRolesAsync(user)).Select(role => new Claim("role", role)));
        AddClaim(claims, "name", JoinName(user.Name, user.LastName));
        AddClaim(claims, "last_name", user.LastName);
        AddClaim(claims, "given_name", user.Name);
        AddClaim(claims, "family_name", user.LastName);
        AddClaim(claims, "email", user.Email);
        claims.Add(new Claim("email_verified", user.EmailConfirmed ? "true" : "false"));
        AddClaim(claims, "preferred_username", user.UserName);
        claims.AddRange(context.Subject.FindAll("act"));
        AddClaim(claims, "address_street", user.Street);
        AddClaim(claims, "address_city", user.City);
        AddClaim(claims, "address_state", user.State);
        AddClaim(claims, "address_country", user.Country);
        AddClaim(claims, "address_zip_code", user.ZipCode);

        var requested = context.RequestedClaimTypes.ToHashSet(StringComparer.Ordinal);
        if (requested.Count == 0)
        {
            return;
        }

        context.IssuedClaims.AddRange(claims
            .Where(claim => requested.Contains(claim.Type))
            .DistinctBy(claim => (claim.Type, claim.Value)));
    }

    public async Task IsActiveAsync(IsActiveContext context, CancellationToken cancellationToken = default)
    {
        var user = await userManager.GetUserAsync(context.Subject);
        context.IsActive = user is not null
            && await userManager.IsEmailConfirmedAsync(user)
            && !await userManager.IsLockedOutAsync(user);
    }

    private static void AddClaim(List<Claim> claims, string type, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value))
        {
            claims.Add(new Claim(type, value));
        }
    }

    private static string? JoinName(string? firstName, string? lastName)
    {
        var fullName = string.Join(' ', new[] { firstName, lastName }.Where(value =>
            !string.IsNullOrWhiteSpace(value)));
        return fullName.Length == 0 ? null : fullName;
    }
}
