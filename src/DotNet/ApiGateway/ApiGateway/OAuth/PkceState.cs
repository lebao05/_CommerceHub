using System.Text.Json.Serialization;

namespace ApiGateway.OAuth;

/// <summary>
/// One entry in the PKCE state cookie, one round trip of the authorization handshake.
/// </summary>
/// <remarks>
/// Held in a cookie rather than server-side so the gateway can stay stateless between the
/// authorize request and the callback. The whole record fits in a single cookie and is opaque to
/// the browser because the cookie is HttpOnly. The <c>state</c> value is a random nonce that
/// doubles as the cookie's identifier: the callback looks the cookie up by the <c>state</c>
/// query parameter, which is what binds the cookie to a specific browser navigation rather than
/// to a different tab that happened to be loading at the same time.
/// </remarks>
public sealed class PkceState
{
    /// <summary>The opaque nonce the gateway sent in the authorize URL's <c>state</c> parameter.</summary>
    public required string State { get; init; }

    /// <summary>The PKCE verifier the gateway generated for this round trip.</summary>
    public required string CodeVerifier { get; init; }

    /// <summary>The client id the gateway is acting on behalf of.</summary>
    public required string ClientId { get; init; }

    /// <summary>The scope string the gateway requested, space-separated.</summary>
    public required string Scope { get; init; }

    /// <summary>Where to land the browser after a successful callback.</summary>
    public required string ReturnTo { get; init; }
}