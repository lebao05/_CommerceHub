using BuildingBlocks.Core.Domain;

namespace Order.Domain.Entities;

/// <summary>
/// One line on an order (§3.2). Contains exactly the columns listed in the
/// order_items table: order/product/variant ids, product_name snapshot,
/// quantity, unit_price, line_discount, line_total, reservation_id.
/// </summary>
public class OrderItem : EntityBase
{
    public Guid OrderId { get; private set; }
    public Guid ProductId { get; private set; }
    public Guid VariantId { get; private set; }
    public string ProductName { get; private set; } = default!;
    public decimal Quantity { get; private set; }
    public decimal UnitPrice { get; private set; }
    public decimal LineDiscount { get; private set; }
    public decimal LineTotal { get; private set; }
    public Guid? ReservationId { get; private set; }

    private OrderItem() { }

    public static OrderItem Create(
        Guid orderId,
        Guid productId,
        Guid variantId,
        string productName,
        decimal quantity,
        decimal unitPrice,
        decimal lineDiscount = 0)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than zero.");
        }

        if (lineDiscount > 0)
        {
            throw new ArgumentOutOfRangeException(nameof(lineDiscount), "Line discount must be zero or negative.");
        }

        var item = new OrderItem
        {
            OrderId = orderId,
            ProductId = productId,
            VariantId = variantId,
            ProductName = productName,
            Quantity = quantity,
            UnitPrice = unitPrice,
            LineDiscount = lineDiscount
        };
        item.RecalculateLineTotal();
        item.Updated = DateTime.UtcNow;
        return item;
    }

    public void UpdateQuantity(decimal quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than zero.");
        }

        Quantity = quantity;
        RecalculateLineTotal();
        Updated = DateTime.UtcNow;
    }

    public void ApplyLineDiscount(decimal lineDiscount)
    {
        if (lineDiscount > 0)
        {
            throw new ArgumentOutOfRangeException(nameof(lineDiscount), "Line discount must be zero or negative.");
        }

        LineDiscount = lineDiscount;
        RecalculateLineTotal();
        Updated = DateTime.UtcNow;
    }

    public void UpdateUnitPrice(decimal unitPrice)
    {
        UnitPrice = unitPrice;
        RecalculateLineTotal();
        Updated = DateTime.UtcNow;
    }

    public void LinkReservation(Guid reservationId)
    {
        ReservationId = reservationId;
        Updated = DateTime.UtcNow;
    }

    private void RecalculateLineTotal()
    {
        LineTotal = UnitPrice * Quantity + LineDiscount;
    }
}
