using Duende.IdentityServer.Models;
using Duende.IdentityServer.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Identity.Server.Quickstart;

[Authorize]
[Route("Grants")]
public sealed class GrantsController(IIdentityServerInteractionService interaction) : Controller
{
    [HttpGet("")]
    public async Task<IActionResult> Index()
    {
        var grants = await interaction.GetAllUserGrantsAsync(HttpContext.RequestAborted);
        return View(grants);
    }

    [HttpPost("Revoke")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Revoke(string clientId)
    {
        if (string.IsNullOrWhiteSpace(clientId))
        {
            return BadRequest("A client id is required.");
        }

        await interaction.RevokeUserConsentAsync(clientId, HttpContext.RequestAborted);
        return RedirectToAction(nameof(Index));
    }
}
