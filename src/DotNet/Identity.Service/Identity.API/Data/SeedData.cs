using Identity.API;
using Identity.API.Authorization;
using Identity.API.Data;
using Identity.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OpenIddict.Abstractions;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace Identity.API.Data;

/// <summary>
/// Brings a fresh database up to the state the server expects: the roles that authorization
/// policies name, the OpenIddict client applications, and — in development only — an
/// administrator.
/// </summary>
public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider services)
    {
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger(typeof(SeedData));
        var configuration = services.GetRequiredService<IConfiguration>();

        await SeedRolesAsync(services, logger);
        await SeedOpenIddictApplicationsAsync(services, configuration, logger);
        await SeedAdministratorAsync(services, configuration, logger);
    }

    private static async Task SeedRolesAsync(IServiceProvider services, ILogger logger)
    {
        var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();

        (string Name, string Description)[] roles =
        [
            (ApplicationRoles.Customer,
                "Shopper. Can browse, check out and manage their own account."),
            (ApplicationRoles.SalesAdmin,
                "Selling team. Runs the storefront: products, categories, orders and inventory."),
            (ApplicationRoles.SystemAdmin,
                "System administrator. Everything the selling team can do, plus managing accounts."),
            (ApplicationRoles.ServiceAccount,
                "A machine caller such as a background worker.")
        ];

        foreach (var (name, description) in roles)
        {
            if (await roleManager.RoleExistsAsync(name))
            {
                continue;
            }

            var result = await roleManager.CreateAsync(new ApplicationRole
            {
                Id = Guid.NewGuid(),
                Name = name,
                NormalizedName = name.ToUpperInvariant(),
                Description = description
            });

            if (result.Succeeded)
            {
                logger.LogInformation("Seeded role {Role}.", name);
            }
            else
            {
                logger.LogWarning(
                    "Could not seed role {Role}: {Errors}",
                    name,
                    string.Join("; ", result.Errors.Select(error => error.Description)));
            }
        }
    }

    /// <summary>
    /// Registers the OpenIddict client applications. The three clients together cover the
    /// server-side needs:
    /// <list type="bullet">
    ///   <item><c>commercehub-firstparty</c> — confidential, password + refresh-token.</item>
    ///   <item><c>commercehub-gateway</c> — confidential, client_credentials for the gateway.</item>
    ///   <item><c>commercehub-services</c> — confidential, client_credentials for background workers.</item>
    /// </list>
    /// Public clients (the storefront and admin SPAs) are registered when the gateway adds
    /// authorization-code support; they do not need an entry on the issuer.
    /// </summary>
    private static async Task SeedOpenIddictApplicationsAsync(
        IServiceProvider services,
        IConfiguration configuration,
        ILogger logger)
    {
        var applicationManager = services.GetRequiredService<IOpenIddictApplicationManager>();

        await EnsureConfidentialClientAsync(
            applicationManager,
            logger,
            configuration,
            clientId: Config.Clients.FirstParty,
            displayName: "CommerceHub First-Party Client",
            secretKey: "Clients:FirstParty:Secret",
            grantTypes: new[] { GrantTypes.Password, GrantTypes.RefreshToken });

        await EnsureConfidentialClientAsync(
            applicationManager,
            logger,
            configuration,
            clientId: Config.Clients.Gateway,
            displayName: "CommerceHub API Gateway",
            secretKey: "Clients:Gateway:Secret",
            grantTypes: new[] { GrantTypes.ClientCredentials });

        await EnsureConfidentialClientAsync(
            applicationManager,
            logger,
            configuration,
            clientId: Config.Clients.Services,
            displayName: "CommerceHub Background Services",
            secretKey: "Clients:Services:Secret",
            grantTypes: new[] { GrantTypes.ClientCredentials });
    }

    /// <summary>
    /// Inserts one confidential client with the standard OIDC scopes plus every platform
    /// scope. Idempotent: skips when the client already exists. If the caller hasn't
    /// configured a client secret in <c>appsettings.json</c>, one is generated so a
    /// confidential client can still come up in development. A warning is written when
    /// this fallback is used so the absence isn't silent.
    /// </summary>
    private static async Task EnsureConfidentialClientAsync(
        IOpenIddictApplicationManager applicationManager,
        ILogger logger,
        IConfiguration configuration,
        string clientId,
        string displayName,
        string secretKey,
        string[] grantTypes)
    {
        if (await applicationManager.FindByClientIdAsync(clientId) is not null)
        {
            return;
        }

        var descriptor = new OpenIddictApplicationDescriptor
        {
            ClientId = clientId,
            DisplayName = displayName,
            ClientType = ClientTypes.Confidential,
        };

        // Every confidential client can call the token endpoint. Without this
        // OpenIddict rejects every request from the client with "unauthorized_client".
        descriptor.Permissions.Add(Permissions.Endpoints.Token);

        descriptor.AddGrantTypePermissions(grantTypes);
        descriptor.AddScopePermissions(new[]
        {
            Scopes.OpenId, Scopes.Profile, Scopes.Email, Scopes.Roles, Scopes.OfflineAccess
        });
        descriptor.AddScopePermissions(Config.Scopes.All.ToArray());

        var secret = configuration[secretKey];
        if (string.IsNullOrWhiteSpace(secret))
        {
            // A stable, deterministic dev-only secret so tokens survive restarts.
            // Replace in appsettings.json or environment variables before any real
            // deployment.
            secret = $"{clientId}-dev-secret-please-rotate";
            logger.LogWarning(
                "No secret configured for {ClientId}; generating a development placeholder.",
                clientId);
        }

        descriptor.ClientSecret = secret;

        await applicationManager.CreateAsync(descriptor, CancellationToken.None);
        logger.LogInformation("Seeded OpenIddict application {ClientId}.", clientId);
    }

    private static async Task SeedAdministratorAsync(
        IServiceProvider services,
        IConfiguration configuration,
        ILogger logger)
    {
        var password = configuration["Identity:Seed:AdminPassword"];

        if (string.IsNullOrWhiteSpace(password))
        {
            return;
        }

        var environment = services.GetRequiredService<IHostEnvironment>();

        if (!environment.IsDevelopment())
        {
            throw new InvalidOperationException(
                "Identity__Seed__AdminPassword is set but the environment is not Development. " +
                "Create the first administrator through the admin bootstrap flow instead.");
        }

        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var email = configuration["Identity:Seed:AdminEmail"] ?? "admin@commercehub.local";

        if (await userManager.FindByEmailAsync(email) is not null)
        {
            return;
        }

        var admin = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            FirstName = "Platform",
            LastName = "Administrator",
            Status = UserStatus.Active,
            AccountType = AccountType.SystemAdmin
        };

        var created = await userManager.CreateAsync(admin, password);

        if (!created.Succeeded)
        {
            throw new InvalidOperationException(
                $"Could not seed the administrator: {string.Join("; ", created.Errors.Select(e => e.Description))}");
        }

        await userManager.AddToRoleAsync(admin, ApplicationRoles.SystemAdmin);

        logger.LogWarning(
            "Seeded a development administrator at {Email}. Unset Identity__Seed__AdminPassword " +
            "before deploying anywhere real.", email);
    }
}
