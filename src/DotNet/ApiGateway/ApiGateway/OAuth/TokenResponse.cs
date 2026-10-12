using System.Text.Json;
using System.Text.Json.Serialization;

namespace ApiGateway.OAuth;

/// <summary>
/// The shape of the JSON the identity server's <c>/connect/token</c> endpoint returns.
/// </summary>
public sealed class TokenResponse
{
    [JsonPropertyName("access_token")]
    public string? AccessToken { get; init; }

    [JsonPropertyName("token_type")]
    public string? TokenType { get; init; }

    [JsonPropertyName("expires_in")]
    public int? ExpiresIn { get; init; }

    [JsonPropertyName("refresh_token")]
    public string? RefreshToken { get; init; }

    [JsonPropertyName("scope")]
    public string? Scope { get; init; }

    [JsonPropertyName("error")]
    public string? Error { get; init; }

    [JsonPropertyName("error_description")]
    public string? ErrorDescription { get; init; }
}

/// <summary>
/// The shape of the JSON the identity server's <c>/connect/introspect</c> endpoint returns. The
/// gateway uses introspection on the access token it stored to recover the claims, which avoids
/// having to trust a payload encoded into the JWT itself.
/// </summary>
public sealed class IntrospectionResponse
{
    [JsonPropertyName("active")]
    public bool Active { get; init; }

    [JsonPropertyName("sub")]
    public string? Subject { get; init; }

    [JsonPropertyName("client_id")]
    public string? ClientId { get; init; }

    [JsonPropertyName("scope")]
    public string? Scope { get; init; }

    [JsonPropertyName("role")]
    public List<string>? Roles { get; init; }

    [JsonPropertyName("account_type")]
    public string? AccountType { get; init; }

    [JsonPropertyName("status")]
    public string? Status { get; init; }

    [JsonPropertyName("aud")]
    public List<string>? Audience { get; init; }

    [JsonPropertyName("exp")]
    public long? ExpiresAt { get; init; }

    [JsonPropertyName("iat")]
    public long? IssuedAt { get; init; }
}