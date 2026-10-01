using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Core.Domain;
using Dapr.Client;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BuildingBlocks.Infrastructure.Bus.Dapr
{
    public class DaprEventBus : IEventBus
    {
        private readonly DaprClient _daprClient;
        private readonly DaprEventBusOptions _options;
        private readonly ILogger<DaprEventBus> _logger;

        public DaprEventBus(
            DaprClient daprClient,
            IOptions<DaprEventBusOptions> options,
            ILogger<DaprEventBus> logger)
        {
            _daprClient = daprClient ?? throw new ArgumentNullException(nameof(daprClient));
            _options = options.Value ?? throw new ArgumentNullException(nameof(options));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task PublishAsync<TEvent>(TEvent @event, string[] topics = default, CancellationToken token = default)
            where TEvent : IDomainEvent
        {
            if (@event == null)
                throw new ArgumentNullException(nameof(@event));

            try
            {
                var topicName = topics?.Length > 0 ? topics[0] : @event.GetType().Name;

                await _daprClient.PublishEventAsync(
                    pubsubName: _options.PubSubName,
                    topicName: topicName,
                    data: @event,
                    cancellationToken: token);

                _logger.LogInformation("Published event {EventName} to topic {TopicName} via Dapr pubsub {PubSubName}",
                    @event.GetType().Name, topicName, _options.PubSubName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish event {@Event} to Dapr", @event);
                throw;
            }
        }

        public Task SubscribeAsync<TEvent>(string[] topics = default, CancellationToken token = default)
            where TEvent : IDomainEvent
        {
            var topicName = topics?.Length > 0 ? topics[0] : typeof(TEvent).Name;

            _logger.LogInformation("Dapr subscription for topic {TopicName} - " +
                "Note: Subscriptions are handled via Dapr's declarative subscription or programmatic routing",
                topicName);

            return Task.CompletedTask;
        }
    }
}
