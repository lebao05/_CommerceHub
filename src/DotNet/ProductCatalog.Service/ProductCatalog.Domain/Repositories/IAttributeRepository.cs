namespace ProductCatalog.Domain.Repositories;

public interface IAttributeRepository
{
    Task<Attribute?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Attribute?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<IEnumerable<Attribute>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<Attribute>> GetActiveAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<Attribute>> GetFilterableAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<Attribute>> GetSearchableAsync(CancellationToken cancellationToken = default);
    Task AddAsync(Attribute attribute, CancellationToken cancellationToken = default);
    Task UpdateAsync(Attribute attribute, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> CodeExistsAsync(string code, CancellationToken cancellationToken = default);
}
