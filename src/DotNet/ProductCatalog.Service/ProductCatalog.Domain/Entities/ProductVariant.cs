using BuildingBlocks.Core.Domain;

namespace ProductCatalog.Domain.Entities;

public class ProductVariant : EntityBase
{
    public Guid ProductId { get; private set; }
    public decimal Price { get; private set; }
    public decimal? CompareAtPrice { get; private set; }
    public bool IsActive { get; private set; }
    public int DisplayOrder { get; private set; }

    private readonly List<ProductVariantOption> _options = new();
    public IReadOnlyCollection<ProductVariantOption> Options => _options.AsReadOnly();

    private ProductVariant() { }

    public static ProductVariant Create(
        Guid productId,
        decimal price,
        decimal? compareAtPrice = null,
        bool isActive = true,
        int displayOrder = 0)
    {
        var variant = new ProductVariant
        {
            ProductId = productId,
            Price = price,
            CompareAtPrice = compareAtPrice,
            IsActive = isActive,
            DisplayOrder = displayOrder
        };
        variant.Updated = DateTime.UtcNow;
        return variant;
    }

    public void UpdatePrice(decimal price, decimal? compareAtPrice = null)
    {
        Price = price;
        CompareAtPrice = compareAtPrice;
        Updated = DateTime.UtcNow;
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
        Updated = DateTime.UtcNow;
    }

    public void UpdateDisplayOrder(int displayOrder)
    {
        DisplayOrder = displayOrder;
        Updated = DateTime.UtcNow;
    }

    public void AddOption(Guid optionValueId)
    {
        if (!_options.Any(o => o.OptionValueId == optionValueId))
        {
            _options.Add(new ProductVariantOption(Id, optionValueId));
            Updated = DateTime.UtcNow;
        }
    }

    public void RemoveOption(Guid optionValueId)
    {
        var option = _options.FirstOrDefault(o => o.OptionValueId == optionValueId);
        if (option != null)
        {
            _options.Remove(option);
            Updated = DateTime.UtcNow;
        }
    }

    public void ClearOptions()
    {
        _options.Clear();
        Updated = DateTime.UtcNow;
    }
}
