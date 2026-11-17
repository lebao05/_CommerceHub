using System.Security.Cryptography;
using System.Text;
using Duende.IdentityServer;
using Duende.IdentityServer.Models;

namespace Identity.Server;

public static class Config
{
    private static readonly string[] ProfileClaims =
    [
        "name",
        "given_name",
        "family_name",
        "last_name",
        "address_street",
        "address_city",
        "address_state",
        "address_country",
        "address_zip_code"
    ];

    public static IEnumerable<IdentityResource> IdentityResources =>
    [
        new Duende.IdentityServer.Models.IdentityResources.OpenId(),
        new Duende.IdentityServer.Models.IdentityResources.Profile(),
        new Duende.IdentityServer.Models.IdentityResources.Email(),
        new IdentityResource("coolstore.profile", "CoolStore profile", ProfileClaims)
    ];

    public static IEnumerable<ApiScope> ApiScopes =>
    [
        new("sale.all", "Full access to the sale domain"),
        new("sale.read", "Read access to the sale domain"),
        new("sale.write", "Write access to the sale domain"),
        new("product.read", "Read access to products"),
        new("product.write", "Write access to products"),
        new("order.read", "Read access to orders"),
        new("order.write", "Write access to orders"),
        new("inventory.read", "Read access to inventory"),
        new("inventory.write", "Write access to inventory"),
        new("payment.process", "Process payments"),
        new("profile.read", "Read the user's profile"),
        new("profile.write", "Update the user's profile"),
        new("admin.full", "Full administrative access")
    ];

    public static IEnumerable<ApiResource> ApiResources =>
    [
        new("sale-api", "Sale APIs")
        {
            Scopes = { "sale.all", "sale.read", "sale.write" },
            UserClaims = { "sub", "name", "last_name", "act" }
        },
        new("commercehub-api", "CommerceHub APIs")
        {
            Scopes =
            {
                "product.read",
                "product.write",
                "order.read",
                "order.write",
                "inventory.read",
                "inventory.write",
                "payment.process",
                "profile.read",
                "profile.write",
                "admin.full"
            },
            UserClaims = { "sub", "name", "role" }
        }
    ];

    public static IEnumerable<Client> Clients(IConfiguration configuration)
    {
        var internalUrl = configuration["IdentityClients:InternalUrl"] ?? "http://localhost:5108";
        var publicUrl = configuration["IdentityClients:PublicUrl"] ?? "http://localhost:5108";
        var gatewaySecret = RequiredSecret(configuration, "IdentityClients:GatewaySecret");
        var saleApiSecret = RequiredSecret(configuration, "IdentityClients:SaleApiSecret");

        yield return CreateGatewayClient("gw-api", gatewaySecret, internalUrl, publicUrl);
        yield return CreateGatewayClient("commercehub-gateway", gatewaySecret, internalUrl, publicUrl);

        yield return new Client
        {
            ClientId = "sale-api",
            ClientName = "Sale API",
            ClientSecrets = { HashSecret(saleApiSecret) },
            AllowedGrantTypes = { "urn:ietf:params:oauth:grant-type:token-exchange" },
            AllowedScopes = { "sale.read", "sale.write" },
            RequireConsent = false
        };
    }

    private static Client CreateGatewayClient(
        string clientId,
        string secret,
        string internalUrl,
        string publicUrl) =>
        new()
        {
            ClientId = clientId,
            ClientName = "CommerceHub API Gateway",
            ClientSecrets = { HashSecret(secret) },
            AllowedGrantTypes = GrantTypes.Code,
            RequirePkce = true,
            RequireClientSecret = true,
            RedirectUris =
            {
                $"{internalUrl.TrimEnd('/')}/signin-oidc",
                $"{publicUrl.TrimEnd('/')}/signin-oidc"
            },
            PostLogoutRedirectUris =
            {
                $"{internalUrl.TrimEnd('/')}/signout-callback-oidc",
                $"{publicUrl.TrimEnd('/')}/signout-callback-oidc"
            },
            BackChannelLogoutUri = $"{internalUrl.TrimEnd('/')}/logout",
            AllowedScopes =
            {
                IdentityServerConstants.StandardScopes.OpenId,
                IdentityServerConstants.StandardScopes.Profile,
                IdentityServerConstants.StandardScopes.Email,
                IdentityServerConstants.StandardScopes.OfflineAccess,
                "coolstore.profile",
                "sale.all",
                "product.read",
                "product.write",
                "order.read",
                "order.write",
                "inventory.read",
                "inventory.write",
                "payment.process",
                "profile.read",
                "profile.write",
                "admin.full"
            },
            AllowOfflineAccess = true,
            RequireConsent = true,
            AllowAccessTokensViaBrowser = false,
            RefreshTokenUsage = TokenUsage.OneTimeOnly,
            RefreshTokenExpiration = TokenExpiration.Sliding,
            SlidingRefreshTokenLifetime = 30 * 24 * 60 * 60,
            AbsoluteRefreshTokenLifetime = 90 * 24 * 60 * 60
        };

    private static Secret HashSecret(string secret)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(secret));
        return new Secret(Convert.ToHexString(hash).ToLowerInvariant());
    }

    private static string RequiredSecret(IConfiguration configuration, string key)
    {
        var value = configuration[key];
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"{key} must be configured using a secret store or environment variable.");
        }

        return value;
    }
}
