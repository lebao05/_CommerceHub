using BuildingBlocks.Core.Domain;
using MediatR;

namespace BuildingBlocks.Infrastructure.EfCore;

public class EventWrapper : INotification
{
    public EventBase Event { get; }

    public EventWrapper(EventBase @event)
    {
        Event = @event;
    }
}
