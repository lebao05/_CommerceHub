using Identity.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using OpenIddict.Validation.AspNetCore;

namespace ApiGateway.Authorization;

/// <summary>
/// Registers the gateway's authorization handlers and one named policy per protected operation.
/// </summary>
public static class GatewayAuthorizationExtensions
{
    /// <summary>
    /// Adds the scope and account-state handlers, then the named policies.
    /// </summary>
    /// <remarks>
    /// Every policy is built the same way: an authenticated user, authenticated by the OpenIddict
    /// validation scheme specifically, plus a scope, plus the account-state check. The scheme is
    /// named rather than inherited because a route may end up under a different default scheme
    /// later (a session cookie for an admin console, say) and silently losing token validation on
    /// every protected route at that point is exactly the kind of change that ships unnoticed.
    /// </remarks>
    public static IServiceCollection AddGatewayAuthorization(this IServiceCollection services)
    {
        // Scoped rather than singleton. The handlers hold no state and would be equally correct as
        // singletons, but scoped registration is what the rest of this solution does, and ASP.NET
        // Core builds the authorization service per request, so a scoped handler can safely depend on
        // request-scoped services if it ever needs to.
        services.AddScoped<IAuthorizationHandler, ScopeRequirementHandler>();
        services.AddScoped<IAuthorizationHandler, ActiveAccountRequirementHandler>();

        // Delegating here means a request that passes no scope check still gets its bearer token
        // turned into a 401 with a WWW-Authenticate header, rather than a bare 403 that a browser
        // cannot distinguish from a genuine permission problem.
        services.AddSingleton<IAuthorizationMiddlewareResultHandler, GatewayAuthorizationResultHandler>();

        services.AddAuthorizationBuilder()
            .AddPolicy(GatewayPolicies.CatalogRead, policy => Protected(policy, GatewayScopes.ProductRead))

            // The two write policies carry a role requirement on top of their scope. The scope is
            // what the identity server hands out, and the role is what it hands out it for: a token
            // issued before the authorize endpoint began narrowing by role, or one minted for a
            // client-credentials caller, is narrowed by nothing and would otherwise sail through on
            // the scope alone. Two independent checks of the same decision, one of which is
            // self-contained in this process.
            .AddPolicy(GatewayPolicies.CatalogWrite, policy => Staff(policy, GatewayScopes.ProductWrite))
            .AddPolicy(GatewayPolicies.OrderRead, policy => Protected(policy, GatewayScopes.OrderRead))

            // Order writes are checkout, which a shopper does, so no role requirement here.
            .AddPolicy(GatewayPolicies.OrderWrite, policy => Protected(policy, GatewayScopes.OrderWrite))
            .AddPolicy(GatewayPolicies.InventoryRead, policy => Protected(policy, GatewayScopes.InventoryRead))
            .AddPolicy(GatewayPolicies.InventoryWrite, policy => Staff(policy, GatewayScopes.InventoryWrite))
            .AddPolicy(GatewayPolicies.PaymentProcess, policy => Protected(policy, GatewayScopes.PaymentProcess))
            .AddPolicy(GatewayPolicies.SystemAdmin, policy => SystemAdministrator(policy));

        return services;
    }

    /// <summary>
    /// The shape every protected route shares. A single scope is enough per policy because the
    /// <see cref="ScopeRequirement"/> accepts a set, so widening one of these to "read or write"
    /// later is a one-line change here and nothing at all in the route table.
    /// </summary>
    private static void Protected(AuthorizationPolicyBuilder policy, string scope)
    {
        policy.AuthenticationSchemes.Add(OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme);
        policy.RequireAuthenticatedUser();
        policy.AddRequirements(new ScopeRequirement(scope), new ActiveAccountRequirement());
    }

    /// <summary>
    /// A protected route that only the selling team or a system administrator may call.
    /// </summary>
    /// <remarks>
    /// <see cref="AuthorizationPolicyBuilder.RequireRole(string[])"/> is an <em>or</em>, so naming both
    /// administrative roles admits either. A system administrator can run the storefront as well as
    /// administer it; the point of the requirement is to keep shoppers out, not to keep system
    /// administrators away from their own catalogue.
    /// </remarks>
    private static void Staff(AuthorizationPolicyBuilder policy, string scope)
    {
        Protected(policy, scope);

        // ServiceAccount is in this list so a background worker can still write to the catalog and
        // inventory. It is here rather than absent because a client-credentials token carries no
        // user-derived roles at all, and a policy that named only the two human roles would lock
        // every machine out of every staff route — a regression that would show up as a 403 on an
        // order-processing worker rather than as a startup failure.
        policy.RequireRole(
            ApplicationRoles.SalesAdmin,
            ApplicationRoles.SystemAdmin,
            ApplicationRoles.ServiceAccount);
    }

    /// <summary>
    /// A protected route that only a system administrator may call.
    /// </summary>
    /// <remarks>
    /// <see cref="ApplicationRoles.SystemAdmin"/> alone, not "any administrator". Granting a sales
    /// administrator the power to change other people's roles and statuses is a different decision
    /// from letting them change products, and the two have to be separable or the second one cannot
    /// be reviewed on its own.
    /// </remarks>
    private static void SystemAdministrator(AuthorizationPolicyBuilder policy)
    {
        Protected(policy, GatewayScopes.AdminFull);
        policy.RequireRole(ApplicationRoles.SystemAdmin);
    }
}
