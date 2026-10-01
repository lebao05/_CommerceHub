namespace BuildingBlocks.Infrastructure.Bus.Dapr
{
    public class DaprEventBusOptions
    {
        public const string Name = "Dapr";
        
        public string PubSubName { get; set; } = "pubsub";
        public string DaprHttpEndpoint { get; set; } = "http://localhost:3500";
        public string DaprGrpcEndpoint { get; set; } = "http://localhost:50001";
    }
}
