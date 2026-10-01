using System;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace BuildingBlocks.Infrastructure.Bus.RabbitMQ
{
    public class RabbitMQConsumer : BackgroundService
    {
        private readonly RabbitMQOptions _options;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly ILogger<RabbitMQConsumer> _logger;
        private IConnection _connection;
        private IModel _channel;
        private readonly string _queueName;

        public RabbitMQConsumer(
            IOptions<RabbitMQOptions> options,
            IServiceScopeFactory serviceScopeFactory,
            ILogger<RabbitMQConsumer> logger,
            string queueName = null)
        {
            _options = options.Value ?? throw new ArgumentNullException(nameof(options));
            _serviceScopeFactory = serviceScopeFactory ?? throw new ArgumentNullException(nameof(serviceScopeFactory));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _queueName = queueName ?? $"queue_{Environment.MachineName}_{Guid.NewGuid():N}";
        }

        public override Task StartAsync(CancellationToken cancellationToken)
        {
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

                _channel.QueueDeclare(
                    queue: _queueName,
                    durable: true,
                    exclusive: false,
                    autoDelete: false,
                    arguments: null);

                _logger.LogInformation("RabbitMQ consumer started with queue: {QueueName}", _queueName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to start RabbitMQ consumer");
                throw;
            }

            return base.StartAsync(cancellationToken);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            stoppingToken.ThrowIfCancellationRequested();

            var consumer = new AsyncEventingBasicConsumer(_channel);
            consumer.Received += async (sender, eventArgs) =>
            {
                try
                {
                    var body = eventArgs.Body.ToArray();
                    var message = Encoding.UTF8.GetString(body);
                    var eventType = eventArgs.BasicProperties?.Type;

                    _logger.LogInformation("Received message: {EventType} from queue: {QueueName}",
                        eventType, _queueName);

                    using var scope = _serviceScopeFactory.CreateScope();
                    var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

                    // Deserialize and publish to MediatR
                    // Note: You'll need to implement type resolution and deserialization based on your event types
                    // This is a simplified version
                    var @event = JsonSerializer.Deserialize<INotification>(message);
                    if (@event != null)
                    {
                        await mediator.Publish(@event, stoppingToken);
                        _logger.LogInformation("Dispatched {EventType} to internal handler", eventType);
                    }

                    _channel.BasicAck(eventArgs.DeliveryTag, false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing message from RabbitMQ");
                    _channel.BasicNack(eventArgs.DeliveryTag, false, true);
                }
            };

            _channel.BasicConsume(
                queue: _queueName,
                autoAck: false,
                consumer: consumer);

            await Task.CompletedTask;
        }

        public override void Dispose()
        {
            _channel?.Close();
            _channel?.Dispose();
            _connection?.Close();
            _connection?.Dispose();
            base.Dispose();
            _logger.LogInformation("RabbitMQ consumer disposed");
        }
    }
}
