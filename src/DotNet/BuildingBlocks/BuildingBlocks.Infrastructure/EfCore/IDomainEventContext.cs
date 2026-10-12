using System.Collections.Generic;
using BuildingBlocks.Core.Domain;

namespace BuildingBlocks.Infrastructure.EfCore;

public interface IDomainEventContext
{
    IEnumerable<EventBase> GetDomainEvents();
}
