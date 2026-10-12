using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BuildingBlocks.Core.Domain;
using BuildingBlocks.Core.Repositories;

namespace BuildingBlocks.Infrastructure.EfCore;

public abstract class RepositoryBase<TDbContext, TEntity> : IRepository<TEntity>
    where TEntity : class, IAggregateRoot
    where TDbContext : DbContext
{
    protected readonly TDbContext DbContext;
    protected readonly DbSet<TEntity> DbSet;

    protected RepositoryBase(TDbContext dbContext)
    {
        DbContext = dbContext;
        DbSet = dbContext.Set<TEntity>();
    }

    public async Task<TEntity?> FindById(Guid id, CancellationToken cancellationToken = default)
    {
        return await DbSet.SingleOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<TEntity?> FindOneAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await DbSet.FirstOrDefaultAsync(predicate, cancellationToken);
    }

    public async Task<List<TEntity>> FindAsync(Expression<Func<TEntity, bool>>? predicate = null, CancellationToken cancellationToken = default)
    {
        if (predicate is null)
        {
            return await DbSet.ToListAsync(cancellationToken);
        }

        return await DbSet.Where(predicate).ToListAsync(cancellationToken);
    }

    public async Task<bool> AnyAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await DbSet.AnyAsync(predicate, cancellationToken);
    }

    public async Task<long> CountAsync(Expression<Func<TEntity, bool>>? predicate = null, CancellationToken cancellationToken = default)
    {
        if (predicate is null)
        {
            return await DbSet.LongCountAsync(cancellationToken);
        }

        return await DbSet.LongCountAsync(predicate, cancellationToken);
    }

    public async Task<TEntity> AddAsync(TEntity entity, bool autoSave = true, CancellationToken cancellationToken = default)
    {
        await DbSet.AddAsync(entity, cancellationToken);

        if (autoSave)
        {
            await DbContext.SaveChangesAsync(cancellationToken);
        }

        return entity;
    }

    public async Task<TEntity> EditAsync(TEntity entity, bool autoSave = true, CancellationToken cancellationToken = default)
    {
        var entry = DbContext.Entry(entity);
        entry.State = EntityState.Modified;

        if (autoSave)
        {
            await DbContext.SaveChangesAsync(cancellationToken);
        }

        return entry.Entity;
    }

    public async ValueTask DeleteAsync(TEntity entity, bool autoSave = true, CancellationToken cancellationToken = default)
    {
        DbSet.Remove(entity);

        if (autoSave)
        {
            await DbContext.SaveChangesAsync(cancellationToken);
        }
    }
}
