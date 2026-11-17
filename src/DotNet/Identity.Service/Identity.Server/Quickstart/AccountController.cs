using Duende.IdentityServer.Services;
using Identity.Server.Data;
using Identity.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;

namespace Identity.Server.Quickstart;

[AllowAnonymous]
[Route("Account")]
public sealed class AccountController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    IIdentityServerInteractionService interaction,
    IAuthenticationSchemeProvider schemeProvider) : Controller
{
    [HttpGet("Login")]
    public async Task<IActionResult> Login(string returnUrl)
    {
        if (!IsValidReturnUrl(returnUrl))
        {
            return BadRequest("The return URL is invalid.");
        }

        return await LoginViewAsync(new LoginInputModel { ReturnUrl = returnUrl });
    }

    [HttpPost("Login")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(LoginInputModel model)
    {
        if (!IsValidReturnUrl(model.ReturnUrl))
        {
            return BadRequest("The return URL is invalid.");
        }

        if (!ModelState.IsValid)
        {
            return await LoginViewAsync(model);
        }

        var user = await userManager.FindByNameAsync(model.Username)
            ?? await userManager.FindByEmailAsync(model.Username);
        var result = user is null
            ? Microsoft.AspNetCore.Identity.SignInResult.Failed
            : await signInManager.PasswordSignInAsync(
                user,
                model.Password,
                model.RememberLogin,
                lockoutOnFailure: true);

        if (result.Succeeded)
        {
            return Redirect(model.ReturnUrl);
        }

        ModelState.AddModelError(string.Empty,
            result.IsLockedOut
                ? "This account is temporarily locked. Try again later."
                : "Invalid username or password.");
        return await LoginViewAsync(model);
    }

    [HttpGet("Logout")]
    public async Task<IActionResult> Logout(string? logoutId)
    {
        if (User.Identity?.IsAuthenticated != true)
        {
            return await CompleteLogoutAsync(logoutId);
        }

        var context = await interaction.GetLogoutContextAsync(logoutId, HttpContext.RequestAborted);
        if (context?.ShowSignoutPrompt == false)
        {
            await signInManager.SignOutAsync();
            return await CompleteLogoutAsync(logoutId);
        }

        return View("Logout", new LogoutInputModel { LogoutId = logoutId });
    }

    [HttpPost("Logout")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Logout(LogoutInputModel model)
    {
        await signInManager.SignOutAsync();
        return await CompleteLogoutAsync(model.LogoutId);
    }

    private bool IsValidReturnUrl(string? returnUrl) =>
        !string.IsNullOrWhiteSpace(returnUrl)
        && (Url.IsLocalUrl(returnUrl) || interaction.IsValidReturnUrl(returnUrl));

    private async Task<IActionResult> LoginViewAsync(LoginInputModel model)
    {
        model.GoogleLoginEnabled = await schemeProvider.GetSchemeAsync("Google") is not null;
        return View("Login", model);
    }

    private async Task<IActionResult> CompleteLogoutAsync(string? logoutId)
    {
        var context = await interaction.GetLogoutContextAsync(logoutId, HttpContext.RequestAborted);
        return context?.PostLogoutRedirectUri is { Length: > 0 } redirectUri
            ? Redirect(redirectUri)
            : RedirectToAction("Index", "Home");
    }
}

