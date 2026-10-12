using BuildingBlocks.Core.Domain;
using ProductCatalog.Domain.Enums;

namespace ProductCatalog.Domain.Entities;

public class Product : EntityRootBase
{
    public string Name { get; private set; }
    public string Slug { get; private set; }
    public string? Description { get; private set; }
    public Guid CategoryId { get; private set; }
    public ProductStatus Status { get; private set; }
    public bool IsFeatured { get; private set; }
    public decimal Rating { get; private set; }
    public int ReviewCount { get; private set; }

    private readonly List<ProductOption> _options = new();
    public IReadOnlyCollection<ProductOption> Options => _options.AsReadOnly();

    private readonly List<ProductVariant> _variants = new();
    public IReadOnlyCollection<ProductVariant> Variants => _variants.AsReadOnly();

    private Product() { }

    public static Product Create(
        string name,
        string slug,
        Guid categoryId,
        string? description = null)
    {
        var product = new Product
        {
            Name = name,
            Slug = slug,
            CategoryId = categoryId,
            Description = description,
            Status = ProductStatus.Draft,
            IsFeatured = false,
            Rating = 0,
            ReviewCount = 0
        };
        return product;
    }

    public void UpdateBasicInfo(string name, string slug, string? description)
    {
        Name = name;
        Slug = slug;
        Description = description;
        Updated = DateTime.UtcNow;
    }

    public void UpdateCategory(Guid categoryId)
    {
        CategoryId = categoryId;
        Updated = DateTime.UtcNow;
    }

    public void SetStatus(ProductStatus status)
    {
        Status = status;
        Updated = DateTime.UtcNow;
    }

    public void SetFeatured(bool isFeatured)
    {
        IsFeatured = isFeatured;
        Updated = DateTime.UtcNow;
    }

    public void UpdateRating(decimal rating, int reviewCount)
    {
        Rating = rating;
        ReviewCount = reviewCount;
        Updated = DateTime.UtcNow;
    }

    public ProductOption AddOption(string name)
    {
        var option = ProductOption.Create(Id, name);
        _options.Add(option);
        Updated = DateTime.UtcNow;
        return option;
    }

    public void RemoveOption(Guid optionId)
    {
        var option = _options.FirstOrDefault(o => o.Id == optionId);
        if (option != null)
        {
            _options.Remove(option);
            Updated = DateTime.UtcNow;
        }
    }

    public ProductVariant AddVariant(
        decimal price,
        decimal? compareAtPrice = null,
        bool isActive = true,
        int displayOrder = 0)
    {
        var variant = ProductVariant.Create(
            Id,
            price,
            compareAtPrice,
            isActive,
            displayOrder);
        _variants.Add(variant);
        Updated = DateTime.UtcNow;
        return variant;
    }

    public void RemoveVariant(Guid variantId)
    {
        var variant = _variants.FirstOrDefault(v => v.Id == variantId);
        if (variant != null)
        {
            _variants.Remove(variant);
            Updated = DateTime.UtcNow;
        }
    }
}
