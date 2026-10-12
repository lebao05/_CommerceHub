using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using OpenIddict.Validation.AspNetCore;

namespace ApiGateway.Authorization;

/// <summary>
/// The names of the authorization policies referenced by the YARP route table.
/// </summary>
/// <remarks>
/// A route's <c>AuthorizationPolicy</c> is a string, so it is resolved by name at request time
/// rather than being type-checked. These constants are the single place where the strings are
/// written, which is what stops a renamed policy from silently becoming an unprotected route: the
/// route table and the registration below both compile against the same constant, and a policy that
/// is named but never registered fails at startup when the authorization middleware first
/// evaluates it rather than quietly allowing the request.
/// </remarks>
public static class GatewayPolicies
{
    /// <summary>Browsing the product catalog. Not used by any route; the catalog read path is anonymous.</summary>
    public const string CatalogRead = "catalog-read";

    /// <summary>
    /// Creating and editing catalog entries, which includes categories. Staff only: a shopper never
    /// holds <c>product.write</c>, and this is the second of the two checks that says so.
    /// </summary>
    public const string CatalogWrite = "catalog-write";

    /// <summary>Reading orders. Held by a customer for their own orders.</summary>
    public const string OrderRead = "order-read";

    /// <summary>Creating and editing orders, which is checkout.</summary>
    public const string OrderWrite = "order-write";

    /// <summary>Reading inventory levels.</summary>
    public const string InventoryRead = "inventory-read";

    /// <summary>Adjusting inventory levels. Staff only, for the same reason as <see cref="CatalogWrite"/>.</summary>
    public const string InventoryWrite = "inventory-write";

    /// <summary>Processing payments.</summary>
    public const string PaymentProcess = "payment-process";

    /// <summary>
    /// Administrative operations on accounts: listing them, granting a role, changing a status.
    /// Held by a system administrator and by nobody else. Not used by any route yet — no service
    /// exposes administrative operations — and registered so the next one that does has a policy
    /// waiting rather than a route that quietly ships unprotected.
    /// </summary>
    public const string SystemAdmin = "system-admin";
}
