using System;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Core.Domain;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace BuildingBlocks.Infrastructure.Bus.RabbitMQ
{
    public class RabbitMQEventBus : IEventBus, IDisposable
    {
        private readonly RabbitMQOptions _options;
        private readonly ILogger<RabbitMQEventBus> _logger;
        private readonly IConnection _connection;
        private readonly IModel _channel;

        public RabbitMQEventBus(
            IOptions<RabbitMQOptions> options,
            ILogger<RabbitMQEventBus> logger)
        {
            _options = options.Value ?? throw new ArgumentNullException(nameof(options));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));

            try
            {
                var factory = new ConnectionFactory
                {
                    HostName = _options.HostName,
                    Port = _options.Port,
                    UserName = _options.UserName,
                    Password = _options.Password,
                    VirtualHost = _options.VirtualHost,
                    DispatchConsumersAsync = true
                };

                _connection = factory.CreateConnection();
                _channel = _connection.CreateModel();

                _channel.ExchangeDeclare(
                    exchange: _options.ExchangeName,
                    type: _options.ExchangeType,
                    durable: _options.Durable,
                    autoDelete: _options.AutoDelete);

                _logger.LogInformation("RabbitMQ connection established to {HostName}:{Port}", 
                    _options.HostName, _options.Port);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to establish RabbitMQ connection");
                throw;
            }
        }

        public Task PublishAsync<TEvent>(TEvent @event, string[] topics = default, CancellationToken token = default)
            where TEvent : IDomainEvent
        {
            if (@event == null)
                throw new ArgumentNullException(nameof(@event));

            try
            {
                var eventName = @event.GetType().Name;
                var routingKey = topics?.Length > 0 ? string.Join(".", topics) : eventName;

                var message = JsonSerializer.Serialize(@event, @event.GetType());
                var body = Encoding.UTF8.GetBytes(message);

                var properties = _channel.CreateBasicProperties();
                properties.Persistent = true;
                properties.ContentType = "application/json";
                properties.Type = eventName;
                properties.MessageId = Guid.NewGuid().ToString();
                properties.Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds());

                _channel.BasicPublish(
                    exchange: _options.ExchangeName,
                    routingKey: routingKey,
                    basicProperties: properties,
                    body: body);

                _logger.LogInformation("Published event {EventName} with routing key {RoutingKey} to RabbitMQ",
                    eventName, routingKey);

                return Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish event {@Event} to RabbitMQ", @event);
                throw;
            }
        }

        public Task SubscribeAsync<TEvent>(string[] topics = default, CancellationToken token = default)
            where TEvent : IDomainEvent
        {
            var eventName = typeof(TEvent).Name;
            var routingKey = topics?.Length > 0 ? string.Join(".", topics) : eventName;

            _logger.LogInformation("RabbitMQ subscription for {EventName} with routing key {RoutingKey} - " +
                "Note: Actual consumer implementation should be done via BackgroundService",
                eventName, routingKey);

            return Task.CompletedTask;
        }

        public void Dispose()
        {
            _channel?.Close();
            _channel?.Dispose();
            _connection?.Close();
            _connection?.Dispose();
            _logger.LogInformation("RabbitMQ connection disposed");
        }
    }
}
