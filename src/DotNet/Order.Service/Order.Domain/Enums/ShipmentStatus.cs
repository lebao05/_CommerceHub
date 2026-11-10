namespace Order.Domain.Enums;

/// <summary>
/// Shipment lifecycle. Stored as varchar(16) in shipments.status.
/// </summary>
public enum ShipmentStatus
{
    Pending = 0,
    Picking = 1,
    Packed = 2,
    Shipped = 3,
    InTransit = 4,
    Delivered = 5,
    Failed = 6,
    Returned = 7
}
