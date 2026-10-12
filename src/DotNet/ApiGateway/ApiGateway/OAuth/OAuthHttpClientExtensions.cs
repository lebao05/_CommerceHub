using ApiGateway.Configuration;
using ApiGateway.OAuth;
using Microsoft.Extensions.Options;

namespace ApiGateway.OAuth;

/// <summary>
/// Registers the <see cref="OAuthHttpClient"/> as a typed client against a named
/// <see cref="HttpClient"/>.
/// </summary>
public static class OAuthHttpClientExtensions
{
    /// <summary>
    /// Adds the OAuth HTTP client. The base address is the identity issuer (which is also the
    /// discovery document's base), and the timeout is generous because the token endpoint does
    /// password hashing on the resource owner password flow, which can take a moment when the
    /// browser is asking for many scopes.
    /// </summary>
    public static IServiceCollection AddGatewayOAuthHttpClient(
        this IServiceCollection services,
        IdentityEndpoints endpoints)
    {
        services.AddHttpClient<OAuthHttpClient>(OAuthHttpClient.HttpClientName, http =>
        {
            http.BaseAddress = endpoints.Issuer;
            http.DefaultRequestHeaders.Add("Accept", "application/json");
            http.Timeout = TimeSpan.FromSeconds(15);
        });

        return services;
    }
}