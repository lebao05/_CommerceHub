using Duende.IdentityServer;
using Duende.IdentityServer.Models;
using Duende.IdentityServer.Services;
using Identity.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Identity.Server.Quickstart;

[Authorize]
[Route("Consent")]
public sealed class ConsentController(IIdentityServerInteractionService interaction) : Controller
{
    [HttpGet("")]
    public async Task<IActionResult> Index(string returnUrl)
    {
        var request = await interaction.GetAuthorizationContextAsync(returnUrl, HttpContext.RequestAborted);
        if (request is null)
        {
            return BadRequest("The authorization request is invalid or has expired.");
        }

        var scopes = request.Parameters["scope"]?
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            ?? [];

        return View(new ConsentInputModel
        {
            ReturnUrl = returnUrl,
            ClientName = request.Client.ClientName ?? request.Client.ClientId,
            RequestedScopes = scopes,
            SelectedScopes = scopes
        });
    }

    [HttpPost("")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Index(ConsentInputModel model, string button)
    {
        var request = await interaction.GetAuthorizationContextAsync(model.ReturnUrl, HttpContext.RequestAborted);
        if (request is null)
        {
            return BadRequest("The authorization request is invalid or has expired.");
        }

        if (button == "no")
        {
            await interaction.DenyAuthorizationAsync(
                request,
                InteractionError.AccessDenied,
                HttpContext.RequestAborted);
            return Redirect(model.ReturnUrl);
        }

        var requested = request.Parameters["scope"]?
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToHashSet(StringComparer.Ordinal)
            ?? [];
        var selected = model.SelectedScopes
            .Where(scope => requested.Contains(scope))
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        if (button != "yes" || selected.Length == 0)
        {
            ModelState.AddModelError(nameof(model.SelectedScopes), "Select at least one requested permission.");
            model.RequestedScopes = requested.ToArray();
            model.ClientName = request.Client.ClientName ?? request.Client.ClientId;
            return View(model);
        }

        await interaction.GrantConsentAsync(
            request,
            new ConsentResponse
            {
                ScopesValuesConsented = selected,
                RememberConsent = model.RememberConsent
            },
            HttpContext.RequestAborted);

        return Redirect(model.ReturnUrl);
    }
}
