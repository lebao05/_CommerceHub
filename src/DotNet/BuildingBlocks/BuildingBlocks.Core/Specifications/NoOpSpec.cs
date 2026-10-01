using System;
using System.Linq.Expressions;

namespace BuildingBlocks.Core.Specifications;

public class NoOpSpec<TEntity> : SpecificationBase<TEntity>
{
    public override Expression<Func<TEntity, bool>> Criteria => p => true;
}
