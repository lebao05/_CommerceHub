namespace BuildingBlocks.Core.CQRS
{
    public interface ICreateCommand : ICommand, ITxRequest
    {
    }
}
