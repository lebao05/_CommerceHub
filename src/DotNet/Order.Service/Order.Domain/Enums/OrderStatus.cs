namespace Order.Domain.Enums;

/// <summary>
/// Order lifecycle state machine (order-service-database.md §4.1).
/// Stored as varchar(24) in the orders.order_status column.
/// </summary>
public enum OrderStatus
{
    Pending = 0,
    Confirmed = 1,
    PartiallyShipped = 2,
    Shipped = 3,
    Delivered = 4,
    Completed = 5,
    Failed = 6,
    Cancelled = 7
}
