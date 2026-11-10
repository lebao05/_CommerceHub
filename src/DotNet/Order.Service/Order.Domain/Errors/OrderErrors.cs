using BuildingBlocks.Core.Domain.Shared;

namespace Order.Domain.Errors;

/// <summary>
/// The set of failures an Order operation can report. Each is a single shared
/// instance so that callers can compare with == and tests can assert on a
/// specific error. Messages are fixed text with no interpolated values.
/// </summary>
public static class OrderErrors
{
    public static readonly Error NotFound =
        new("Order.NotFound", "The requested order was not found.");

    public static readonly Error EmptyOrder =
        new("Order.EmptyOrder", "An order must contain at least one item.");

    public static readonly Error InvalidStatusTransition =
        new("Order.InvalidStatusTransition", "The requested order status transition is not allowed.");

    public static readonly Error InvalidTotals =
        new("Order.InvalidTotals", "Order totals are inconsistent.");

    public static readonly Error AlreadyCancelled =
        new("Order.AlreadyCancelled", "The order has already been cancelled.");

    public static readonly Error DuplicateOrderNumber =
        new("Order.DuplicateOrderNumber", "An order with the same order number already exists.");

    public static readonly Error DuplicateIdempotencyKey =
        new("Order.DuplicateIdempotencyKey", "An order with the same idempotency key already exists.");

    public static readonly Error PaymentNotFound =
        new("Order.PaymentNotFound", "The order payment was not found.");

    public static readonly Error InvalidPaymentTransition =
        new("Order.InvalidPaymentTransition", "The requested payment status transition is not allowed.");
}
