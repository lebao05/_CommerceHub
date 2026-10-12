using BuildingBlocks.Infrastructure.EfCore;
using Microsoft.EntityFrameworkCore;
using ProductCatalog.Domain.Entities;
using ProductCatalog.Domain.Repositories;
using ProductCatalog.Infrastructure.Persistence;

namespace ProductCatalog.Infrastructure.Repositories;

public class CategoryRepository : RepositoryBase<ProductCatalogDbContext, Category>, ICategoryRepository
{
    public CategoryRepository(ProductCatalogDbContext dbContext) : base(dbContext)
    {
    }

    public async Task<IEnumerable<Category>> GetByParentIdAsync(Guid? parentId, CancellationToken cancellationToken = default)
    {
        return await DbContext.Categories
            .Where(c => c.ParentId == parentId)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Category>> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        return await DbContext.Categories
            .Where(c => c.IsActive)
            .ToListAsync(cancellationToken);
    }
}
