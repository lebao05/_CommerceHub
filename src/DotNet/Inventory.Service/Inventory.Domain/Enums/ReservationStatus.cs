namespace Inventory.Domain.Enums;

/// <summary>
/// Reservation lifecycle (inventory-service-database.md §3.3, §4.1).
/// Stored as varchar(16) in reservations.status.
/// </summary>
public enum ReservationStatus
{
    Pending = 0,
    Active = 1,
    Committed = 2,
    Released = 3,
    Expired = 4
}
