using BuildingBlocks.Core.Domain;

namespace Order.Domain.ValueObjects;

/// <summary>
/// Full postal address embedded as jsonb on orders.shipping_address /
/// orders.billing_address (order-service-database.md §3.1). Mapped as an
/// EF Core owned type; never a separate table.
/// </summary>
public class Address : ValueObject
{
    public string RecipientName { get; private set; } = default!;
    public string? Phone { get; private set; }
    public string Street { get; private set; } = default!;
    public string? Ward { get; private set; }
    public string? District { get; private set; }
    public string City { get; private set; } = default!;
    public string? PostalCode { get; private set; }
    public string Country { get; private set; } = default!;

    private Address() { }

    public static Address Create(
        string recipientName,
        string street,
        string city,
        string country,
        string? phone = null,
        string? ward = null,
        string? district = null,
        string? postalCode = null)
    {
        return new Address
        {
            RecipientName = recipientName,
            Street = street,
            City = city,
            Country = country,
            Phone = phone,
            Ward = ward,
            District = district,
            PostalCode = postalCode
        };
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return RecipientName;
        yield return Phone ?? string.Empty;
        yield return Street;
        yield return Ward ?? string.Empty;
        yield return District ?? string.Empty;
        yield return City;
        yield return PostalCode ?? string.Empty;
        yield return Country;
    }
}
