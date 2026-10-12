using ApiGateway.Authorization;
using ApiGateway.Configuration;
using Yarp.ReverseProxy.Configuration;

namespace ApiGateway.Proxy;

/// <summary>
/// The gateway's whole routing table: which path reaches which service, and which authorization
/// policy, if any, guards it.
/// </summary>
/// <remarks>
/// <para>
/// Paths are grouped under one <c>/api</c> namespace and the segment after it names the service, so
/// <c>/api/orders</c> reaches the order service, <c>/api/categories</c> the product catalog and
/// <c>/api/auth/register</c> the identity server. That is the convention the rest of the solution
/// already uses: the storefront builds its base URL as <c>{host}/api</c> and then calls
/// <c>/orders</c> or <c>/auth/login</c>, and the services themselves publish <c>/api/categories</c>
/// and <c>/api/auth/...</c>. A gateway that invented a second namespace would need a different URL in
/// every existing caller.
/// </para>
/// <para>
/// Nothing is rewritten on the way through. Each service already publishes the exact path the
/// gateway matches, so there is no <c>PathRemovePrefix</c> anywhere in this table. That is worth the
/// constraint it imposes: a catch-all segment takes part in matching but YARP forwards the path the
/// caller sent, so a route that needed a prefix removed would have to say so, and a mistake in that
/// transform would show up as a 404 from a service that is working perfectly well.
/// </para>
/// <para>
/// Routes are built in code rather than bound from JSON so that the path, the policy and the
/// destination are visible in one reviewable list. The properties used are the same ones YARP's JSON
/// configuration provider reads, so a route can be moved into <c>appsettings.json</c> unchanged
/// later, and the ports stay in configuration either way.
/// </para>
/// </remarks>
public static class GatewayRouteTable
{
    /// <summary>Names of the services in <c>Gateway:Services</c>, and of the YARP clusters.</summary>
    public const string IdentityService = "Identity";

    /// <summary>Product catalog cluster and configuration key.</summary>
    public const string ProductCatalogService = "ProductCatalog";

    /// <summary>Order cluster and configuration key.</summary>
    public const string OrderService = "Order";

    /// <summary>Inventory cluster and configuration key.</summary>
    public const string InventoryService = "Inventory";

    /// <summary>Payment cluster and configuration key.</summary>
    public const string PaymentService = "Payment";

    /// <summary>
    /// Rate limiter policy applied to the identity server's interactive and token endpoints. Named
    /// here so the route table and the limiter registration cannot disagree about which routes are
    /// the sensitive ones.
    /// </summary>
    public const string AuthenticationRouteRateLimitPolicy = RateLimitPolicies.AuthenticationRoutes;

    /// <summary>
    /// The first path segment that routes to each service, under the shared <c>/api</c> namespace.
    /// </summary>
    /// <remarks>
    /// These are the segment names the services already publish, not names chosen here. The storefront
    /// calls <c>/api/orders</c> and <c>/api/categories</c> because that is what those services serve,
    /// and the identity server serves <c>/api/auth</c> and <c>/api/identity</c>. A mismatch between
    /// this table and a service's own route attribute is a 404 that looks like a service outage, so
    /// the segments are named once here and every route for that service is built from them.
    /// </remarks>
    public const string OrdersSegment = "orders";

    public const string CatalogSegment = "categories";
    public const string InventorySegment = "inventory";
    public const string PaymentsSegment = "payments";
    public const string AccountSegment = "auth";
    public const string AdministrationSegment = "identity";

