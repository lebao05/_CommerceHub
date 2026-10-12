using System.Security.Claims;
using Identity.Domain.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Yarp.ReverseProxy.Transforms;

namespace ApiGateway.Proxy;

/// <summary>
/// Forwards the identity of the caller, as proved by the validated token, to the downstream service.
/// </summary>
/// <remarks>
/// <para>
/// The downstream services authenticate nobody. They sit on the same network as the gateway, trust
/// the connection, and read the caller's identity from headers. That is only safe while those
/// headers are unforgeable, which is the entire point of the transforms below.
/// </para>
/// <para>
/// Two rules follow, and both are about <i>where the value comes from</i> rather than what it
/// contains:
/// </para>
/// <list type="number">
/// <item>
/// The values are read from <c>context.HttpContext.User</c>, the principal OpenIddict built after
/// checking the token's signature and expiry. Reading a request header would authorize on something
/// the caller chose.
/// </item>
/// <item>
/// Each header is written with Set semantics, never Append. YARP copies the incoming request
/// headers to the outgoing request before the transforms run, so a caller that sends
/// <c>X-User-Id: someone-else</c> arrives at the service with that value already present. Appending
/// the real one would produce <c>someone-else, real-user</c>, and a service that parses the first
/// value reads the attacker's choice. Setting the header overwrites whatever was there, so the
/// attacker's value is gone before the legitimate one is written. This is why the mode is Set and
/// why the empty-value Set below is not dead weight: it is the step that deletes the forged value.
/// </item>
/// </list>
/// <para>
/// The <c>Authorization</c> header is left alone on purpose. YARP forwards it by default, so a
/// service that later grows its own token validation needs no change here at all, and the gateway's
/// claim headers can be treated as a convenience rather than as the only source of identity.
/// </para>
/// </remarks>
public static class IdentityClaimTransforms
{
    /// <summary>Header carrying the token's <c>sub</c> claim.</summary>
    public const string SubjectHeader = "X-User-Id";

    /// <summary>Header carrying the token's <c>role</c> claims, comma separated.</summary>
    public const string RolesHeader = "X-User-Roles";

    /// <summary>Header carrying the calling client's id, from <c>client_id</c> or <c>azp</c>.</summary>
    public const string ClientIdHeader = "X-Client-Id";

    /// <summary>Header carrying the token's <c>account_type</c> claim.</summary>
    public const string AccountTypeHeader = "X-Account-Type";

    /// <summary>
    /// The claim types read from the validated principal.
    /// </summary>
    /// <remarks>
    /// Spelled out as literals rather than taken from <c>OpenIddictConstants</c> so the gateway's
    /// dependency on the token's shape is one readable list instead of a scattering of constants
    /// whose provenance you have to go and check.
    /// </remarks>
    private const string SubjectClaim = "sub";

    private const string RoleClaim = "role";
    private const string ClientIdClaim = "client_id";
    private const string AuthorizedPartyClaim = "azp";

    /// <summary>
    /// The account's privilege tier. Taken from the constant the identity server writes it from rather
    /// than spelled out here, so a rename on the writing side cannot leave this gateway forwarding an
    /// empty header and every service treating the caller as unprivileged.
    /// </summary>
    private const string AccountTypeClaim = TokenClaimNames.AccountType;

    /// <summary>
    /// Registers the transforms. Applies to every route, including the anonymous ones, because a
    /// service must never see an <c>X-User-Id</c> it did not get from a validated token.
    /// </summary>
    public static IReverseProxyBuilder AddIdentityClaimForwarding(this IReverseProxyBuilder builder) =>
        builder.AddTransforms(transforms => transforms
            // Set mode, with an empty value, deletes the caller's value. In YARP 2.x the Set/Append
            // choice is this boolean rather than the RequestHeaderMode enum older versions used;
            // append: false is Set.
            .AddRequestHeader(SubjectHeader, string.Empty, append: false)
            .AddRequestHeader(RolesHeader, string.Empty, append: false)
            .AddRequestHeader(ClientIdHeader, string.Empty, append: false)
            .AddRequestHeader(AccountTypeHeader, string.Empty, append: false)

            // Registered last, so it runs after the Set transforms above and after YARP's own
            // default forwarding of the incoming headers, and therefore has the last word on every
            // one of these four headers.
            .AddRequestTransform(WriteClaimHeadersAsync));

    /// <summary>
    /// Writes the caller's identity, or removes the header when the request is anonymous.
    /// </summary>
    /// <remarks>
    /// An anonymous request gets the headers removed rather than written empty, so that a service
    /// which distinguishes "no caller" from "a caller with a blank name" does the right thing on its
    /// own without having to know anything about this gateway.
    /// </remarks>
    private static ValueTask WriteClaimHeadersAsync(RequestTransformContext context)
    {
        var principal = context.HttpContext.User;

        Write(context, SubjectHeader, Read(principal, SubjectClaim));
        Write(context, RolesHeader, ReadRoles(principal));
        Write(context, ClientIdHeader, Read(principal, ClientIdClaim, AuthorizedPartyClaim));
        Write(context, AccountTypeHeader, Read(principal, AccountTypeClaim));

        return ValueTask.CompletedTask;
    }

    /// <summary>
    /// The value of the first of <paramref name="claimTypes"/> the token carries.
    /// </summary>
    /// <remarks>
    /// More than one type is accepted where the specification allows two spellings of the same fact.
    /// A JWT access token carries <c>client_id</c>, while an RFC 9068 JSON Web Token uses the
    /// authorized-party claim <c>azp</c>; checking only one of them would leave a token issued under
    /// the other with an empty <c>X-Client-Id</c>, and a service keying an audit record on it would
    /// record the call as anonymous.
    /// </remarks>
    private static string? Read(ClaimsPrincipal? principal, params string[] claimTypes)
    {
        foreach (var claimType in claimTypes)
        {
            var value = principal?.FindFirst(claimType)?.Value;

            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        return null;
    }

    /// <summary>
    /// Removes any value already on the outgoing request, then writes the verified one.
    /// </summary>
    /// <remarks>
    /// The remove is not redundant with the Set transform above. It is what makes this method
    /// correct on its own terms: <c>TryAddWithoutValidation</c> appends, and appending to a header
    /// a caller already populated is precisely the bug this whole type exists to prevent.
    /// </remarks>
    private static void Write(RequestTransformContext context, string header, string? value)
    {
        context.ProxyRequest.Headers.Remove(header);

        if (!string.IsNullOrEmpty(value))
        {
            context.ProxyRequest.Headers.TryAddWithoutValidation(header, value);
        }
    }

    /// <summary>
    /// Joins the <c>role</c> claims with commas.
    /// </summary>
    /// <remarks>
    /// OpenIddict emits one <c>role</c> claim per role, so a user with two roles arrives with two
    /// claims rather than one delimited value. Reading only the first would silently drop the
    /// second, which for a staff account holding both administrative roles means the parts of the
    /// console that check for "SalesAdmin" would work while the parts that check for "SystemAdmin"
    /// quietly would not. Comma is the separator because a role name cannot contain one, and because
    /// a comma-separated header is what a service can split without a JSON parser.
    /// </remarks>
    private static string? ReadRoles(ClaimsPrincipal? principal)
    {
        var roles = principal?
            .FindAll(RoleClaim)
            .Select(claim => claim.Value)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .ToArray() ?? [];

        return roles.Length == 0 ? null : string.Join(",", roles);
    }
}
