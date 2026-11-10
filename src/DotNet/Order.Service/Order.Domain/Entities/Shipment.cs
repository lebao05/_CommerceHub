using BuildingBlocks.Core.Domain;
using Order.Domain.Enums;

namespace Order.Domain.Entities;

/// <summary>
/// One fulfilment parcel within an order (§3.5). Contains exactly the columns
/// listed in the shipments table.
/// </summary>
public class Shipment : EntityBase
{
    public Guid OrderId { get; private set; }
    public ShipmentStatus Status { get; private set; }
    public string? Carrier { get; private set; }
    public DateTime? ShippedAt { get; private set; }
    public DateTime? DeliveredAt { get; private set; }
    public decimal ShippingFee { get; private set; }

    private Shipment() { }

    public static Shipment Create(
        Guid orderId,
        decimal shippingFee,
        string? carrier = null)
    {
        var shipment = new Shipment
        {
            OrderId = orderId,
            Status = ShipmentStatus.Pending,
            Carrier = carrier,
            ShippingFee = shippingFee
        };
        shipment.Updated = DateTime.UtcNow;
        return shipment;
    }

    public void SetCarrier(string? carrier)
    {
        Carrier = carrier;
        Updated = DateTime.UtcNow;
    }

    public void MarkPicking()
    {
        Status = ShipmentStatus.Picking;
        Updated = DateTime.UtcNow;
    }

    public void MarkPacked()
    {
        Status = ShipmentStatus.Packed;
        Updated = DateTime.UtcNow;
    }

    public void MarkShipped()
    {
        Status = ShipmentStatus.Shipped;
        ShippedAt = DateTime.UtcNow;
        Updated = DateTime.UtcNow;
    }

    public void MarkInTransit()
    {
        Status = ShipmentStatus.InTransit;
        Updated = DateTime.UtcNow;
    }

    public void MarkDelivered()
    {
        Status = ShipmentStatus.Delivered;
        DeliveredAt = DateTime.UtcNow;
        Updated = DateTime.UtcNow;
    }

    public void MarkFailed()
    {
        Status = ShipmentStatus.Failed;
        Updated = DateTime.UtcNow;
    }

    public void MarkReturned()
    {
        Status = ShipmentStatus.Returned;
        Updated = DateTime.UtcNow;
    }
}
