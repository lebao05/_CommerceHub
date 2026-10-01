using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Core.Domain;

namespace BuildingBlocks.Infrastructure.Bus
{
    public interface IEventBus
    {
        Task PublishAsync<TEvent>(TEvent @event, string[] topics = default, CancellationToken token = default)
            where TEvent : IDomainEvent;

        Task SubscribeAsync<TEvent>(string[] topics = default, CancellationToken token = default)
            where TEvent : IDomainEvent;
    }
}
