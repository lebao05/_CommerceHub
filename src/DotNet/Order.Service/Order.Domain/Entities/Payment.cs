using BuildingBlocks.Core.Domain;
using Order.Domain.Enums;

namespace Order.Domain.Entities;

/// <summary>
/// One payment per order (order-service-database.md §3.4). If a payment fails
/// and a new one is taken, the old row is marked void and a new row is
/// created so payment history is preserved.
/// </summary>
public class Payment : EntityBase
{
    public Guid OrderId { get; private set; }
    public PaymentProvider Provider { get; private set; }
    public PaymentStatus Status { get; private set; }
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = default!;
    public string? ProviderChargeId { get; private set; }
    public string? IdempotencyKey { get; private set; }
    public DateTime? AuthorizedAt { get; private set; }
    public DateTime? CapturedAt { get; private set; }
    public DateTime? FailedAt { get; private set; }
    public string? FailureReason { get; private set; }

    private Payment() { }

    public static Payment Create(
        Guid orderId,
        PaymentProvider provider,
        decimal amount,
        string currency,
        string? idempotencyKey = null)
    {
        var payment = new Payment
        {
            OrderId = orderId,
            Provider = provider,
            Status = PaymentStatus.Pending,
            Amount = amount,
            Currency = currency,
            IdempotencyKey = idempotencyKey
        };
        payment.Updated = DateTime.UtcNow;
        return payment;
    }

    public void MarkAuthorized(string? providerChargeId = null)
    {
        EnsureTransition(PaymentStatus.Authorized);
        Status = PaymentStatus.Authorized;
        ProviderChargeId = providerChargeId ?? ProviderChargeId;
        AuthorizedAt = DateTime.UtcNow;
        Updated = DateTime.UtcNow;
    }

    public void MarkCaptured()
    {
        EnsureTransition(PaymentStatus.Captured);
        Status = PaymentStatus.Captured;
        CapturedAt = DateTime.UtcNow;
        Updated = DateTime.UtcNow;
    }

    public void MarkFailed(string? failureReason = null)
    {
        EnsureTransition(PaymentStatus.Failed);
        Status = PaymentStatus.Failed;
        FailedAt = DateTime.UtcNow;
        FailureReason = failureReason;
        Updated = DateTime.UtcNow;
    }

    public void MarkVoid()
    {
        EnsureTransition(PaymentStatus.Void);
        Status = PaymentStatus.Void;
        Updated = DateTime.UtcNow;
    }

    public void MarkRefunded()
    {
        EnsureTransition(PaymentStatus.Refunded);
        Status = PaymentStatus.Refunded;
        Updated = DateTime.UtcNow;
    }

    private void EnsureTransition(PaymentStatus to)
    {
        // §4.2 diagram: pending->authorized, pending->failed, authorized->captured,
        // authorized->void, captured->refunded; plus §3.4 prose
        // ("if a payment fails and a new one is taken, the old row is marked void").
        var allowed = (Status, to) switch
        {
            (PaymentStatus.Pending, PaymentStatus.Authorized) => true,
            (PaymentStatus.Pending, PaymentStatus.Failed) => true,
            (PaymentStatus.Authorized, PaymentStatus.Captured) => true,
            (PaymentStatus.Authorized, PaymentStatus.Void) => true,
            (PaymentStatus.Captured, PaymentStatus.Refunded) => true,
            (PaymentStatus.Failed, PaymentStatus.Void) => true,
            _ => false
        };

        if (!allowed)
        {
            throw new InvalidOperationException(
                $"Payment status transition from {Status} to {to} is not allowed.");
        }
    }
}
