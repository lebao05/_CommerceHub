namespace BuildingBlocks.Infrastructure.Bus.RabbitMQ
{
    public class RabbitMQOptions
    {
        public const string Name = "RabbitMQ";
        
        public string HostName { get; set; } = "localhost";
        public int Port { get; set; } = 5672;
        public string UserName { get; set; } = "guest";
        public string Password { get; set; } = "guest";
        public string VirtualHost { get; set; } = "/";
        public string ExchangeName { get; set; } = "event_bus";
        public string ExchangeType { get; set; } = "topic";
        public bool Durable { get; set; } = true;
        public bool AutoDelete { get; set; } = false;
    }
}
