namespace Identity.API;

/// <summary>
/// OAuth configuration for the identity server: the scopes the server advertises and hands out, and
/// the client registrations it accepts.
/// </summary>
/// <remarks>
/// The constant values are duplicated in the gateway and the first-party clients; the gateway's
/// scope policies read them and the tokens carry them.
/// </remarks>
public static class Config
{
    /// <summary>
    /// The OpenId Connect scopes this server advertises on its discovery document and hands out on
    /// the token endpoint.
    /// </summary>
    public static class Scopes
    {
        public const string ProfileRead = "profile.read";
        public const string ProfileWrite = "profile.write";
        public const string ProductRead = "product.read";
        public const string ProductWrite = "product.write";
        public const string OrderRead = "order.read";
        public const string OrderWrite = "order.write";
        public const string InventoryRead = "inventory.read";
        public const string InventoryWrite = "inventory.write";
        public const string PaymentProcess = "payment.process";
        public const string AdminFull = "admin.full";

        /// <summary>Every scope the platform recognises.</summary>
        public static IReadOnlyList<string> All { get; } = [
            ProfileRead, ProfileWrite,
            ProductRead, ProductWrite,
            OrderRead, OrderWrite,
            InventoryRead, InventoryWrite,
            PaymentProcess, AdminFull
        ];
    }

    /// <summary>
    /// Client registrations the token and authorize endpoints accept.
    /// </summary>
    public static class Clients
    {
        /// <summary>The confidential client the password flow is granted to.</summary>
        public const string FirstParty = "commercehub-firstparty";

        /// <summary>The confidential client the gateway uses for client-credentials calls.</summary>
        public const string Gateway = "commercehub-gateway";

        /// <summary>The confidential service-to-service client (background workers).</summary>
        public const string Services = "commercehub-services";

        /// <summary>The public storefront SPA client.</summary>
        public const string WebSpa = "commercehub-web";

        /// <summary>The public admin dashboard SPA client.</summary>
        public const string AdminSpa = "admin-dashboard";
    }
}
