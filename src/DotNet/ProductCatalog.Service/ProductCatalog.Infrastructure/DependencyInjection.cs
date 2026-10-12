using Microsoft.Extensions.DependencyInjection;
using BuildingBlocks.Infrastructure.EfCore;
using ProductCatalog.Infrastructure.Behaviors;
using ProductCatalog.Infrastructure.Persistence;
using ProductCatalog.Infrastructure.Repositories;

namespace ProductCatalog.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        string connectionString)
    {
        // Add DbContext with TxBehavior
        services.AddPostgresDbContext<ProductCatalogDbContext>(connectionString);

        // Register our own TxBehavior to override the one in BuildingBlocks (which has issues)
        services.AddScoped(typeof(MediatR.IPipelineBehavior<,>), typeof(ProductCatalog.Infrastructure.Behaviors.TxBehavior<,>));

        // Add Repositories
        services.AddRepository(typeof(ProductRepository));
        services.AddRepository(typeof(CategoryRepository));

        return services;
    }
}
