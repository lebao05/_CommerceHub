using Identity.Server.Data;

namespace Identity.Server.Services;

public sealed class DatabaseInitializationHostedService(IServiceProvider services) : IHostedService
{
    public Task StartAsync(CancellationToken cancellationToken) =>
        SeedData.InitializeAsync(services, cancellationToken);

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
