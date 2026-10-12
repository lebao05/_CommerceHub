using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ApiGateway.Csrf;
using ApiGateway.Sessions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SessionOptions = ApiGateway.Sessions.SessionOptions;

namespace ApiGateway.OAuth;

/// <summary>
/// Owns the browser half of the OAuth handshake: redirecting to the identity server, exchanging
/// the returned code for tokens, persisting the result as a session, and clearing that session on
/// logout.
/// </summary>
/// <remarks>
/// <para>
/// The gateway is a confidential client of the identity server, registered as
/// <c>commercehub-gateway</c>. The browser-facing SPAs (<c>commercehub-web</c>,
/// <c>admin-dashboard</c>) keep their own registrations but their redirect URIs now point at this
/// gateway. The result is that the SPAs hold no tokens at all: only an opaque session id and a
/// CSRF token, both set by the gateway and both scoped to its origin.
/// </para>
/// <para>
/// PKCE is used because the gateway is a confidential client; the secret it sends with the token
/// request is the actual authentication, and the verifier binds the code to the round trip that
/// asked for it.
/// </para>
/// </remarks>
[ApiController]
[Route("oauth")]
public sealed class OAuthController : ControllerBase
{
    private const string AuthorizePath = "connect/authorize";

    private readonly OAuthHttpClient _oauthClient;
    private readonly ISessionStore _sessions;
    private readonly SessionOptions _options;
    private readonly TimeProvider _time;
    private readonly ILogger<OAuthController> _logger;

    public OAuthController(
        OAuthHttpClient oauthClient,
        ISessionStore sessions,
        IOptions<SessionOptions> options,
        TimeProvider time,
        ILogger<OAuthController> logger)
    {
        _oauthClient = oauthClient;
        _sessions = sessions;
        _options = options.Value;
        _time = time;
        _logger = logger;
    }

    /// <summary>
    /// Starts the sign-in flow. The browser is redirected to the identity server's authorize
    /// endpoint with PKCE and a state parameter, both bound to a short-lived cookie.
    /// </summary>
    /// <remarks>
    /// No <c>client_id</c> is required: this gateway only acts on behalf of the two registered
    /// SPAs, and the client id is implied by the <c>audience</c> query parameter the SPA sends
    /// (storefront or admin). This keeps the URL short and avoids a per-page-client mapping that
    /// would have to be kept in step with the identity server's registrations.
    /// </remarks>
    [HttpGet("login")]
    public IActionResult Login(
        [FromQuery(Name = "return_to")] string? returnTo,
        [FromQuery(Name = "audience")] string? audience)
    {
        var clientId = ResolveClientId(audience);

        if (clientId is null)
        {
            return BadRequest(new
            {
                succeeded = false,
                error = new
                {
                    code = "unknown_audience",
                    message = $"audience must be one of: {string.Join(", ", _options.AllowedClients)}."
                }
            });
        }

        var safeReturnTo = ValidateReturnTo(returnTo, ResolveOrigin(clientId));

        // PKCE: 32 random bytes, base64-url encoded. The challenge is the SHA-256 of the verifier,
        // also base64-url encoded. The verifier lives only in the cookie and in the token exchange;
        // never in the URL.
        var codeVerifier = GeneratePkceVerifier();
        var codeChallenge = Sha256Base64Url(codeVerifier);
        var state = GenerateState();

        var pkce = new PkceState
        {
            State = state,
            CodeVerifier = codeVerifier,
            ClientId = clientId,
            Scope = ResolveScopesFor(clientId),
            ReturnTo = safeReturnTo
        };

        WritePkceCookie(pkce);

        // The authorize URL is built from the issuer's base address; the identity server then
        // redirects back to the gateway's /oauth/callback with the code. The redirect_uri here has
        // to match the one registered for the gateway's client registration exactly, which is
        // why this is built from configuration rather than from the request.
        var callbackUri = $"{_options.GatewayOrigin.TrimEnd('/')}/oauth/callback";

        var authorizeUrl = $"{_options.GatewayOrigin.TrimEnd('/')}/{AuthorizePath}"
            + $"?client_id={Uri.EscapeDataString(clientId)}"
            + $"&response_type=code"
            + $"&scope={Uri.EscapeDataString(pkce.Scope)}"
            + $"&state={Uri.EscapeDataString(state)}"
            + $"&code_challenge={Uri.EscapeDataString(codeChallenge)}"
            + $"&code_challenge_method=S256"
            + $"&redirect_uri={Uri.EscapeDataString(callbackUri)}";

        _logger.LogInformation(
            "Starting the OAuth flow for client {ClientId}, audience {Audience}.",
            clientId, audience);

        return Redirect(authorizeUrl);
    }

