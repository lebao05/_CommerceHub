using MediatR;
using BuildingBlocks.Core.Domain;

namespace BuildingBlocks.Core.CQRS
{
    public interface ICommand : IRequest<IResult>
    {
    }
}
