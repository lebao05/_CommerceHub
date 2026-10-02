using BuildingBlocks.Core.Domain;

namespace ProductCatalog.Domain.Entities;

public class AttributeValue : Entity
{
    public Guid AttributeId { get; private set; }
    public string Value { get; private set; } = string.Empty;
    public string? Code { get; private set; }
    public string? ColorHex { get; private set; }
    public string? ImageUrl { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; }

    // Navigation properties
    public Attribute Attribute { get; private set; } = null!;

    private AttributeValue() { } // EF Core

    public AttributeValue(
        Guid attributeId,
        string value,
        string? code = null)
    {
        Id = Guid.NewGuid();
        AttributeId = attributeId;
        Value = value;
        Code = code;
        IsActive = true;
        DisplayOrder = 0;
        CreatedAt = DateTime.UtcNow;
    }

    public void Update(string value, string? code)
    {
        Value = value;
        Code = code;
    }

    public void SetColor(string colorHex)
    {
        ColorHex = colorHex;
    }

    public void SetImage(string imageUrl)
    {
        ImageUrl = imageUrl;
    }

    public void SetDisplayOrder(int order)
    {
        DisplayOrder = order;
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
