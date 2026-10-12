using MediatR;

namespace BuildingBlocks.Core.Domain;

public interface IDomainEvent : INotification
{
    DateTime DateOccurred { get; }
}
