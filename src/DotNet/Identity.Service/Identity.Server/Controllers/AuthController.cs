using System.ComponentModel.DataAnnotations;
using Identity.Server.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Identity.Server.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/auth")]
public sealed class AuthController(
    UserManager<ApplicationUser> userManager,
    IWebHostEnvironment environment) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<RegistrationResponse>> Register(
        [FromBody] RegistrationRequest request)
    {
        if (!environment.IsDevelopment())
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                error = "Registration is unavailable until email confirmation is configured."
            });
        }

        var email = request.Email!.Trim();
        if (await userManager.FindByEmailAsync(email) is not null)
        {
            return Conflict(new { error = "An account with that email already exists." });
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            Name = request.Name!.Trim()
        };

        var createResult = await userManager.CreateAsync(user, request.Password!);
        if (!createResult.Succeeded)
        {
            return BadRequest(new
            {
                errors = createResult.Errors
                    .GroupBy(error => error.Code)
                    .ToDictionary(
                        group => group.Key,
                        group => group.Select(error => error.Description).ToArray())
            });
        }

        var roleResult = await userManager.AddToRoleAsync(user, "Customer");
        if (!roleResult.Succeeded)
        {
            var errors = string.Join("; ", roleResult.Errors.Select(error => error.Description));
            throw new InvalidOperationException($"Failed to assign the Customer role to the new user: {errors}");
        }

        return Ok(new RegistrationResponse(user.Id, email, user.Name!, RequiresEmailConfirmation: false));
    }
}

public sealed class RegistrationRequest
{
    [Required]
    [StringLength(100)]
    public string? Name { get; init; }

    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string? Email { get; init; }

    [Required]
    [MinLength(8)]
    public string? Password { get; init; }
}

public sealed record RegistrationResponse(
    string UserId,
    string Email,
    string Name,
    bool RequiresEmailConfirmation);
