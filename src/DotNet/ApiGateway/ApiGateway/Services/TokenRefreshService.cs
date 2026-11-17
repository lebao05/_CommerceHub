using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using ApiGateway.Config;

namespace ApiGateway.Services;

public sealed class TokenRefreshService(
    IHttpClientFactory httpClientFactory,
    DiscoveryDocument discoveryDocument,
    GatewayConfig config,
    ILogger<TokenRefreshService> logger)
{
    public async Task<TokenRefreshResponse?> RefreshAsync(
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(refreshToken);

        var discovery = await discoveryDocument.GetAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(discovery.TokenEndpoint))
        {
            throw new InvalidOperationException("The identity server discovery document has no token endpoint.");
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, discovery.TokenEndpoint)
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "refresh_token",
                ["client_id"] = config.ClientId,
                ["client_secret"] = config.ClientSecret,
                ["refresh_token"] = refreshToken
            })
        };

        using var response = await httpClientFactory.CreateClient("oidc")
            .SendAsync(request, cancellationToken);
        var token = await response.Content.ReadFromJsonAsync<TokenEndpointResponse>(
            cancellationToken: cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            if (string.Equals(token?.Error, "invalid_grant", StringComparison.Ordinal))
            {
                logger.LogInformation("The identity server rejected an expired or revoked refresh token.");
                return null;
            }

            throw new HttpRequestException(
                $"The identity server token refresh failed with status {(int)response.StatusCode} ({token?.Error ?? response.ReasonPhrase}).");
        }

        if (token is null
            || string.IsNullOrWhiteSpace(token.AccessToken)
            || token.ExpiresIn is null or <= 0)
        {
            throw new InvalidDataException("The identity server returned an incomplete token refresh response.");
        }

        return new TokenRefreshResponse(
            token.AccessToken,
            token.IdToken ?? string.Empty,
            token.RefreshToken ?? refreshToken,
            token.ExpiresIn.Value.ToString(CultureInfo.InvariantCulture));
    }

    private sealed class TokenEndpointResponse
    {
        [JsonPropertyName("access_token")]
        public string? AccessToken { get; init; }

        [JsonPropertyName("id_token")]
        public string? IdToken { get; init; }

        [JsonPropertyName("refresh_token")]
        public string? RefreshToken { get; init; }

        [JsonPropertyName("expires_in")]
        public int? ExpiresIn { get; init; }

        [JsonPropertyName("error")]
        public string? Error { get; init; }
    }
}

public sealed record TokenRefreshResponse(
    string AccessToken,
    string IdToken,
    string RefreshToken,
    string Expires);
