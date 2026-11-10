using BuildingBlocks.Core.Domain;
using Order.Domain.Enums;
using Order.Domain.ValueObjects;

namespace Order.Domain.Entities;

/// <summary>
/// Aggregate root. One commercial transaction: one customer, one cart,
/// one or more shipments, one payment (order-service-database.md §3.1).
/// </summary>
public class Order : EntityRootBase
{
    public Guid CustomerId { get; private set; }
    public string CustomerEmail { get; private set; } = default!;
    public string? CustomerPhone { get; private set; }
    public OrderStatus OrderStatus { get; private set; }
    public decimal Subtotal { get; private set; }
    public decimal DiscountTotal { get; private set; }
    public decimal TaxTotal { get; private set; }
    public decimal ShippingFee { get; private set; }
    public decimal GrandTotal { get; private set; }
    public string? IdempotencyKey { get; private set; }
    public DateTime PlacedAt { get; private set; }
    public DateTime? ConfirmedAt { get; private set; }
    public DateTime? ShippedAt { get; private set; }
    public DateTime? DeliveredAt { get; private set; }
    public DateTime? CancelledAt { get; private set; }
    public string? CancelReason { get; private set; }
    public Address ShippingAddress { get; private set; } = default!;
    public Address BillingAddress { get; private set; } = default!;
    public string? Notes { get; private set; }
    public OrderChannel Channel { get; private set; }
    public uint Xmin { get; private set; }

    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    private readonly List<Shipment> _shipments = new();
    public IReadOnlyCollection<Shipment> Shipments => _shipments.AsReadOnly();

    public Payment? Payment { get; private set; }

    private Order() { }

    public static Order Create(
        Guid customerId,
        string customerEmail,
        Address shippingAddress,
        Address billingAddress,
        OrderChannel channel,
        string? customerPhone = null,
        string? idempotencyKey = null,
        string? notes = null,
        decimal taxTotal = 0,
        decimal shippingFee = 0)
    {
        var order = new Order
        {
            CustomerId = customerId,
            CustomerEmail = customerEmail,
            CustomerPhone = customerPhone,
            OrderStatus = OrderStatus.Pending,
            Subtotal = 0,
            DiscountTotal = 0,
            TaxTotal = taxTotal,
            ShippingFee = shippingFee,
            GrandTotal = taxTotal + shippingFee,
            IdempotencyKey = idempotencyKey,
            PlacedAt = DateTime.UtcNow,
            ShippingAddress = shippingAddress,
            BillingAddress = billingAddress,
            Notes = notes,
            Channel = channel
        };
        order.Updated = DateTime.UtcNow;
        return order;
    }

    public OrderItem AddItem(
        Guid productId,
        Guid variantId,
        string productName,
        decimal quantity,
        decimal unitPrice,
        decimal lineDiscount = 0)
    {
        var item = OrderItem.Create(
            Id,
            productId,
            variantId,
            productName,
            quantity,
            unitPrice,
            lineDiscount);
        _items.Add(item);
        RecalculateTotals();
        Updated = DateTime.UtcNow;
        return item;
    }

    public void RemoveItem(Guid orderItemId)
    {
        var item = _items.FirstOrDefault(i => i.Id == orderItemId);
        if (item != null)
        {
            _items.Remove(item);
            RecalculateTotals();
            Updated = DateTime.UtcNow;
        }
    }

    public void SetPayment(Payment payment)
    {
        Payment = payment;
        Updated = DateTime.UtcNow;
    }

    public Shipment AddShipment(decimal shippingFee, string? carrier = null)
    {
        var shipment = Shipment.Create(Id, shippingFee, carrier);
        _shipments.Add(shipment);
        Updated = DateTime.UtcNow;
        return shipment;
    }

    public void MarkConfirmed()
    {
        EnsureTransition(OrderStatus.Confirmed);
        OrderStatus = OrderStatus.Confirmed;
        ConfirmedAt = DateTime.UtcNow;
        Updated = DateTime.UtcNow;
    }

    public void MarkFailed()
    {
        EnsureTransition(OrderStatus.Failed);
        OrderStatus = OrderStatus.Failed;
        Updated = DateTime.UtcNow;
    }

    public void MarkPartiallyShipped()
    {
        EnsureTransition(OrderStatus.PartiallyShipped);
        OrderStatus = OrderStatus.PartiallyShipped;
        Updated = DateTime.UtcNow;
    }

    public void MarkShipped()
    {
        EnsureTransition(OrderStatus.Shipped);
        OrderStatus = OrderStatus.Shipped;
        ShippedAt = DateTime.UtcNow;
        Updated = DateTime.UtcNow;
    }

    public void MarkDelivered()
    {
        EnsureTransition(OrderStatus.Delivered);
        OrderStatus = OrderStatus.Delivered;
        DeliveredAt = DateTime.UtcNow;
        Updated = DateTime.UtcNow;
    }

    public void MarkCompleted()
    {
        EnsureTransition(OrderStatus.Completed);
        OrderStatus = OrderStatus.Completed;
        Updated = DateTime.UtcNow;
    }

    public void Cancel(string? reason = null)
    {
        EnsureTransition(OrderStatus.Cancelled);
        OrderStatus = OrderStatus.Cancelled;
        CancelledAt = DateTime.UtcNow;
        CancelReason = reason;
        Updated = DateTime.UtcNow;
    }

    private void EnsureTransition(OrderStatus to)
    {
        var allowed = (OrderStatus, to) switch
        {
            (OrderStatus.Pending, OrderStatus.Confirmed) => true,
            (OrderStatus.Pending, OrderStatus.Failed) => true,
            (OrderStatus.Pending, OrderStatus.Cancelled) => true,
            (OrderStatus.Confirmed, OrderStatus.PartiallyShipped) => true,
            (OrderStatus.Confirmed, OrderStatus.Shipped) => true,
            (OrderStatus.Confirmed, OrderStatus.Cancelled) => true,
            (OrderStatus.PartiallyShipped, OrderStatus.Shipped) => true,
            (OrderStatus.Shipped, OrderStatus.Delivered) => true,
            (OrderStatus.Delivered, OrderStatus.Completed) => true,
            _ => false
        };

        if (!allowed)
        {
            throw new InvalidOperationException(
                $"Order status transition from {OrderStatus} to {to} is not allowed.");
        }
    }

    private void RecalculateTotals()
    {
        Subtotal = _items.Sum(i => i.UnitPrice * i.Quantity);
        DiscountTotal = _items.Sum(i => i.LineDiscount);
        GrandTotal = Subtotal + DiscountTotal + TaxTotal + ShippingFee;
    }

    public void UpdateTotals(decimal taxTotal, decimal shippingFee)
    {
        TaxTotal = taxTotal;
        ShippingFee = shippingFee;
        RecalculateTotals();
        Updated = DateTime.UtcNow;
    }

    public void UpdateNotes(string? notes)
    {
        Notes = notes;
        Updated = DateTime.UtcNow;
    }
}
