using System.Collections.Generic;
using BuildingBlocks.Core.Domain;

namespace BuildingBlocks.Core.CQRS
{
    public interface IListQuery : IQuery
    {
        public List<string> Includes { get; init; }
        public List<FilterModel> Filters { get; init; }
        public List<string> Sorts { get; init; }
        public int Page { get; init; }
        public int PageSize { get; init; }
    }
}
