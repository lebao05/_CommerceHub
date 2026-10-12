using BuildingBlocks.Core.Repositories;
using ProductCatalog.Domain.Entities;

namespace ProductCatalog.Domain.Repositories;

public interface IProductRepository : IRepository<Product>
{
    Task<Product?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<IEnumerable<Product>> GetByCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Product>> GetFeaturedAsync(int limit, CancellationToken cancellationToken = default);
    Task<IEnumerable<Product>> SearchAsync(string query, CancellationToken cancellationToken = default);
    Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken = default);
}
