namespace ApiGateway.Config;

public static class GatewayConfigReader
{
    public static GatewayConfig GetGatewayConfig(this IConfiguration config)
    {
        var result = new GatewayConfig
        {
            Url = config.GetValue("Gateway:Url", ""),
            SessionTimeoutInMin = config.GetValue("Session:IdleMinutes", 60),
            ApiPath = config.GetValue("Gateway:ApiPath", "/api/"),
            Authority = config["Gateway:Identity:Issuer"] ?? config["OpenIdConnect:Authority"] ?? "",
            ExternalAuthority = config.GetValue<string>("OpenIdConnect:ExternalAuthority"),
            ClientId = config["Session:GatewayClientId"] ?? config["OpenIdConnect:ClientId"] ?? "",
            ClientSecret = config["Session:GatewayClientSecret"] ?? config["OpenIdConnect:ClientSecret"] ?? "",
            Scopes = config.GetValue(
                "OpenIdConnect:Scopes",
                "openid profile email offline_access product.read product.write order.read order.write inventory.read inventory.write payment.process admin.full"),
            LogoutUrl = config.GetValue("OpenIdConnect:LogoutUrl", ""),
            CorsOrigins = config.GetSection("Gateway:Cors:Origins").Get<string[]>() ?? [],
            DownStreamServices = config.GetSection("OpenIdConnect:DownStreamServices").Get<List<DownStreamServiceConfig>>() ?? []
        };

        if (!Uri.TryCreate(result.Authority, UriKind.Absolute, out _))
        {
            throw new InvalidOperationException("Gateway:Identity:Issuer must be an absolute URL.");
        }

        if (string.IsNullOrWhiteSpace(result.ClientId))
        {
            throw new InvalidOperationException("Session:GatewayClientId must be configured.");
        }

        if (string.IsNullOrWhiteSpace(result.ClientSecret))
        {
            throw new InvalidOperationException(
                "Session:GatewayClientSecret must be configured using user secrets or an environment variable.");
        }

        return result;
    }
}
