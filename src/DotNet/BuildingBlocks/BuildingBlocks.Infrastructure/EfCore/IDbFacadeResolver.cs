using Microsoft.EntityFrameworkCore.Infrastructure;

namespace BuildingBlocks.Infrastructure.EfCore;

public interface IDbFacadeResolver
{
    DatabaseFacade Database { get; }
}