    /// <summary>
    /// Handles the identity server's callback, persists the session, sets the cookies, and lands
    /// the browser on the SPA.
    /// </summary>
    [HttpGet("callback")]
    public async Task<IActionResult> Callback(
        [FromQuery(Name = "code")] string? code,
        [FromQuery(Name = "state")] string? state,
        [FromQuery(Name = "error")] string? error,
        CancellationToken cancellationToken)
    {
        var pkce = ReadPkceCookie();

        // The cookie must be present and the state must match. A missing cookie means the cookie
        // was lost (browser cleared it between requests), a mismatched state means the callback
        // arrived for a different request than the one that started it.
        if (pkce is null || !string.Equals(pkce.State, state, StringComparison.Ordinal))
        {
            return BadRequest(new
            {
                succeeded = false,
                error = new
                {
                    code = "invalid_state",
                    message = "The OAuth state cookie is missing or did not match. Restart the sign-in."
                }
            });
        }

        ClearPkceCookie();

        if (!string.IsNullOrEmpty(error))
        {
            _logger.LogWarning(
                "The identity server reported {Error} at the OAuth callback for {ClientId}.",
                error,
                pkce.ClientId);

            return BadRequest(new
            {
                succeeded = false,
                error = new
                {
                    code = error,
                    message = "The identity server refused the sign-in."
                }
            });
        }

        if (string.IsNullOrEmpty(code))
        {
            return BadRequest(new
            {
                succeeded = false,
                error = new
                {
                    code = "missing_code",
                    message = "The OAuth callback did not include an authorization code."
                }
            });
        }

        var callbackUri = $"{_options.GatewayOrigin.TrimEnd('/')}/oauth/callback";

        var token = await _oauthClient.ExchangeAuthorizationCodeAsync(
            code,
            pkce.CodeVerifier,
            callbackUri,
            cancellationToken);

        if (token.Error is not null || string.IsNullOrEmpty(token.AccessToken))
        {
            _logger.LogWarning(
                "Token exchange failed for {ClientId}: {Error} {Description}.",
                pkce.ClientId,
                token.Error,
                token.ErrorDescription);

            return BadRequest(new
            {
                succeeded = false,
                error = new
                {
                    code = token.Error ?? "token_exchange_failed",
                    message = token.ErrorDescription ?? "The token exchange failed."
                }
            });
        }

        var introspected = await _oauthClient.IntrospectAsync(token.AccessToken, cancellationToken);

        if (introspected is null || string.IsNullOrEmpty(introspected.Subject))
        {
            return BadRequest(new
            {
                succeeded = false,
                error = new
                {
                    code = "introspection_failed",
                    message = "The identity server did not recognise the access token it just issued."
                }
            });
        }

        var now = _time.GetUtcNow();

        var record = new SessionRecord
        {
            Subject = introspected.Subject,
            ClientId = introspected.ClientId ?? pkce.ClientId,
            Scopes = SplitScopes(introspected.Scope ?? pkce.Scope),
            Roles = introspected.Roles ?? [],
            AccountType = introspected.AccountType,
            Status = introspected.Status,
            AccessToken = token.AccessToken,
            RefreshToken = token.RefreshToken,
            AccessTokenExpiresAt = now + TimeSpan.FromSeconds(token.ExpiresIn ?? 0),
            CreatedAt = now,
            LastSeenAt = now,
            AbsoluteExpiresAt = now + _options.AbsoluteTimeout
        };

        var sessionId = GenerateSessionId();

        await _sessions.SaveAsync(sessionId, record, cancellationToken);

        WriteSessionCookies(sessionId);

        _logger.LogInformation(
            "Opened session {SessionId} for {Subject} on {ClientId}.",
            sessionId,
            record.Subject,
            record.ClientId);

        return Redirect(pkce.ReturnTo);
    }

