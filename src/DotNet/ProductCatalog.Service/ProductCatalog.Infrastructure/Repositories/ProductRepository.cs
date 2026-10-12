using BuildingBlocks.Infrastructure.EfCore;
using Microsoft.EntityFrameworkCore;
using ProductCatalog.Domain.Entities;
using ProductCatalog.Domain.Repositories;
using ProductCatalog.Infrastructure.Persistence;

namespace ProductCatalog.Infrastructure.Repositories;

public class ProductRepository : RepositoryBase<ProductCatalogDbContext, Product>, IProductRepository
{
    public ProductRepository(ProductCatalogDbContext dbContext) : base(dbContext)
    {
    }

    public async Task<Product?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        return await DbContext.Products
            .FirstOrDefaultAsync(p => p.Slug == slug, cancellationToken);
    }

    public async Task<IEnumerable<Product>> GetByCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default)
    {
        return await DbContext.Products
            .Where(p => p.CategoryId == categoryId)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Product>> GetFeaturedAsync(int limit, CancellationToken cancellationToken = default)
    {
        return await DbContext.Products
            .Where(p => p.IsFeatured)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Product>> SearchAsync(string query, CancellationToken cancellationToken = default)
    {
        return await DbContext.Products
            .Where(p => p.Name.Contains(query) || (p.Description != null && p.Description.Contains(query)))
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken = default)
    {
        return await DbContext.Products
            .AnyAsync(p => p.Slug == slug, cancellationToken);
    }
}
