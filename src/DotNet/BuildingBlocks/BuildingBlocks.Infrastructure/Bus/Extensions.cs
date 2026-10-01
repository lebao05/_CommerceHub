using System;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using BuildingBlocks.Infrastructure.Bus.Dapr;
using BuildingBlocks.Infrastructure.Bus.Kafka;
using BuildingBlocks.Infrastructure.Bus.RabbitMQ;

namespace BuildingBlocks.Infrastructure.Bus
{
    public static class Extensions
    {
        public static IServiceCollection AddMessageBroker(this IServiceCollection services,
            IConfiguration config,
            string messageBrokerType = "dapr")
        {
            switch (messageBrokerType.ToLower())
            {
                case "dapr":
                    services.Configure<DaprEventBusOptions>(config.GetSection(DaprEventBusOptions.Name));
                    services.AddScoped<IEventBus, DaprEventBus>();
                    break;
                case "rabbitmq":
                    services.Configure<RabbitMQOptions>(config.GetSection(RabbitMQOptions.Name));
                    services.AddSingleton<IEventBus, RabbitMQEventBus>();
                    break;
                default:
                    throw new ArgumentException($"Unsupported message broker type: {messageBrokerType}");
            }

            return services;
        }

        public static IServiceCollection AddKafkaConsumer(this IServiceCollection services,
            Action<KafkaConsumerConfig> configAction)
        {
            services.AddHostedService<BackGroundKafkaConsumer>();

            services.AddOptions<KafkaConsumerConfig>()
                .BindConfiguration(KafkaConsumerConfig.Name)
                .Configure(configAction);

            return services;
        }
    }
}
