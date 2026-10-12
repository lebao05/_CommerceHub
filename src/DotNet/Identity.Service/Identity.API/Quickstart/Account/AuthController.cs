using Identity.API.Authorization;
using Identity.API.Data;
using Identity.API.Models;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using System.Security.Claims;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace Identity.API.Quickstart.Account;

/// <summary>
/// The token endpoint: <c>/connect/token</c>.
/// </summary>
/// <remarks>
/// Three flows are handled here:
/// <list type="bullet">
///   <item>password — a shopper (or staff) signs in with email + password.</item>
///   <item>refresh_token — the client trades a refresh token for a fresh pair.</item>
///   <item>client_credentials — a background worker or the gateway presents its own credentials.</item>
/// </list>
/// All token issuance goes through OpenIddict rather than a hand-rolled JWT signer. The signing
/// key, refresh-token rotation, discovery document and JWKS are what the API gateway already
/// expects.
/// </remarks>
[ApiController]
public sealed class AuthController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    IOpenIddictTokenManager tokenManager,
    ILogger<AuthController> logger) : ControllerBase
{
    /// <summary>
    /// The OpenIddict token endpoint. The form-encoded request has already been read by the
    /// OpenIddict middleware; this method authenticates the user (or the client) and returns
    /// <see cref="SignIn(ClaimsPrincipal, string)"/> so the middleware signs the tokens and
    /// writes the response.
    /// </summary>
    [HttpPost("~/connect/token"), Produces("application/json")]
    [AllowAnonymous]
    public async Task<IActionResult> Exchange(CancellationToken cancellationToken)
    {
        var request = HttpContext.GetOpenIddictServerRequest()
            ?? throw new InvalidOperationException(
                "The OpenIddict server request was not found. The /connect/token endpoint must be reached through the OpenIddict middleware.");

        if (request.IsPasswordGrantType())
        {
            return await HandlePasswordGrantAsync(request, cancellationToken);
        }

        if (request.IsRefreshTokenGrantType())
        {
            return await HandleRefreshGrantAsync(request, cancellationToken);
        }

        if (request.IsClientCredentialsGrantType())
        {
            return HandleClientCredentialsGrant(request);
        }

        throw new NotImplementedException("The specified grant type is not implemented.");
    }

    /// <summary>
    /// Validates the password-grant credentials. Unknown address and wrong password produce the
    /// same 401 with the same message; anything more specific would be an
    /// account-enumeration oracle.
    /// </summary>
    private async Task<IActionResult> HandlePasswordGrantAsync(
        OpenIddictRequest request,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(request.Username ?? string.Empty);

        if (user is null)
        {
            return Forbid(
                authenticationSchemes: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                properties: ChallengeWithError(Errors.InvalidGrant, "The username or password is invalid."));
        }

        var result = await signInManager.CheckPasswordSignInAsync(
            user, request.Password ?? string.Empty, lockoutOnFailure: true);

        if (result.IsLockedOut)
        {
            return Forbid(
                authenticationSchemes: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                properties: ChallengeWithError(Errors.InvalidGrant, "The account is locked."));
        }

        if (!result.Succeeded)
        {
            return Forbid(
                authenticationSchemes: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                properties: ChallengeWithError(Errors.InvalidGrant, "The username or password is invalid."));
        }

        if (user.Status != UserStatus.Active)
        {
            return Forbid(
                authenticationSchemes: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                properties: ChallengeWithError(Errors.InvalidGrant, "The account is not active."));
        }

        user.LastLoginAt = DateTime.UtcNow;
        await userManager.UpdateAsync(user);

        logger.LogInformation("Issued password-grant tokens for {Email}.", user.Email);

        var principal = await BuildPrincipalAsync(user);
        return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }

    /// <summary>
    /// Handles the refresh grant. OpenIddict validates the refresh token before this method
    /// runs and exposes the subject through the authentication principal built from it. This
    /// method revokes every live token for the subject, then rebuilds the principal with the
    /// current roles and account state and lets OpenIddict sign the new pair.
    /// </summary>
    private async Task<IActionResult> HandleRefreshGrantAsync(
        OpenIddictRequest request,
        CancellationToken cancellationToken)
    {
        // OpenIddict already authenticated the refresh token. Pull the subject from the
        // principal it built rather than from the request parameters: this is how the
        // framework hands the identity of the original issuer to the token endpoint.
        var auth = await HttpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        var subject = auth.Principal?.FindFirst(Claims.Subject)?.Value;

        if (string.IsNullOrWhiteSpace(subject))
        {
            return Forbid(
                authenticationSchemes: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                properties: ChallengeWithError(Errors.InvalidGrant, "The refresh token is invalid."));
        }

        var user = await userManager.FindByIdAsync(subject);

        if (user is null || user.Status != UserStatus.Active)
        {
            return Forbid(
                authenticationSchemes: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                properties: ChallengeWithError(Errors.InvalidGrant, "The account is not active."));
        }

        // Refresh-token rotation. The presented refresh token is single-use: revoke it (and any
        // other live tokens for this subject) so the new pair replaces the old one atomically.
        // Without this, a stolen refresh token is good for seven days of new access tokens, and
        // the access tokens it already minted are valid for an hour each.
        var revoked = await RevokeLiveTokensAsync(subject, cancellationToken);
        logger.LogInformation(
            "Rotated tokens for {Subject}: revoked {Count} live token(s) before issuing a new pair.",
            subject, revoked);

        var principal = await BuildPrincipalAsync(user);
        return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }

    /// <summary>
    /// Revokes every still-valid token (refresh and access) that the OpenIddict store holds for
    /// <paramref name="subject"/>. Used by the refresh grant to make the old pair unusable as
    /// soon as a new one is issued.
    /// </summary>
    private async Task<int> RevokeLiveTokensAsync(string subject, CancellationToken cancellationToken)
    {
        var revoked = 0;
        var tokens = tokenManager.FindBySubjectAsync(subject, cancellationToken);

        await foreach (var token in tokens.WithCancellation(cancellationToken))
        {
            var status = await tokenManager.GetStatusAsync(token, cancellationToken);

            if (!string.Equals(status, Statuses.Valid, StringComparison.Ordinal))
            {
                continue;
            }

            if (await tokenManager.TryRevokeAsync(token, cancellationToken))
            {
                revoked++;
            }
        }

        return revoked;
    }

    /// <summary>
    /// Client credentials: no user behind the call. The identity carries the client id as
    /// subject and the <see cref="ApplicationRoles.ServiceAccount"/> role so staff-only
    /// policies admit the worker.
    /// </summary>
    private IActionResult HandleClientCredentialsGrant(OpenIddictRequest request)
    {
        var identity = new ClaimsIdentity(
            authenticationType: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
            nameType: Claims.Name,
            roleType: Claims.Role);

        identity.AddClaim(new Claim(Claims.Subject, request.ClientId ?? string.Empty));
        identity.AddClaim(new Claim(Claims.Name, request.ClientId ?? string.Empty));
        identity.AddClaim(new Claim(Claims.Role, ApplicationRoles.ServiceAccount));

        identity.SetScopes(request.GetScopes());
        identity.SetResources(request.GetResources());

        var principal = new ClaimsPrincipal(identity);
        return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }

    /// <summary>
    /// Builds the principal OpenIddict signs the tokens against. The principal carries the
    /// platform-specific claims the gateway reads on every request.
    /// </summary>
    private async Task<ClaimsPrincipal> BuildPrincipalAsync(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);

        var identity = new ClaimsIdentity(
            authenticationType: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
            nameType: Claims.Name,
            roleType: Claims.Role);

        identity.AddClaim(new Claim(Claims.Subject, user.Id.ToString()));
        identity.AddClaim(new Claim(Claims.Email, user.Email ?? string.Empty));
        identity.AddClaim(new Claim(Claims.Name, user.FullName));

        identity.AddClaim(new Claim(TokenClaimNames.AccountType, user.AccountType.ToString()));
        identity.AddClaim(new Claim(TokenClaimNames.Status, user.Status.ToString()));

        foreach (var role in roles)
        {
            identity.AddClaim(new Claim(Claims.Role, role));
        }

        var scopes = new List<string>
        {
            Scopes.OpenId,
            Scopes.Profile,
            Scopes.Email,
            Scopes.Roles,
            Scopes.OfflineAccess
        };
        scopes.AddRange(ResolveScopesFor(user.AccountType));

        identity.SetScopes(scopes);
        identity.SetResources(new[] { "commercehub" });

        return new ClaimsPrincipal(identity);
    }

    /// <summary>
    /// Maps an account type to the platform scopes that account type is allowed to hold.
    /// </summary>
    /// <remarks>
    /// The gateway enforces every route with a scope check, so a token that carries a scope is a
    /// token that can reach a route guarded by it. Granting every platform scope to every user
    /// would mean a Customer's token carries <c>admin.full</c> and <c>product.write</c>, and a
    /// downstream service that only checks scope (rather than role) would admit them. The mapping
    /// below narrows the grant to what the account type is meant to do, and the gateway's
    /// role-based policies still apply on top of that for staff and admin routes.
    /// </remarks>
    private static IReadOnlyList<string> ResolveScopesFor(AccountType accountType) => accountType switch
    {
        AccountType.Customer => new[]
        {
            Config.Scopes.ProfileRead,
            Config.Scopes.ProfileWrite,
            Config.Scopes.ProductRead,
            Config.Scopes.OrderRead,
            Config.Scopes.OrderWrite
        },

        AccountType.SalesAdmin => new[]
        {
            Config.Scopes.ProfileRead,
            Config.Scopes.ProfileWrite,
            Config.Scopes.ProductRead,
            Config.Scopes.ProductWrite,
            Config.Scopes.OrderRead,
            Config.Scopes.OrderWrite,
            Config.Scopes.InventoryRead,
            Config.Scopes.InventoryWrite,
            Config.Scopes.PaymentProcess
        },

        // SystemAdmin gets every platform scope. The role check on the gateway's
        // SystemAdministrator policy is the second of the two gates; the scope is what lets a
        // token pass the scope check at all.
        AccountType.SystemAdmin => Config.Scopes.All,

        _ => Array.Empty<string>()
    };

    private static AuthenticationProperties ChallengeWithError(string error, string description) =>
        new(new Dictionary<string, string?>
        {
            [OpenIddictServerAspNetCoreConstants.Properties.Error] = error,
            [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = description
        });
}
