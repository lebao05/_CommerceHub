using BuildingBlocks.Core.Domain;

namespace ProductCatalog.Domain.Entities;

public class Product : Entity
{
    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string Sku { get; private set; } = string.Empty;
    public string? ShortDescription { get; private set; }
    public string? Description { get; private set; }
    public decimal Price { get; private set; }
    public decimal? CompareAtPrice { get; private set; }
    public decimal? CostPrice { get; private set; }
    public Guid CategoryId { get; private set; }
    public Guid? BrandId { get; private set; }
    public ProductType Type { get; private set; }
    public ProductStatus Status { get; private set; }
    public bool IsFeatured { get; private set; }
    public bool IsNew { get; private set; }
    public decimal? Weight { get; private set; }
    public string? Dimensions { get; private set; }
    public string? Material { get; private set; }
    public string? Barcode { get; private set; }
    public int ViewCount { get; private set; }
    public decimal Rating { get; private set; }
    public int ReviewCount { get; private set; }
    public DateTime? PublishedAt { get; private set; }
    public string? MetaTitle { get; private set; }
    public string? MetaDescription { get; private set; }
    public string? MetaKeywords { get; private set; }
    public string? CreatedBy { get; private set; }
    public string? UpdatedBy { get; private set; }

    // Navigation properties
    public Category Category { get; private set; } = null!;
    public Brand? Brand { get; private set; }
    private readonly List<ProductImage> _images = new();
    public IReadOnlyCollection<ProductImage> Images => _images.AsReadOnly();
    private readonly List<ProductVariant> _variants = new();
    public IReadOnlyCollection<ProductVariant> Variants => _variants.AsReadOnly();
    private readonly List<ProductAttribute> _attributes = new();
    public IReadOnlyCollection<ProductAttribute> Attributes => _attributes.AsReadOnly();
    private readonly List<ProductTag> _productTags = new();
    public IReadOnlyCollection<ProductTag> ProductTags => _productTags.AsReadOnly();

    private Product() { } // EF Core

    public Product(
        string name,
        string slug,
        string sku,
        Guid categoryId,
        decimal price,
        ProductType type = ProductType.Simple,
        string? createdBy = null)
    {
        Id = Guid.NewGuid();
        Name = name;
        Slug = slug;
        Sku = sku;
        CategoryId = categoryId;
        Price = price;
        Type = type;
        Status = ProductStatus.Draft;
        IsFeatured = false;
        IsNew = false;
        ViewCount = 0;
        Rating = 0;
        ReviewCount = 0;
        CreatedBy = createdBy;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Update(
        string name,
        string slug,
        string sku,
        string? shortDescription,
        string? description,
        decimal price,
        decimal? compareAtPrice,
        decimal? costPrice,
        Guid categoryId,
        Guid? brandId,
        string? updatedBy = null)
    {
        Name = name;
        Slug = slug;
        Sku = sku;
        ShortDescription = shortDescription;
        Description = description;
        Price = price;
        CompareAtPrice = compareAtPrice;
        CostPrice = costPrice;
        CategoryId = categoryId;
        BrandId = brandId;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetStatus(ProductStatus status, string? updatedBy = null)
    {
        Status = status;
        if (status == ProductStatus.Published && !PublishedAt.HasValue)
        {
            PublishedAt = DateTime.UtcNow;
        }
        UpdatedBy = updatedBy;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Publish(string? updatedBy = null)
    {
        SetStatus(ProductStatus.Published, updatedBy);
    }

    public void Unpublish(string? updatedBy = null)
    {
        SetStatus(ProductStatus.Draft, updatedBy);
    }

    public void SetFeatured(bool isFeatured, string? updatedBy = null)
    {
        IsFeatured = isFeatured;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetNew(bool isNew, string? updatedBy = null)
    {
        IsNew = isNew;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetPhysicalDetails(decimal? weight, string? dimensions, string? material, string? updatedBy = null)
    {
        Weight = weight;
        Dimensions = dimensions;
        Material = material;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetBarcode(string? barcode, string? updatedBy = null)
    {
        Barcode = barcode;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTime.UtcNow;
    }

    public void IncrementViewCount()
    {
        ViewCount++;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateRating(decimal rating, int reviewCount)
    {
        Rating = rating;
        ReviewCount = reviewCount;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateSeo(string? metaTitle, string? metaDescription, string? metaKeywords, string? updatedBy = null)
    {
        MetaTitle = metaTitle;
        MetaDescription = metaDescription;
        MetaKeywords = metaKeywords;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AddImage(ProductImage image)
    {
        if (!_images.Any() || image.IsPrimary)
        {
            foreach (var img in _images)
            {
                img.UnsetAsPrimary();
            }
            image.SetAsPrimary();
        }
        _images.Add(image);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemoveImage(Guid imageId)
    {
        var image = _images.FirstOrDefault(i => i.Id == imageId);
        if (image != null)
        {
            var wasPrimary = image.IsPrimary;
            _images.Remove(image);
            
            if (wasPrimary && _images.Any())
            {
                _images.OrderBy(i => i.DisplayOrder).First().SetAsPrimary();
            }
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void AddVariant(ProductVariant variant)
    {
        _variants.Add(variant);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemoveVariant(Guid variantId)
    {
        var variant = _variants.FirstOrDefault(v => v.Id == variantId);
        if (variant != null)
        {
            _variants.Remove(variant);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void AddAttribute(ProductAttribute attribute)
    {
        _attributes.Add(attribute);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemoveAttribute(Guid attributeId)
    {
        var attribute = _attributes.FirstOrDefault(a => a.AttributeId == attributeId);
        if (attribute != null)
        {
            _attributes.Remove(attribute);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void AddTag(Guid tagId)
    {
        if (!_productTags.Any(pt => pt.TagId == tagId))
        {
            _productTags.Add(new ProductTag(Id, tagId));
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void RemoveTag(Guid tagId)
    {
        var productTag = _productTags.FirstOrDefault(pt => pt.TagId == tagId);
        if (productTag != null)
        {
            _productTags.Remove(productTag);
            UpdatedAt = DateTime.UtcNow;
        }
    }
}

public enum ProductType
{
    Simple,
    Variant,
    Digital,
    Service
}

public enum ProductStatus
{
    Draft,
    Published,
    Archived,
    OutOfStock
}
