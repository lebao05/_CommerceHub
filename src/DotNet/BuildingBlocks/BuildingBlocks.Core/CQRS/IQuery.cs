using MediatR;
using BuildingBlocks.Core.Domain;

namespace BuildingBlocks.Core.CQRS
{
    public interface IQuery : IRequest<IResult>
    {
    }
}
