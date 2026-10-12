using System.Security.Claims;
using System.Text.Encodings.Web;
using ApiGateway.Sessions;
using Identity.Domain.Authorization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace ApiGateway.Sessions;

/// <summary>
/// Authenticates a request from the session cookie, on behalf of the browser flow.
/// </summary>
/// <remarks>
/// <para>
/// The handler reads the <see cref="SessionOptions.CookieName"/> cookie, looks the record up in
/// <see cref="ISessionStore"/>, and rebuilds a <see cref="ClaimsPrincipal"/> from the stored
/// claims. The principal is shaped to match what the OpenIddict bearer handler produces for the
/// same person, so downstream code (<see cref="ApiGateway.Proxy.IdentityClaimTransforms"/>, the
/// scope and active-account handlers) cannot tell which scheme authenticated the request.
/// </para>
/// <para>
/// The handler returns <see cref="AuthenticateResult.NoResult"/> when there is no cookie, which is
/// the convention that lets the bearer scheme take over on the same request: a request with no
/// cookie and no bearer is anonymous, and a request with no cookie but a valid bearer is
/// authenticated by the bearer scheme.
/// </para>
/// <para>
/// A cookie whose record has been deleted server-side returns
/// <see cref="AuthenticateResult.Fail"/>. The distinction from "no cookie" is that a caller with a
/// stale cookie should be told their session is gone, not silently treated as anonymous, and the
/// downstream code uses the failure to clear the cookie. The two together mean the next request is
/// clean.
/// </para>
/// <para>
/// Sliding idle expiry is implemented by touching the store on each successful hit, anchored on
/// the absolute endpoint. Reaching either end terminates the session.
/// </para>
/// </remarks>
public sealed class SessionAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    private readonly ISessionStore _store;

    public SessionAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        ISessionStore store)
        : base(options, logger, encoder)
    {
        _store = store;
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var sessionId = Context.Request.Cookies[SessionDefaults.CookieName];

        if (string.IsNullOrEmpty(sessionId))
        {
            return AuthenticateResult.NoResult();
        }

        SessionRecord? record;

        try
        {
            record = await _store.GetAsync(sessionId, Context.RequestAborted);
        }
        catch (Exception exception)
        {
            // Treat a store outage as a failed authentication rather than as an exception. The
            // caller will be prompted to sign in again, which surfaces the problem in the UI rather
            // than turning every API call into a 500.
            Logger.LogWarning(
                exception,
                "The session store failed while reading {SessionId}; treating as not logged in.",
                sessionId);

            return AuthenticateResult.Fail("The session store is unavailable.");
        }

        if (record is null)
        {
            // A cookie whose record has been deleted server-side is a stale cookie. Failing rather
            // than returning NoResult means the caller can be told their session is gone, and the
            // OAuth controller's logout path can clear the cookie.
            Context.Response.Cookies.Delete(SessionDefaults.CookieName);
            return AuthenticateResult.Fail("The session has expired.");
        }

        var principal = BuildPrincipal(record, Scheme.Name);

        // Sliding idle expiry. The save is fire-and-forget against the same record, anchored on the
                // absolute end. A failure to persist the slide turns into a session that expires at
                // its original idle end on the next save, which is a safe degradation.
        record = record with { LastSeenAt = DateTimeOffset.UtcNow };
        await _store.SaveAsync(sessionId, record, Context.RequestAborted);

        var ticket = new AuthenticationTicket(principal, Scheme.Name);
        return AuthenticateResult.Success(ticket);
    }

    /// <summary>
    /// Builds the same principal shape the bearer handler produces for the same person. That is the
    /// only thing keeping the scope and active-account handlers correct for both auth modes.
    /// </summary>
    /// <remarks>
    /// Claims are duplicated from the OAuth token rather than re-decoded: a session record carries
    /// the snapshot the gateway took when it exchanged the code, and trusting that snapshot is what
    /// makes a session revocation only take effect on the next refresh. Re-decoding would
    /// short-circuit that, and a revoked session that still authenticates is exactly the gap a
    /// session layer is meant to plug.
    /// </remarks>
    private static ClaimsPrincipal BuildPrincipal(SessionRecord record, string authenticationType)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, record.Subject),
            new("sub", record.Subject),
            new("client_id", record.ClientId)
        };

        foreach (var role in record.Roles)
        {
            claims.Add(new("role", role));
            claims.Add(new(ClaimTypes.Role, role));
        }

        // OAuth 2.0 requires the scope claim to be a single space-delimited value. Multiple
        // individual claims would also work, but writing one combined claim matches what the
        // bearer handler does and what ScopeRequirementHandler reads.
        if (record.Scopes.Count > 0)
        {
            claims.Add(new("scope", string.Join(' ', record.Scopes)));
        }

        if (!string.IsNullOrEmpty(record.AccountType))
        {
            claims.Add(new(TokenClaimNames.AccountType, record.AccountType));
        }

        if (!string.IsNullOrEmpty(record.Status))
        {
            claims.Add(new(TokenClaimNames.Status, record.Status));
        }

        var identity = new ClaimsIdentity(claims, authenticationType: authenticationType);
        return new ClaimsPrincipal(identity);
    }
}