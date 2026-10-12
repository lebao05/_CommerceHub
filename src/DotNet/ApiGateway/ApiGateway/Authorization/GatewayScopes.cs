namespace ApiGateway.Authorization;

/// <summary>
/// The scope strings the identity server puts into the access token's space-separated
/// <c>scope</c> claim.
/// </summary>
/// <remarks>
/// <para>
/// These duplicate the constants in <c>Identity.Infrastructure.Configuration.OpenIddictConfig</c>
/// and that duplication is deliberate. The gateway authenticates the token but never issues one, so
/// it reaches the identity server only over HTTP and cannot share a compiled reference with it.
/// The scope string is therefore a wire contract between two independently deployable processes, and
/// the honest way to express a wire contract is to state it in one place per process rather than to
/// invent a project reference between a gateway and an authorization server.
/// </para>
/// <para>
/// Renaming a scope on the identity server without renaming it here does not fail any build. It
/// fails at runtime as a 403 on the affected route, which is why <c>OpenIddictConfig</c> calls
/// this gateway out in its own remarks.
/// </para>
/// </remarks>
public static class GatewayScopes
{
    /// <summary>Read your own profile. Maps to the identity-api resource server.</summary>
    public const string ProfileRead = "profile.read";

    /// <summary>Update your own profile. Maps to the identity-api resource server.</summary>
    public const string ProfileWrite = "profile.write";

    /// <summary>Read product data. The only scope needed to browse the storefront.</summary>
    public const string ProductRead = "product.read";

    /// <summary>Create and edit product data. Deliberately not granted to a normal customer.</summary>
    public const string ProductWrite = "product.write";

    /// <summary>Read order data.</summary>
    public const string OrderRead = "order.read";

    /// <summary>Create and edit order data.</summary>
    public const string OrderWrite = "order.write";

    /// <summary>Read inventory data.</summary>
    public const string InventoryRead = "inventory.read";

    /// <summary>Adjust inventory levels.</summary>
    public const string InventoryWrite = "inventory.write";

    /// <summary>Process payments.</summary>
    public const string PaymentProcess = "payment.process";

    /// <summary>
    /// Full administrative access. The identity server never grants this to a storefront customer,
    /// so a route guarded by it is unreachable from the storefront by construction and not merely by
    /// configuration.
    /// </summary>
    public const string AdminFull = "admin.full";

    /// <summary>
    /// The full set, used only to populate the Swagger UI's scope list. Kept in one place so the
    /// documentation and the policies cannot drift apart.
    /// </summary>
    public static IReadOnlyDictionary<string, string> SwaggerScopeDescriptions { get; } =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            [ProfileRead] = "Read your own profile",
            [ProfileWrite] = "Update your own profile",
            [ProductRead] = "Read product data",
            [ProductWrite] = "Create and edit product data",
            [OrderRead] = "Read order data",
            [OrderWrite] = "Create and edit order data",
            [InventoryRead] = "Read inventory data",
            [InventoryWrite] = "Adjust inventory levels",
            [PaymentProcess] = "Process payments",
            [AdminFull] = "Full administrative access"
        };
}
