using Duende.IdentityServer.EntityFramework.DbContexts;
using Duende.IdentityServer.EntityFramework.Mappers;
using Duende.IdentityServer.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Identity.Server.Data;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider services, CancellationToken cancellationToken)
    {
        await using var scope = services.CreateAsyncScope();
        var provider = scope.ServiceProvider;

        var identityContext = provider.GetRequiredService<ApplicationDbContext>();
        var configurationContext = provider.GetRequiredService<ConfigurationDbContext>();
        var persistedGrantContext = provider.GetRequiredService<PersistedGrantDbContext>();

        await identityContext.Database.MigrateAsync(cancellationToken);
        await configurationContext.Database.MigrateAsync(cancellationToken);
        await persistedGrantContext.Database.MigrateAsync(cancellationToken);
        await SeedIdentityAsync(provider);
        await SeedConfigurationAsync(configurationContext, provider.GetRequiredService<IConfiguration>());
    }

    private static async Task SeedIdentityAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        foreach (var role in new[] { "Customer", "SalesAdmin", "SystemAdmin", "Admin", "User" })
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                var result = await roleManager.CreateAsync(new IdentityRole(role));
                EnsureSucceeded(result, $"creating role '{role}'");
            }
        }

        var configuration = services.GetRequiredService<IConfiguration>();
        var password = configuration["SeedAdmin:Password"];
        if (string.IsNullOrWhiteSpace(password))
        {
            return;
        }

        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        const string username = "admin";
        var user = await userManager.FindByNameAsync(username);
        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = username,
                Email = configuration["SeedAdmin:Email"] ?? "admin@coolstore.local",
                EmailConfirmed = true,
                Name = "System",
                LastName = "Administrator"
            };
            var result = await userManager.CreateAsync(user, password);
            EnsureSucceeded(result, "creating the configured seed administrator");
        }

        if (!await userManager.IsInRoleAsync(user, "Admin"))
        {
            var result = await userManager.AddToRoleAsync(user, "Admin");
            EnsureSucceeded(result, "assigning the seed administrator role");
        }

        if (!await userManager.IsInRoleAsync(user, "SystemAdmin"))
        {
            var result = await userManager.AddToRoleAsync(user, "SystemAdmin");
            EnsureSucceeded(result, "assigning the seed system-administrator role");
        }
    }

    private static async Task SeedConfigurationAsync(
        ConfigurationDbContext context,
        IConfiguration configuration)
    {
        var identityResourceNames = await context.IdentityResources
            .Select(resource => resource.Name)
            .ToHashSetAsync();
        context.IdentityResources.AddRange(Config.IdentityResources
            .Where(resource => !identityResourceNames.Contains(resource.Name))
            .Select(resource => resource.ToEntity()));

        var apiScopeNames = await context.ApiScopes
            .Select(scope => scope.Name)
            .ToHashSetAsync();
        context.ApiScopes.AddRange(Config.ApiScopes
            .Where(scope => !apiScopeNames.Contains(scope.Name))
            .Select(scope => scope.ToEntity()));

        var apiResourceNames = await context.ApiResources
            .Select(resource => resource.Name)
            .ToHashSetAsync();
        context.ApiResources.AddRange(Config.ApiResources
            .Where(resource => !apiResourceNames.Contains(resource.Name))
            .Select(resource => resource.ToEntity()));

        var clientIds = await context.Clients
            .Select(client => client.ClientId)
            .ToHashSetAsync();
        context.Clients.AddRange(Config.Clients(configuration)
            .Where(client => !clientIds.Contains(client.ClientId))
            .Select(client => client.ToEntity()));

        await context.SaveChangesAsync();
    }

    private static void EnsureSucceeded(IdentityResult result, string operation)
    {
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(error => error.Description));
            throw new InvalidOperationException($"Failed while {operation}: {errors}");
        }
    }
}
