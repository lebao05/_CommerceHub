using BuildingBlocks.Core.Domain;

namespace ProductCatalog.Domain.Entities;

public class VariantAttribute : Entity
{
    public Guid VariantId { get; private set; }
    public Guid AttributeId { get; private set; }
    public Guid AttributeValueId { get; private set; }

    // Navigation properties
    public ProductVariant Variant { get; private set; } = null!;
    public Attribute Attribute { get; private set; } = null!;
    public AttributeValue AttributeValue { get; private set; } = null!;

    private VariantAttribute() { } // EF Core

    public VariantAttribute(
        Guid variantId,
        Guid attributeId,
        Guid attributeValueId)
    {
        Id = Guid.NewGuid();
        VariantId = variantId;
        AttributeId = attributeId;
        AttributeValueId = attributeValueId;
        CreatedAt = DateTime.UtcNow;
    }

    public void UpdateValue(Guid attributeValueId)
    {
        AttributeValueId = attributeValueId;
    }
}
