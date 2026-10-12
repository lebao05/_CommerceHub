using ApiGateway.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yarp.ReverseProxy.Configuration;

namespace ApiGateway.Proxy;

/// <summary>
/// Registers YARP with the gateway's route table.
/// </summary>
public static class GatewayReverseProxyExtensions
{
    /// <summary>
    /// Adds the reverse proxy, the route table, and the claim-forwarding transforms.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Routes are handed to YARP as the <see cref="RouteConfig"/> and <see cref="ClusterConfig"/>
    /// objects that <c>GatewayRouteTable</c> built, rather than as a JSON section. The two are the
    /// same configuration either way: <c>RouteConfig.AuthorizationPolicy</c> is the property the
    /// <c>"AuthorizationPolicy"</c> configuration key populates, so a route registered this way is
    /// guarded exactly as it would be from <c>appsettings.json</c>. Going through the objects means
    /// the route table is checked by the compiler rather than by a string lookup that only fails
    /// when the first request arrives.
    /// </para>
    /// <para>
    /// <c>MapReverseProxy</c> is not called here. It maps the endpoints the authorization middleware
    /// then enforces, and a route's <c>AuthorizationPolicy</c> is honoured only if
    /// <c>UseAuthorization</c> is in the pipeline ahead of the endpoints, which is a decision about
    /// ordering that belongs with the rest of the pipeline in <c>Program</c>. Calling it here would
    /// hide that ordering dependency, which is the whole reason a gateway can end up with routes
    /// that look guarded and are not.
    /// </para>
    /// </remarks>
    public static IServiceCollection AddGatewayReverseProxy(
        this IServiceCollection services,
        GatewayOptions options)
    {
        var (routes, clusters) = GatewayRouteTable.Build(options);

        services.AddReverseProxy()
            .LoadFromMemory(routes, clusters)
            .AddIdentityClaimForwarding();

        return services;
    }
}
