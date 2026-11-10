using BuildingBlocks.Core.Domain;

namespace Inventory.Domain.Entities;

/// <summary>
/// One held line within a reservation (§3.4).
/// Contains exactly the columns listed in the reservation_lines table.
/// </summary>
public class ReservationLine : EntityBase
{
    public Guid ReservationId { get; private set; }
    public Guid ProductId { get; private set; }
    public Guid VariantId { get; private set; }
    public decimal Quantity { get; private set; }

    private ReservationLine() { }

    public static ReservationLine Create(
        Guid reservationId,
        Guid productId,
        Guid variantId,
        decimal quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than zero.");
        }

        return new ReservationLine
        {
            ReservationId = reservationId,
            ProductId = productId,
            VariantId = variantId,
            Quantity = quantity
        };
    }

    public void UpdateQuantity(decimal quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than zero.");
        }

        Quantity = quantity;
        Updated = DateTime.UtcNow;
    }
}