    /// <summary>
    /// Builds the routes and clusters. <paramref name="options"/> supplies every address, so a
    /// service can be moved by editing configuration.
    /// </summary>
    public static (RouteConfig[] Routes, ClusterConfig[] Clusters) Build(GatewayOptions options)
    {
        var routes = new List<RouteConfig>();

        // --- Identity server -------------------------------------------------------------------
        // Anonymous by necessity, and that is not a hole. /connect/authorize is where a browser
        // arrives before it has any token, and /connect/token is the credential exchange itself;
        // there is nothing to authenticate yet. The identity server applies its own authentication
        // to the endpoints behind them (/connect/userinfo needs a token, /connect/introspect needs a
        // client), so proxying them through an unauthenticated gateway does not weaken anything.
        // What the gateway adds is the tighter rate limit and the log line.
        routes.Add(new RouteConfig
        {
            RouteId = "identity-connect",
            Order = 10,
            ClusterId = IdentityService,
            Match = new RouteMatch { Path = "/connect/{**remainder}" },
            RateLimiterPolicy = AuthenticationRouteRateLimitPolicy
        });

        // The account endpoints: registration, password recovery, and the caller's own profile.
        //
        // No policy here either, and that is a deliberate division of labour rather than a gap. This
        // one route covers both endpoints that must work before anyone has a token (register,
        // forgot/reset password) and those that must not work without one (profile, change password).
        // The identity server draws that line itself, on each action, and validates the token against
        // its own signing key — the one that minted it, which is the only party that can. A policy
        // here would either have to exempt the public half and so protect nothing extra, or blanket
        // the route and break registration.
        routes.Add(new RouteConfig
        {
            RouteId = "identity-account",
            Order = 13,
            ClusterId = IdentityService,
            Match = new RouteMatch { Path = $"/api/{AccountSegment}/{{**remainder}}" },

            // Recovery and registration are the two places an unauthenticated caller can make this
            // server do real work: hashing a password, or sending mail. They get the tight limit even
            // though the route itself is anonymous.
            RateLimiterPolicy = AuthenticationRouteRateLimitPolicy
        });

        // The administrative endpoints, which are the only identity routes the gateway guards. They
        // change other people's roles and account status, so they are held to admin.full here as
        // well as to the scope check inside the identity server.
        //
        // The system-admin policy, not a general administrative one: this route is where one person
        // does something to another person's account, and a member of the selling team has no reason
        // to be able to. The identity server applies the identical role check on its own side, so
        // this is the second of two rather than the only one.
        routes.Add(new RouteConfig
        {
            RouteId = "identity-administration",
            Order = 14,
            ClusterId = IdentityService,
            Match = new RouteMatch { Path = $"/api/{AdministrationSegment}/{{**remainder}}" },
            AuthorizationPolicy = GatewayPolicies.SystemAdmin
        });

        // The discovery document. Spelled out as a literal rather than as a wildcard because YARP
        // strips the part of the path that precedes a route parameter, so
        // "/.well-known/{**remainder}" would forward "/openid-configuration" and the identity server
        // would answer 404. A template with no parameters forwards the path untouched.
        routes.Add(new RouteConfig
        {
            RouteId = "identity-discovery",
            Order = 11,
            ClusterId = IdentityService,
            Match = new RouteMatch { Path = "/.well-known/openid-configuration" }
        });

        // The signing keys. Same reasoning: a literal path, so it is forwarded as-is. The gateway
        // needs these to validate tokens and fetches them from the identity server directly, but a
        // browser-side client that wants to validate a token it was given needs them too, and
        // publishing them through the same origin the storefront is served from avoids a second
        // CORS exception.
        routes.Add(new RouteConfig
        {
            RouteId = "identity-jwks",
            Order = 12,
            ClusterId = IdentityService,
            Match = new RouteMatch { Path = "/.well-known/jwks" }
        });

        // --- Product catalog --------------------------------------------------------------------
        // Browsing a product catalog is anonymous. A storefront visitor has no token until they
        // sign in, so a GET behind a policy would make the shop front page unusable for every
        // visitor who is not already logged in.
        routes.Add(new RouteConfig
        {
            RouteId = "catalog-read",
            Order = 20,
            ClusterId = ProductCatalogService,
            Match = new RouteMatch
            {
                Path = $"/api/{CatalogSegment}/{{**remainder}}",
                Methods = ["GET", "HEAD"]
            }

            // No AuthorizationPolicy. The product catalog's GET endpoints are public, and the
            // product.read scope exists for a caller that has one rather than for the general case.
        });

        // Editing the catalog is not. Same path and same cluster as the read route, split by HTTP
        // method: YARP evaluates routes in Order and takes the first whose Match fits, so the read
        // route has to come first and the write route has to exclude the read methods explicitly.
        // An unlisted method reaches neither route and gets a 405 from routing, which is the
        // correct answer for a verb this API does not offer, and a better one than a 404 because it
        // says the path exists.
        routes.Add(new RouteConfig
        {
            RouteId = "catalog-write",
            Order = 21,
            ClusterId = ProductCatalogService,
            Match = new RouteMatch
            {
                Path = $"/api/{CatalogSegment}/{{**remainder}}",
                Methods = ["POST", "PUT", "PATCH", "DELETE"]
            },
            AuthorizationPolicy = GatewayPolicies.CatalogWrite
        });

        // --- Orders, inventory, payments --------------------------------------------------------
        // One catch-all each, read and write split by method, because the gateway is the only place
        // that knows which operation is which. Enumerating every endpoint instead would mean a
        // service's new endpoint silently arriving with no gateway policy on it.
        routes.Add(Service("order-read", 30, OrderService, OrdersSegment, ["GET", "HEAD"],
            GatewayPolicies.OrderRead));
        routes.Add(Service("order-write", 31, OrderService, OrdersSegment,
            ["POST", "PUT", "PATCH", "DELETE"], GatewayPolicies.OrderWrite));

        routes.Add(Service("inventory-read", 40, InventoryService, InventorySegment,
            ["GET", "HEAD"], GatewayPolicies.InventoryRead));
        routes.Add(Service("inventory-write", 41, InventoryService, InventorySegment,
            ["POST", "PUT", "PATCH", "DELETE"], GatewayPolicies.InventoryWrite));

        routes.Add(Service("payment-process", 50, PaymentService, PaymentsSegment,
            ["POST", "PUT", "PATCH", "DELETE"], GatewayPolicies.PaymentProcess));

        var clusters = new List<ClusterConfig>
        {
            Cluster(IdentityService, options),
            Cluster(ProductCatalogService, options),
            Cluster(OrderService, options),
            Cluster(InventoryService, options),
            Cluster(PaymentService, options)
        };

        return ([.. routes], [.. clusters]);
    }

