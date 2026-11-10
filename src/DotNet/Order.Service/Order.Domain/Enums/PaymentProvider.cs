namespace Order.Domain.Enums;

/// <summary>
/// Payment provider. Stored as varchar(32) in payments.provider.
/// </summary>
public enum PaymentProvider
{
    Stripe = 0,
    Vnpay = 1,
    Momo = 2,
    Cod = 3,
    BankTransfer = 4
}
