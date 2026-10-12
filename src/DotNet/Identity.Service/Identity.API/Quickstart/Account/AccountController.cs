using FluentValidation;
using Identity.API.Authorization;
using Identity.API.Data;
using Identity.API.Models;
using Identity.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;

using IResult = Microsoft.AspNetCore.Http.IResult;

namespace Identity.API.Quickstart.Account;

/// <summary>
/// The JSON account surface: registration, password recovery, and the caller's own profile.
/// </summary>
[Route("api/auth")]
public sealed class AccountController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    IEmailService emailService,
    IConfiguration configuration,
    ILogger<AccountController> logger) : ControllerBase
{
    private string ClientUri => configuration["ClientUri"] ?? "http://localhost:5173";

    /// <summary>
    /// Creates an account and emails a confirmation link.
    /// </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IResult> Register(
        [FromBody] RegisterRequest request,
        [FromServices] IValidator<RegisterRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Invalid(validation.Errors.Select(error => error.ErrorMessage));
        }

        var email = request.Email.Trim();

        if (await userManager.FindByEmailAsync(email) is not null)
        {
            return Results.BadRequest(new { error = "EmailAlreadyRegistered", message = "That email address is already registered." });
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            PhoneNumber = request.PhoneNumber,
            AccountType = AccountType.Customer,
            Status = UserStatus.Active,
            EmailConfirmed = false
        };

        var created = await userManager.CreateAsync(user, request.Password);
        if (!created.Succeeded)
        {
            return Results.BadRequest(new
            {
                error = "CreateFailed",
                message = string.Join("; ", created.Errors.Select(e => e.Description))
            });
        }

        await userManager.AddToRoleAsync(user, ApplicationRoles.Customer);
        await SendConfirmationAsync(user, cancellationToken);

        logger.LogInformation("Registered account {Email}.", email);

        return Results.Created("/api/auth/me", await DescribeAsync(user));
    }

    /// <summary>
    /// Starts password recovery. The response is identical whether or not the address is registered.
    /// </summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        [FromServices] IValidator<ForgotPasswordRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Invalid(validation.Errors.Select(error => error.ErrorMessage));
        }

        var user = await userManager.FindByEmailAsync(request.Email.Trim());

        if (user is not null && user.Status == UserStatus.Active)
        {
            var token = await userManager.GeneratePasswordResetTokenAsync(user);
            var link = $"{ClientUri.TrimEnd('/')}/reset-password" +
                $"?email={Uri.EscapeDataString(user.Email!)}&token={Uri.EscapeDataString(token)}";

            await emailService.SendPasswordResetAsync(user.Email!, link, cancellationToken);
        }

        return Results.Ok(new { message = "If the address is registered and confirmed, a reset link has been sent." });
    }

    /// <summary>Completes password recovery using the token from the emailed link.</summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IResult> ResetPassword(
        [FromBody] ResetPasswordRequest request,
        [FromServices] IValidator<ResetPasswordRequest> validator,
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
            return Results.BadRequest(new { error = "InvalidToken", message = "The supplied link is invalid or has expired." });
        }

        var result = await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);

        return result.Succeeded
            ? Results.Ok(new { message = "Your password has been reset." })
            : Results.BadRequest(new { error = "InvalidToken", message = "The supplied link is invalid or has expired." });
    }

    /// <summary>Confirms an address using the token from the confirmation mail.</summary>
    [HttpPost("confirm-email")]
    [AllowAnonymous]
    public async Task<IResult> ConfirmEmail(
        [FromQuery] string email,
        [FromQuery] string token,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(token))
        {
            return Results.BadRequest(new { error = "InvalidToken", message = "The supplied link is invalid or has expired." });
        }

        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            return Results.BadRequest(new { error = "InvalidToken", message = "The supplied link is invalid or has expired." });
        }

        var result = await userManager.ConfirmEmailAsync(user, token);

        return result.Succeeded
            ? Results.Ok(new { message = "Your email address is confirmed." })
            : Results.BadRequest(new { error = "InvalidToken", message = "The supplied link is invalid or has expired." });
    }

    /// <summary>Returns the caller's own profile.</summary>
    [HttpGet("me")]
    [Authorize(Policy = AuthorizationPolicies.CustomerOnly)]
    public async Task<IResult> Me(CancellationToken cancellationToken)
    {
        var user = await CurrentUserAsync();
        return user is null
            ? Results.NotFound(new { error = "UserNotFound", message = "The requested user was not found." })
            : Results.Ok(await DescribeAsync(user));
    }

    /// <summary>Updates the fields the caller is allowed to change.</summary>
    [HttpPut("me")]
    [Authorize(Policy = AuthorizationPolicies.CustomerOnly)]
    public async Task<IResult> UpdateProfile(
        [FromBody] UpdateProfileRequest request,
        [FromServices] IValidator<UpdateProfileRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Invalid(validation.Errors.Select(error => error.ErrorMessage));
        }

        var user = await CurrentUserAsync();
        if (user is null)
        {
            return Results.NotFound(new { error = "UserNotFound", message = "The requested user was not found." });
        }

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.PhoneNumber = request.PhoneNumber;
        user.ProfilePictureUrl = request.ProfilePictureUrl;
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

        return Results.Ok(await DescribeAsync(user));
    }

    /// <summary>Changes the caller's own password.</summary>
    [HttpPost("change-password")]
    [Authorize(Policy = AuthorizationPolicies.CustomerOnly)]
    public async Task<IResult> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        [FromServices] IValidator<ChangePasswordRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Invalid(validation.Errors.Select(error => error.ErrorMessage));
        }

        var user = await CurrentUserAsync();
        if (user is null)
        {
            return Results.NotFound(new { error = "UserNotFound", message = "The requested user was not found." });
        }

        var result = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);

        if (!result.Succeeded)
        {
            return Results.BadRequest(new
            {
                error = "ChangePasswordFailed",
                message = string.Join("; ", result.Errors.Select(e => e.Description))
            });
        }

        await emailService.SendPasswordChangedAsync(user.Email!, cancellationToken);

        return Results.Ok(new { message = "Your password has been changed." });
    }

    private async Task<ApplicationUser?> CurrentUserAsync()
    {
        var subject = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        return Guid.TryParse(subject, out var id)
            ? await userManager.FindByIdAsync(id.ToString())
            : null;
    }

    private async Task SendConfirmationAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        var token = await userManager.GenerateEmailConfirmationTokenAsync(user);
        var link = $"{ClientUri.TrimEnd('/')}/confirm-email" +
            $"?email={Uri.EscapeDataString(user.Email!)}&token={Uri.EscapeDataString(token)}";

        await emailService.SendEmailConfirmationAsync(user.Email!, link, cancellationToken);
    }

    private async Task<UserProfileResponse> DescribeAsync(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        return new UserProfileResponse(
            user.Id,
            user.Email ?? string.Empty,
            user.EmailConfirmed,
            user.FirstName,
            user.LastName,
            user.FullName,
            user.PhoneNumber,
            user.ProfilePictureUrl,
            user.AccountType.ToString(),
            user.Status.ToString(),
            await userManager.GetTwoFactorEnabledAsync(user),
            roles.ToList(),
            user.CreatedAt,
            user.LastLoginAt);
    }

    private static IResult Invalid(IEnumerable<string> messages) => Results.BadRequest(
        new { error = "ValidationFailed", message = string.Join("; ", messages) });
}
