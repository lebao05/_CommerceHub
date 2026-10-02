using BuildingBlocks.Core.Domain;

namespace ProductCatalog.Domain.Entities;

public class ProductImage : Entity
{
    public Guid ProductId { get; private set; }
    public string Url { get; private set; } = string.Empty;
    public string? ThumbnailUrl { get; private set; }
    public string? AltText { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsPrimary { get; private set; }
    public int? Width { get; private set; }
    public int? Height { get; private set; }
    public int? FileSize { get; private set; }

    // Navigation properties
    public Product Product { get; private set; } = null!;

    private ProductImage() { } // EF Core

    public ProductImage(
        Guid productId,
        string url,
        string? thumbnailUrl = null,
        string? altText = null,
        bool isPrimary = false)
    {
        Id = Guid.NewGuid();
        ProductId = productId;
        Url = url;
        ThumbnailUrl = thumbnailUrl;
        AltText = altText;
        IsPrimary = isPrimary;
        DisplayOrder = 0;
        CreatedAt = DateTime.UtcNow;
    }

    public void Update(string url, string? thumbnailUrl, string? altText)
    {
        Url = url;
        ThumbnailUrl = thumbnailUrl;
        AltText = altText;
    }

    public void SetDimensions(int width, int height, int fileSize)
    {
        Width = width;
        Height = height;
        FileSize = fileSize;
    }

    public void SetDisplayOrder(int order)
    {
        DisplayOrder = order;
    }

    public void SetAsPrimary()
    {
        IsPrimary = true;
    }

    public void UnsetAsPrimary()
    {
        IsPrimary = false;
    }
}
