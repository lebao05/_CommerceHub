using System;

namespace BuildingBlocks.Core.Domain
{
    public abstract class EventBase
    {
        public DateTime DateOccurred { get; protected set; } = DateTime.UtcNow;
    }
}
