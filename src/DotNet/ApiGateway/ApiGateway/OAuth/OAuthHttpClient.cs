using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using ApiGateway.Configuration;
using ApiGateway.Sessions;
using Microsoft.Extensions.Options;
using SessionOptions = ApiGateway.Sessions.SessionOptions;

namespace ApiGateway.OAuth;

/// <summary>
/// Talks to the identity server's <c>/connect/token</c> and <c>/connect/introspect</c> endpoints
/// on behalf of the gateway.
/// </summary>
/// <remarks>
/// <para>
/// A named <see cref="HttpClient"/> rather than a hand-managed one, so the handler is pooled and
/// its timeouts are configurable. The client id and secret are read from
/// <see cref="SessionOptions"/>, which is itself bound from configuration; rotating the secret is a
/// configuration edit followed by a process restart, not a code edit.
/// </para>
/// <para>
/// The introspection call is what recovers the claims that go into the session record. The
/// access token is a JWT, so the gateway could decode it without a round trip, but decoding it
/// would mean trusting the signature against a key only the identity server has. Introspection
/// is the documented OpenIddict way to ask the server "what do these claims say right now" and
/// is the path that keeps a revoked session from quietly authenticating.
/// </para>
/// </remarks>
public sealed class OAuthHttpClient
{
    /// <summary>The named client, registered in <see cref="OAuthHttpClientExtensions"/>.</summary>
    public const string HttpClientName = "IdentityServer";

    private readonly HttpClient _http;
    private readonly SessionOptions _options;
    private readonly ILogger<OAuthHttpClient> _logger;

    public OAuthHttpClient(
        HttpClient http,
        IOptions<SessionOptions> options,
        ILogger<OAuthHttpClient> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
    }

    /// <summary>
    /// Performs the authorization-code exchange with the identity server.
    /// </summary>
    public async Task<TokenResponse> ExchangeAuthorizationCodeAsync(
        string code,
        string codeVerifier,
        string redirectUri,
        CancellationToken cancellationToken)
    {
        var parameters = new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["client_id"] = _options.GatewayClientId,
            ["client_secret"] = _options.GatewayClientSecret!,
            ["code"] = code,
            ["code_verifier"] = codeVerifier,
            ["redirect_uri"] = redirectUri
        };

        return await PostFormAsync(parameters, cancellationToken);
    }

    /// <summary>
    /// Performs the refresh-token exchange. Returns the new tokens, or a response whose
    /// <see cref="TokenResponse.Error"/> is non-null if the refresh failed.
    /// </summary>
    public async Task<TokenResponse> RefreshAsync(
        string refreshToken,
        CancellationToken cancellationToken)
    {
        var parameters = new Dictionary<string, string>
        {
            ["grant_type"] = "refresh_token",
            ["client_id"] = _options.GatewayClientId,
            ["client_secret"] = _options.GatewayClientSecret!,
            ["refresh_token"] = refreshToken
        };

        return await PostFormAsync(parameters, cancellationToken);
    }

    /// <summary>
    /// Introspects the access token at the identity server. Returns null if the token is not
    /// active, which is the documented shape of an expired or revoked token.
    /// </summary>
    public async Task<IntrospectionResponse?> IntrospectAsync(
        string accessToken,
        CancellationToken cancellationToken)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "connect/introspect")
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["token"] = accessToken,
                ["client_id"] = _options.GatewayClientId,
                ["client_secret"] = _options.GatewayClientSecret!
            })
        };

        // RFC 7662 requires HTTP Basic auth on the introspect endpoint, with the body as form data.
        // OpenIddict accepts Basic auth; the body-based client_id/secret also works for our setup
        // but Basic is the documented way.
        var basic = Convert.ToBase64String(
            Encoding.UTF8.GetBytes($"{_options.GatewayClientId}:{_options.GatewayClientSecret}"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", basic);

        using var response = await _http.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning(
                "Introspection returned {Status} for an access token.",
                (int)response.StatusCode);

            return null;
        }

        var payload = await response.Content.ReadAsStringAsync(cancellationToken);
        var introspected = JsonSerializer.Deserialize<IntrospectionResponse>(
            payload,
            new JsonSerializerOptions(JsonSerializerDefaults.Web));

        return introspected is { Active: true } ? introspected : null;
    }

    private async Task<TokenResponse> PostFormAsync(
        Dictionary<string, string> parameters,
        CancellationToken cancellationToken)
    {
        // The gateway authenticates with HTTP Basic, the documented way for a confidential client
        // calling /connect/token. Form-encoding the credentials is also supported, but Basic
        // removes one source of confusion if the operator is reading the wire trace.
        var basic = Convert.ToBase64String(
            Encoding.UTF8.GetBytes($"{_options.GatewayClientId}:{_options.GatewayClientSecret}"));

        var request = new HttpRequestMessage(HttpMethod.Post, "connect/token")
        {
            Content = new FormUrlEncodedContent(parameters),
            Headers = { Authorization = new AuthenticationHeaderValue("Basic", basic) }
        };

        using var response = await _http.SendAsync(request, cancellationToken);

        var payload = await response.Content.ReadAsStringAsync(cancellationToken);

        // A non-200 from /connect/token is a normal failure shape -- the body is the same JSON
        // envelope the success body is, but with `error` and `error_description` populated. Reading
        // it as TokenResponse is the simplest way to surface that to the caller.
        var tokenResponse = JsonSerializer.Deserialize<TokenResponse>(
            payload,
            new JsonSerializerOptions(JsonSerializerDefaults.Web));

        if (tokenResponse is null)
        {
            return new TokenResponse
            {
                Error = "invalid_response",
                ErrorDescription = "The identity server returned an empty response."
            };
        }

        return tokenResponse;
    }
}