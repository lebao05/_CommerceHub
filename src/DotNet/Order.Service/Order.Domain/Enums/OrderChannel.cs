namespace Order.Domain.Enums;

/// <summary>
/// How the order was placed. Stored as varchar(16) in orders.channel.
/// </summary>
public enum OrderChannel
{
    Web = 0,
    Admin = 1,
    Api = 2
}
