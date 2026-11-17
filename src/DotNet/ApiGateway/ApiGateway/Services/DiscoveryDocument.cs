using ApiGateway.Config;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;

namespace ApiGateway.Services;

public sealed class DiscoveryDocument
{
    private readonly IConfigurationManager<OpenIdConnectConfiguration> _configurationManager;

    public DiscoveryDocument(GatewayConfig config)
    {
        if (!Uri.TryCreate(config.Authority, UriKind.Absolute, out var authority))
        {
            throw new InvalidOperationException("OpenIdConnect:Authority must be an absolute URL.");
        }

        var metadataAddress = new Uri(authority, ".well-known/openid-configuration").AbsoluteUri;
        var retriever = new HttpDocumentRetriever
        {
            RequireHttps = authority.Scheme == Uri.UriSchemeHttps
        };

        _configurationManager = new ConfigurationManager<OpenIdConnectConfiguration>(
            metadataAddress,
            new OpenIdConnectConfigurationRetriever(),
            retriever);
    }

    public Task<OpenIdConnectConfiguration> GetAsync(CancellationToken cancellationToken = default) =>
        _configurationManager.GetConfigurationAsync(cancellationToken);
}
