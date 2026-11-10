using BuildingBlocks.Core.Domain;
using Inventory.Domain.Enums;

namespace Inventory.Domain.Entities;

/// <summary>
/// Time-bounded hold of stock for an order (§3.3).
/// Contains exactly the columns listed in the reservations table.
/// </summary>
public class Reservation : EntityRootBase
{
    public Guid OrderId { get; private set; }
    public ReservationStatus Status { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public DateTime? CommittedAt { get; private set; }
    public DateTime? ReleasedAt { get; private set; }
    public string? ReleaseReason { get; private set; }
    public uint Xmin { get; private set; }

    private readonly List<ReservationLine> _lines = new();
    public IReadOnlyCollection<ReservationLine> Lines => _lines.AsReadOnly();

    private Reservation() { }

    public static Reservation Create(Guid orderId, DateTime expiresAt)
    {
        return new Reservation
        {
            OrderId = orderId,
            Status = ReservationStatus.Pending,
            ExpiresAt = expiresAt
        };
    }

    public ReservationLine AddLine(Guid productId, Guid variantId, decimal quantity)
    {
        var line = ReservationLine.Create(Id, productId, variantId, quantity);
        _lines.Add(line);
        Updated = DateTime.UtcNow;
        return line;
    }

    public void MarkActive()
    {
        EnsureTransition(ReservationStatus.Active);
        Status = ReservationStatus.Active;
        Updated = DateTime.UtcNow;
    }

    public void MarkCommitted()
    {
        EnsureTransition(ReservationStatus.Committed);
        Status = ReservationStatus.Committed;
        CommittedAt = DateTime.UtcNow;
        Updated = DateTime.UtcNow;
    }

    public void MarkReleased(string? releaseReason = null)
    {
        EnsureTransition(ReservationStatus.Released);
        Status = ReservationStatus.Released;
        ReleasedAt = DateTime.UtcNow;
        ReleaseReason = releaseReason;
        Updated = DateTime.UtcNow;
    }

    public void MarkExpired()
    {
        EnsureTransition(ReservationStatus.Expired);
        Status = ReservationStatus.Expired;
        ReleasedAt = DateTime.UtcNow;
        ReleaseReason = "expired";
        Updated = DateTime.UtcNow;
    }

    private void EnsureTransition(ReservationStatus to)
    {
        var allowed = (Status, to) switch
        {
            (ReservationStatus.Pending, ReservationStatus.Active) => true,
            (ReservationStatus.Active, ReservationStatus.Committed) => true,
            (ReservationStatus.Active, ReservationStatus.Released) => true,
            (ReservationStatus.Active, ReservationStatus.Expired) => true,
            _ => false
        };

        if (!allowed)
        {
            throw new InvalidOperationException(
                $"Reservation status transition from {Status} to {to} is not allowed.");
        }
    }
}
