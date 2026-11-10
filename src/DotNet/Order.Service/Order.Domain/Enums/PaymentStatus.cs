namespace Order.Domain.Enums;

/// <summary>
/// Payment state machine (order-service-database.md §4.2).
/// Stored as varchar(16) in payments.status.
/// </summary>
public enum PaymentStatus
{
    Pending = 0,
    Authorized = 1,
    Captured = 2,
    Failed = 3,
    Void = 4,
    Refunded = 5
}
