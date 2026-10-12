using BuildingBlocks.Core.Repositories;
using ProductCatalog.Domain.Entities;

namespace ProductCatalog.Domain.Repositories;

public interface ICategoryRepository : IRepository<Category>
{
    Task<IEnumerable<Category>> GetByParentIdAsync(Guid? parentId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Category>> GetActiveAsync(CancellationToken cancellationToken = default);
}
