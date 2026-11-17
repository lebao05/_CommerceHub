using System.Security.Claims;
using Duende.IdentityServer;
using Duende.IdentityServer.Services;
using Identity.Server.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Identity.Server.Quickstart;

[AllowAnonymous]
[Route("External")]
public sealed class ExternalController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    IIdentityServerInteractionService interaction,
    IAuthenticationSchemeProvider schemeProvider) : Controller
{
    [HttpGet("Challenge")]
    public async Task<IActionResult> Challenge(string scheme, string returnUrl)
    {
        if (scheme != "Google" || await schemeProvider.GetSchemeAsync(scheme) is null)
        {
            return NotFound();
        }

        if (!IsValidReturnUrl(returnUrl))
        {
            return BadRequest("The return URL is invalid.");
        }

        var properties = new AuthenticationProperties
        {
            RedirectUri = Url.Action(nameof(Callback), new { returnUrl })
        };
        properties.Items["returnUrl"] = returnUrl;
        return Challenge(properties, scheme);
    }

    [HttpGet("Callback")]
    public async Task<IActionResult> Callback(string returnUrl)
    {
        if (!IsValidReturnUrl(returnUrl))
        {
            return BadRequest("The return URL is invalid.");
        }

        const string provider = "Google";
        var authentication = await HttpContext.AuthenticateAsync(
            IdentityServerConstants.ExternalCookieAuthenticationScheme);
        if (!authentication.Succeeded || authentication.Principal is null)
        {
            return RedirectToAction("Login", "Account", new { returnUrl });
        }

        var principal = authentication.Principal;
        var providerUserId = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(providerUserId))
        {
            await ClearExternalCookieAsync();
            return BadRequest("The external provider did not return a user identifier.");
        }

        var user = await userManager.FindByLoginAsync(provider, providerUserId);
        if (user is not null)
        {
            if (await userManager.IsLockedOutAsync(user))
            {
                await ClearExternalCookieAsync();
                return Forbid();
            }

            await signInManager.SignInAsync(user, isPersistent: false, provider);
            await ClearExternalCookieAsync();
            return Redirect(returnUrl);
        }

        var email = principal.FindFirstValue(ClaimTypes.Email);
        var emailVerified = principal.FindFirst("email_verified")?.Value;
        if (string.IsNullOrWhiteSpace(email)
            || !string.Equals(emailVerified, "true", StringComparison.OrdinalIgnoreCase))
        {
            await ClearExternalCookieAsync();
            return BadRequest("The external provider did not return a verified email address.");
        }

        if (await userManager.FindByEmailAsync(email) is not null)
        {
            await ClearExternalCookieAsync();
            return Conflict("This email is already registered. Sign in locally before linking an external provider.");
        }

        var newUser = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            Name = principal.FindFirstValue(ClaimTypes.GivenName),
            LastName = principal.FindFirstValue(ClaimTypes.Surname)
        };
        var createResult = await userManager.CreateAsync(newUser);
        if (!createResult.Succeeded)
        {
            var errors = string.Join("; ", createResult.Errors.Select(error => error.Description));
            throw new InvalidOperationException($"Could not create the external-login user: {errors}");
        }

        var loginResult = await userManager.AddLoginAsync(
            newUser,
            new UserLoginInfo(provider, providerUserId, provider));
        if (!loginResult.Succeeded)
        {
            var deleteResult = await userManager.DeleteAsync(newUser);
            if (!deleteResult.Succeeded)
            {
                var deleteErrors = string.Join("; ", deleteResult.Errors.Select(error => error.Description));
                throw new InvalidOperationException(
                    $"Could not clean up the external-login user after linking failed: {deleteErrors}");
            }

            var errors = string.Join("; ", loginResult.Errors.Select(error => error.Description));
            throw new InvalidOperationException($"Could not link the external provider: {errors}");
        }

        await signInManager.SignInAsync(newUser, isPersistent: false, provider);
        await ClearExternalCookieAsync();
        return Redirect(returnUrl);
    }

    private bool IsValidReturnUrl(string? returnUrl) =>
        !string.IsNullOrWhiteSpace(returnUrl)
        && (Url.IsLocalUrl(returnUrl) || interaction.IsValidReturnUrl(returnUrl));

    private Task ClearExternalCookieAsync() =>
        HttpContext.SignOutAsync(IdentityServerConstants.ExternalCookieAuthenticationScheme);
}
