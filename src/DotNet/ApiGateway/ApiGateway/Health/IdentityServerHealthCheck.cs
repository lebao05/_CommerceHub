using Microsoft.Extensions.Diagnostics.HealthChecks;

using ApiGateway.Configuration;

namespace ApiGateway.Health;

/// <summary>
/// Checks that the identity server is reachable by fetching its discovery document.
/// </summary>
/// <remarks>
/// <para>
/// This is a <em>readiness</em> signal, not a dependency the gateway needs in order to serve. The
/// gateway forwards to five services and none of them require the identity server to be up: an
/// anonymous product browse works, and an already-issued token keeps validating from the cached
/// signing keys. So this check reports <see cref="HealthCheckResult.Degraded"/> and is registered
/// with no failure status, and the gateway's own <c>/health</c> endpoint keeps answering 200 while
/// the identity server restarts.
/// </para>
/// <para>
/// That matters because a liveness probe wired to this would take the gateway out of rotation for
/// something it can still serve, and would turn an identity server restart into a storefront
/// outage. The honest reading is "degraded, not broken", and the health endpoint says so while
/// still passing.
/// </para>
/// <para>
/// Fetching the discovery document rather than making a bare TCP connect is deliberate: the
/// discovery endpoint is the exact URL the token validator will use, so a check that succeeds here
/// is evidence that validation will succeed too, and a failure here has the same cause as a real
/// one.
/// </para>
/// </remarks>
public sealed class IdentityServerHealthCheck : IHealthCheck
{
    /// <summary>Name this check is registered under.</summary>
    public const string Name = "identity-server";

    /// <summary>How long to wait before deciding the identity server is unreachable.</summary>
    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(3);

    private readonly HttpClient _httpClient;
    private readonly IdentityEndpoints _endpoints;
    private readonly ILogger<IdentityServerHealthCheck> _logger;

    public IdentityServerHealthCheck(
        HttpClient httpClient,
        IdentityEndpoints endpoints,
        ILogger<IdentityServerHealthCheck> logger)
    {
        _httpClient = httpClient;
        _endpoints = endpoints;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(Timeout);

        try
        {
            using var response = await _httpClient.GetAsync(
                _endpoints.DiscoveryEndpoint,
                HttpCompletionOption.ResponseHeadersRead,
                timeout.Token);

            if (response.IsSuccessStatusCode)
            {
                return HealthCheckResult.Healthy(
                    $"The identity server is reachable at {_endpoints.DiscoveryEndpoint}.");
            }

            _logger.LogWarning(
                "The identity server answered {StatusCode} for {Endpoint}.",
                (int)response.StatusCode,
                _endpoints.DiscoveryEndpoint);

            return HealthCheckResult.Degraded(
                $"The identity server answered {(int)response.StatusCode} for its discovery document.");
        }
        catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException)
        {
            // Not an Unhealthy, for the reason in the type remarks. The timeout shows up as a
            // TaskCanceledException too, which is why it is caught here and not rethrown: a slow
            // identity server and an absent one are the same signal to whoever reads /health.
            _logger.LogWarning(
                exception,
                "The identity server could not be reached at {Endpoint}.",
                _endpoints.DiscoveryEndpoint);

            return HealthCheckResult.Degraded(
                $"The identity server could not be reached at {_endpoints.DiscoveryEndpoint}. " +
                "Token validation will fail until it returns; already-issued tokens keep working.");
        }
    }
}
