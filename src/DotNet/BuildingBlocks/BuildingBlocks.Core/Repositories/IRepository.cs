using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Core.Domain;

namespace BuildingBlocks.Core.Repositories
{
    public interface IRepository<TEntity> where TEntity : class, IAggregateRoot
    {
        Task<TEntity?> FindById(Guid id, CancellationToken cancellationToken = default);
        Task<TEntity?> FindOneAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default);
        Task<List<TEntity>> FindAsync(Expression<Func<TEntity, bool>>? predicate = null, CancellationToken cancellationToken = default);
        Task<bool> AnyAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default);
        Task<long> CountAsync(Expression<Func<TEntity, bool>>? predicate = null, CancellationToken cancellationToken = default);
        Task<TEntity> AddAsync(TEntity entity, bool autoSave = true, CancellationToken cancellationToken = default);
        Task<TEntity> EditAsync(TEntity entity, bool autoSave = true, CancellationToken cancellationToken = default);
        ValueTask DeleteAsync(TEntity entity, bool autoSave = true, CancellationToken cancellationToken = default);
    }
}
