using BuildingBlocks.Core.Domain;

namespace ProductCatalog.Domain.Entities;

public class Category : Entity
{
    public Guid? ParentId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? ImageUrl { get; private set; }
    public string? Icon { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; }
    public int Level { get; private set; }
    public string Path { get; private set; } = string.Empty;
    public string? MetaTitle { get; private set; }
    public string? MetaDescription { get; private set; }
    public string? MetaKeywords { get; private set; }
    public string? CreatedBy { get; private set; }
    public string? UpdatedBy { get; private set; }

    // Navigation properties
    public Category? Parent { get; private set; }
    private readonly List<Category> _subcategories = new();
    public IReadOnlyCollection<Category> Subcategories => _subcategories.AsReadOnly();
    private readonly List<Product> _products = new();
    public IReadOnlyCollection<Product> Products => _products.AsReadOnly();

    private Category() { } // EF Core

    public Category(
        string name,
        string slug,
        Guid? parentId = null,
        string? description = null,
        string? createdBy = null)
    {
        Id = Guid.NewGuid();
        Name = name;
        Slug = slug;
        ParentId = parentId;
        Description = description;
        Level = parentId.HasValue ? 2 : 1;
        Path = $"/{slug}";
        IsActive = true;
        DisplayOrder = 0;
        CreatedBy = createdBy;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Update(string name, string slug, string? description, string? updatedBy = null)
    {
        Name = name;
        Slug = slug;
        Description = description;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetImage(string? imageUrl, string? icon = null, string? updatedBy = null)
    {
        ImageUrl = imageUrl;
        Icon = icon;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetDisplayOrder(int order, string? updatedBy = null)
    {
        DisplayOrder = order;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Activate(string? updatedBy = null)
    {
        IsActive = true;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate(string? updatedBy = null)
    {
        IsActive = false;
        UpdatedBy = updatedBy;
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

    public void UpdatePath(string parentPath)
    {
        Path = $"{parentPath}/{Slug}";
        UpdatedAt = DateTime.UtcNow;
    }
}
