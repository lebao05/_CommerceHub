using System.Collections.Generic;

namespace BuildingBlocks.Core.CQRS
{
    public interface IItemQuery<TId> : IQuery
        where TId : struct
    {
        public List<string> Includes { get; init; }
        public TId Id { get; init; }
    }
}
