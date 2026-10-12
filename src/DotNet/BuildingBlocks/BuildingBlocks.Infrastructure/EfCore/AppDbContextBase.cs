using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using BuildingBlocks.Core.Domain;

namespace BuildingBlocks.Infrastructure.EfCore;

public abstract class AppDbContextBase : DbContext, IDomainEventContext, IDbFacadeResolver
{
    protected AppDbContextBase(DbContextOptions options) : base(options)
    {
    }

    public IEnumerable<EventBase> GetDomainEvents()
    {
        var domainEntities = ChangeTracker
            .Entries<IAggregateRoot>()
            .Where(x =>
                x.Entity.DomainEvents != null &&
                x.Entity.DomainEvents.Any())
            .ToImmutableList();

        var domainEvents = domainEntities
            .SelectMany(x => x.Entity.DomainEvents)
            .ToImmutableList();

        domainEntities.ForEach(entity => entity.Entity.DomainEvents.Clear());

        return domainEvents;
    }
}