    /// <summary>
    /// Deletes the session and clears the cookies. The identity server's own cookie is not touched
    /// here -- it expires on its own, and there is no benefit to redirecting the browser through
    /// /connect/endsession that outweighs the additional request.
    /// </summary>
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        var sessionId = Request.Cookies[SessionDefaults.CookieName];

        if (!string.IsNullOrEmpty(sessionId))
        {
            await _sessions.DeleteAsync(sessionId, cancellationToken);
        }

        ClearSessionCookies();

        var origin = _options.StorefrontOrigin;

        _logger.LogInformation(
            "Closed session {SessionId}.",
            sessionId ?? "(none)");

        return Redirect(origin);
    }

    /// <summary>
    /// Maps an audience hint to one of the registered SPA clients.
    /// </summary>
    private string? ResolveClientId(string? audience)
    {
        if (string.IsNullOrWhiteSpace(audience))
        {
            return null;
        }

        return _options.AllowedClients
            .FirstOrDefault(c => string.Equals(c, audience, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>Maps the client id to its origin for the return-to check.</summary>
    private string ResolveOrigin(string clientId) => clientId switch
    {
        "admin-dashboard" => _options.AdminOrigin,
        _ => _options.StorefrontOrigin
    };

    /// <summary>
    /// The default scope set per client. The OAuth 2.0 server narrows the grant against the
    /// client's registration at publish time, so the gateway's request has to name the same scopes
    /// the client is registered for, not the union of what any caller could want.
    /// </summary>
    private string ResolveScopesFor(string clientId) => clientId switch
    {
        "admin-dashboard" => "openid profile email offline_access profile.read profile.write " +
                              "product.read order.read order.write inventory.read payment.process " +
                              "product.write inventory.write admin.full",
        _ => "openid profile email offline_access profile.read profile.write " +
             "product.read order.read order.write inventory.read payment.process"
    };

    /// <summary>
    /// Restricts <paramref name="returnTo"/> to the client's origin. A return-to URL pointing at
    /// any other origin would let a third party turn the OAuth handshake into an open redirect.
    /// </summary>
    private static string ValidateReturnTo(string? returnTo, string allowedOrigin)
    {
        if (string.IsNullOrWhiteSpace(returnTo) || !Uri.TryCreate(returnTo, UriKind.Absolute, out var parsed))
        {
            return allowedOrigin;
        }

        var scheme = parsed.Scheme;

        if (!string.Equals(scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            return allowedOrigin;
        }

        var origin = $"{parsed.Scheme}://{parsed.Authority}";

        return string.Equals(origin, allowedOrigin, StringComparison.OrdinalIgnoreCase)
            ? returnTo
            : allowedOrigin;
    }

    private void WritePkceCookie(PkceState state)
    {
        var value = JsonSerializer.Serialize(state, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        var encoded = Base64UrlEncode(Encoding.UTF8.GetBytes(value));

        Response.Cookies.Append(SessionDefaults.PkceCookieName, encoded, new CookieOptions
        {
            HttpOnly = true,
            Secure = !HttpContext.Request.IsHttps || IsProduction(),
            SameSite = SameSiteMode.Lax,
            // Five minutes is enough for a human to type them in, and is short enough that an
            // abandoned flow does not leave a replayable cookie in Redis's place.
            MaxAge = TimeSpan.FromMinutes(5),
            Path = "/"
        });
    }

    private PkceState? ReadPkceCookie()
    {
        var raw = Request.Cookies[SessionDefaults.PkceCookieName];

        if (string.IsNullOrEmpty(raw))
        {
            return null;
        }

        try
        {
            var bytes = Base64UrlDecode(raw);
            return JsonSerializer.Deserialize<PkceState>(
                bytes,
                new JsonSerializerOptions(JsonSerializerDefaults.Web));
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Discarded a corrupted PKCE cookie.");
            return null;
        }
    }

    private void ClearPkceCookie()
    {
        Response.Cookies.Delete(SessionDefaults.PkceCookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = !HttpContext.Request.IsHttps || IsProduction(),
            SameSite = SameSiteMode.Lax,
            Path = "/"
        });
    }

    private void WriteSessionCookies(string sessionId)
    {
        // The session cookie. HttpOnly is the security property: it is what stops JavaScript from
        // reading it and forwarding it to a third party. Secure in production, because it would
        // otherwise travel over plaintext.
        Response.Cookies.Append(SessionDefaults.CookieName, sessionId, new CookieOptions
        {
            HttpOnly = true,
            Secure = !HttpContext.Request.IsHttps || IsProduction(),
            SameSite = SameSiteMode.Lax,
            MaxAge = _options.IdleTimeout,
            Path = "/"
        });

        // The CSRF cookie. Not HttpOnly on purpose: JavaScript reads it to populate the X-CSRF
        // header. Secure and SameSite=Lax, like the session cookie. A new token is generated per
        // session; if a session is restored from a stale cookie, the CSRF cookie will have been
        // cleared by the handler that rejected the read.
        Response.Cookies.Append(CsrfDefaults.CookieName, CsrfToken.Generate(), new CookieOptions
        {
            HttpOnly = false,
            Secure = !HttpContext.Request.IsHttps || IsProduction(),
            SameSite = SameSiteMode.Lax,
            MaxAge = _options.IdleTimeout,
            Path = "/"
        });
    }

    private void ClearSessionCookies()
    {
        Response.Cookies.Delete(SessionDefaults.CookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = !HttpContext.Request.IsHttps || IsProduction(),
            SameSite = SameSiteMode.Lax,
            Path = "/"
        });

        Response.Cookies.Delete(CsrfDefaults.CookieName, new CookieOptions
        {
            HttpOnly = false,
            Secure = !HttpContext.Request.IsHttps || IsProduction(),
            SameSite = SameSiteMode.Lax,
            Path = "/"
        });
    }

    private bool IsProduction() =>
        !string.Equals(Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"), "Development", StringComparison.OrdinalIgnoreCase);

    private static string GeneratePkceVerifier()
    {
        var buffer = new byte[32];
        RandomNumberGenerator.Fill(buffer);
        return Base64UrlEncode(buffer);
    }

    private static string Sha256Base64Url(string input)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Base64UrlEncode(hash);
    }

    private static string GenerateState()
    {
        var buffer = new byte[24];
        RandomNumberGenerator.Fill(buffer);
        return Base64UrlEncode(buffer);
    }

    private static string GenerateSessionId()
    {
        var buffer = new byte[32];
        RandomNumberGenerator.Fill(buffer);
        return Base64UrlEncode(buffer);
    }

    private static IReadOnlyList<string> SplitScopes(string scope) =>
        scope.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] Base64UrlDecode(string value)
    {
        var padded = value.Replace('-', '+').Replace('_', '/');

        switch (padded.Length % 4)
        {
            case 2: padded += "=="; break;
            case 3: padded += "="; break;
        }

        return Convert.FromBase64String(padded);
    }
}