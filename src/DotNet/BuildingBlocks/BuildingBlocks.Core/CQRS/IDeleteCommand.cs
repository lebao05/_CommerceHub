namespace BuildingBlocks.Core.CQRS
{
    public interface IDeleteCommand<TId> : ICommand
        where TId : struct
    {
        public TId Id { get; init; }
    }
}
