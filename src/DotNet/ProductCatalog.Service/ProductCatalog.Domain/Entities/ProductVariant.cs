using BuildingBlocks.Core.Domain;

namespace ProductCatalog.Domain.Entities;

public class ProductVariant : Entity
{
    public Guid ProductId { get; private set; }
    public string Sku { get; private set; } = string.Empty;
    public string? Name { get; private set; }
    public decimal? Price { get; private set; }
    public decimal? CompareAtPrice { get; private set; }
    public decimal? CostPrice { get; private set; }
    public decimal? Weight { get; private set; }
    public string? Barcode { get; private set; }
    public bool IsActive { get; private set; }
    public string? ImageUrl { get; private set; }
    public int DisplayOrder { get; private set; }

    // Navigation properties
    public Product Product { get; private set; } = null!;
    private readonly List<VariantAttribute> _attributes = new();
    public IReadOnlyCollection<VariantAttribute> Attributes => _attributes.AsReadOnly();

    private ProductVariant() { } // EF Core

    public ProductVariant(
        Guid productId,
        string sku,
        string? name = null,
        decimal? price = null)
    {
        Id = Guid.NewGuid();
        ProductId = productId;
        Sku = sku;
        Name = name;
        Price = price;
        IsActive = true;
        DisplayOrder = 0;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Update(string sku, string? name, decimal? price, decimal? compareAtPrice, decimal? costPrice)
    {
        Sku = sku;
        Name = name;
        Price = price;
        CompareAtPrice = compareAtPrice;
        CostPrice = costPrice;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetWeight(decimal? weight)
    {
        Weight = weight;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetBarcode(string? barcode)
    {
        Barcode = barcode;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetImage(string? imageUrl)
    {
        ImageUrl = imageUrl;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetDisplayOrder(int order)
    {
        DisplayOrder = order;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AddAttribute(VariantAttribute attribute)
    {
        _attributes.Add(attribute);
        UpdatedAt = DateTime.UtcNow;
    }
}