    /// <summary>
    /// One catch-all route for a service, guarded by a single policy.
    /// </summary>
    /// <remarks>
    /// The path is built from the service's own segment under <c>/api</c>, and nothing is stripped
    /// from it: the segment the caller sends is the segment the service published, so the forwarded
    /// path is already the one the service is listening on.
    /// </remarks>
    private static RouteConfig Service(
        string routeId,
        int order,
        string clusterId,
        string segment,
        string[] methods,
        string policy) => new()
    {
        RouteId = routeId,
        Order = order,
        ClusterId = clusterId,
        Match = new RouteMatch { Path = $"/api/{segment}/{{**remainder}}", Methods = methods },
        AuthorizationPolicy = policy
    };

    /// <summary>
    /// One cluster with a single destination. A cluster with one destination is still the right
    /// shape: it is where the address comes from, and it is the place a second replica or a
    /// service-discovery name would be added without touching any route.
    /// </summary>
    private static ClusterConfig Cluster(string name, GatewayOptions options)
    {
        if (!options.Services.TryGetValue(name, out var service))
        {
            throw new InvalidOperationException(
                $"No address is configured for the '{name}' service. Add it under " +
                $"Gateway:Services:{name} in appsettings.json.");
        }

        return new ClusterConfig
        {
            ClusterId = name,
            Destinations = new Dictionary<string, DestinationConfig>(StringComparer.OrdinalIgnoreCase)
            {
                [name] = new DestinationConfig { Address = service.ResolveAddress() }
            }
        };
    }
}
