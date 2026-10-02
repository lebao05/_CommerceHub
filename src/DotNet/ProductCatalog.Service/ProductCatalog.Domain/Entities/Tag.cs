using BuildingBlocks.Core.Domain;

namespace ProductCatalog.Domain.Entities;

public class Tag : Entity
{
    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? Color { get; private set; }
    public bool IsActive { get; private set; }
    public int UsageCount { get; private set; }

    // Navigation properties
    private readonly List<ProductTag> _productTags = new();
    public IReadOnlyCollection<ProductTag> ProductTags => _productTags.AsReadOnly();

    private Tag() { } // EF Core

    public Tag(string name, string slug, string? description = null, string? color = null)
    {
        Id = Guid.NewGuid();
        Name = name;
        Slug = slug;
        Description = description;
        Color = color;
        IsActive = true;
        UsageCount = 0;
        CreatedAt = DateTime.UtcNow;
    }

    public void Update(string name, string slug, string? description, string? color)
    {
        Name = name;
        Slug = slug;
        Description = description;
        Color = color;
    }

    public void IncrementUsage()
    {
        UsageCount++;
    }

    public void DecrementUsage()
    {
        if (UsageCount > 0)
            UsageCount--;
    }

    public void Activate()
    {
        IsActive = true;
    }

    public void Deactivate()
    {
        IsActive = false;
    }
}

public class ProductTag
{
    public Guid ProductId { get; private set; }
    public Guid TagId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation properties
    public Product Product { get; private set; } = null!;
    public Tag Tag { get; private set; } = null!;

    private ProductTag() { } // EF Core

    public ProductTag(Guid productId, Guid tagId)
    {
        ProductId = productId;
        TagId = tagId;
        CreatedAt = DateTime.UtcNow;
    }
}
