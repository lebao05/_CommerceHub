namespace BuildingBlocks.Core.CQRS
{
    public interface IUpdateCommand<TId> : ICommand, ITxRequest
        where TId : struct
    {
        public TId Id { get; init; }
    }
}
