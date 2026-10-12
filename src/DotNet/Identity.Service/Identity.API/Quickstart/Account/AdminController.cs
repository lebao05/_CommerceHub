using FluentValidation;
using Identity.API.Authorization;
using Identity.API.Data;
using Identity.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OpenIddict.Abstractions;
using System.Security.Claims;
using static OpenIddict.Abstractions.OpenIddictConstants;

using IResult = Microsoft.AspNetCore.Http.IResult;

namespace Identity.API.Quickstart.Account;

/// <summary>
/// Administrative operations on other people's accounts: listing them, changing a role, changing a
/// status.
/// </summary>
/// <remarks>
/// Guarded by the <see cref="AuthorizationPolicies.AdminFull"/> policy, which requires the
/// <c>SystemAdmin</c> role.
/// </remarks>
[Route("api/identity/users")]
[Authorize(Policy = AuthorizationPolicies.AdminFull)]
public sealed class AdminController(
    UserManager<ApplicationUser> userManager,
    RoleManager<ApplicationRole> roleManager,
    IOpenIddictTokenManager tokenManager,
    ILogger<AdminController> logger) : ControllerBase
{
    /// <summary>Lists accounts, newest first.</summary>
    [HttpGet]
    public async Task<IResult> List(CancellationToken cancellationToken)
    {
        var ordered = userManager.Users.OrderByDescending(user => user.CreatedAt).ToList();
        var responses = new List<AdminUserResponse>(ordered.Count);

        foreach (var user in ordered)
        {
            responses.Add(new AdminUserResponse(
                user.Id,
                user.Email ?? string.Empty,
                user.EmailConfirmed,
                user.FullName,
                user.AccountType.ToString(),
                user.Status.ToString(),
                user.LockoutEnabled,
                user.LockoutEnd,
                (await userManager.GetRolesAsync(user)).ToList(),
                user.CreatedAt,
                user.LastLoginAt));
        }

        return Results.Ok(responses);
    }

    /// <summary>Grants or revokes one role on one account.</summary>
    [HttpPost("roles")]
    public async Task<IResult> ChangeRole(
        [FromBody] ChangeUserRoleRequest request,
        [FromServices] IValidator<ChangeUserRoleRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Invalid(validation.Errors.Select(error => error.ErrorMessage));
        }

        var user = await userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null)
        {
            return Results.NotFound(new { error = "UserNotFound", message = "The requested user was not found." });
        }

        if (!ApplicationRoles.IsKnown(request.Role))
        {
            return Results.BadRequest(new { error = "RoleNotFound", message = "The requested role was not found." });
        }

        if (!await roleManager.RoleExistsAsync(request.Role))
        {
            return Results.BadRequest(new { error = "RoleNotFound", message = "The requested role was not found." });
        }

        // Removing the last administrator would leave the platform with nobody able to administer it.
        if (!request.Grant && await IsLastSystemAdministratorAsync(user, request.Role))
        {
            return Results.BadRequest(new { error = "CannotRemoveLastAdmin", message = "The last remaining administrator cannot be demoted or removed." });
        }

        if (IsSelf(user))
        {
            return Results.BadRequest(new { error = "SelfModificationNotAllowed", message = "Use the account endpoints to change your own roles or status." });
        }

        var result = request.Grant
            ? await userManager.AddToRoleAsync(user, request.Role)
            : await userManager.RemoveFromRoleAsync(user, request.Role);

        if (!result.Succeeded)
        {
            return Results.BadRequest(new
            {
                error = "RoleChangeFailed",
                message = string.Join("; ", result.Errors.Select(e => e.Description))
            });
        }

        logger.LogInformation(
            "Administrator {Actor} {Action} role {Role} for {Email}.",
            CurrentSubject(), request.Grant ? "granted" : "revoked", request.Role, user.Email);

        return Results.Ok(new { message = request.Grant ? "Role granted." : "Role revoked." });
    }

    /// <summary>Changes an account's lifecycle state.</summary>
    [HttpPost("status")]
    public async Task<IResult> ChangeStatus(
        [FromBody] ChangeUserStatusRequest request,
        [FromServices] IValidator<ChangeUserStatusRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Invalid(validation.Errors.Select(error => error.ErrorMessage));
        }

        var user = await userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null)
        {
            return Results.NotFound(new { error = "UserNotFound", message = "The requested user was not found." });
        }

        var status = Enum.Parse<UserStatus>(request.Status, ignoreCase: true);

        if (IsSelf(user) && status != UserStatus.Active)
        {
            return Results.BadRequest(new { error = "SelfModificationNotAllowed", message = "Use the account endpoints to change your own roles or status." });
        }

        if (status != UserStatus.Active && await IsLastSystemAdministratorAsync(user, ApplicationRoles.SystemAdmin))
        {
            return Results.BadRequest(new { error = "CannotRemoveLastAdmin", message = "The last remaining administrator cannot be demoted or removed." });
        }

        user.Status = status;
        user.UpdatedAt = DateTime.UtcNow;

        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return Results.BadRequest(new
            {
                error = "UpdateFailed",
                message = string.Join("; ", result.Errors.Select(e => e.Description))
            });
        }

        // Suspending or otherwise removing the user from Active revokes every live access and
        // refresh token they hold.
        if (status != UserStatus.Active)
        {
            var revoked = 0;
            var tokens = tokenManager.FindBySubjectAsync(user.Id.ToString(), cancellationToken);

            await foreach (var token in tokens.WithCancellation(cancellationToken))
            {
                var tokenStatus = await tokenManager.GetStatusAsync(token, cancellationToken);
                if (!string.Equals(tokenStatus, Statuses.Valid, StringComparison.Ordinal))
                {
                    continue;
                }

                if (await tokenManager.TryRevokeAsync(token, cancellationToken))
                {
                    revoked++;
                }
            }

            logger.LogWarning(
                "Administrator {Actor} set {Email} to {Status} and revoked {Count} token(s).",
                CurrentSubject(), user.Email, status, revoked);
        }
        else
        {
            logger.LogWarning(
                "Administrator {Actor} set {Email} to {Status}.",
                CurrentSubject(), user.Email, status);
        }

        return Results.Ok(new { message = "Account status updated." });
    }

    private async Task<bool> IsLastSystemAdministratorAsync(ApplicationUser user, string role)
    {
        if (!string.Equals(role, ApplicationRoles.SystemAdmin, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!await userManager.IsInRoleAsync(user, ApplicationRoles.SystemAdmin))
        {
            return false;
        }

        var administrators = await userManager.GetUsersInRoleAsync(ApplicationRoles.SystemAdmin);
        return administrators.Count <= 1;
    }

    private bool IsSelf(ApplicationUser user) =>
        Guid.TryParse(CurrentSubject(), out var subject) && subject == user.Id;

    private string? CurrentSubject() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;

    private static IResult Invalid(IEnumerable<string> messages) => Results.BadRequest(
        new { error = "ValidationFailed", message = string.Join("; ", messages) });
}
