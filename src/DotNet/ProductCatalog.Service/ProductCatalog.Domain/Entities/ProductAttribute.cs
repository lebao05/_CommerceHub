using BuildingBlocks.Core.Domain;

namespace ProductCatalog.Domain.Entities;

public class ProductAttribute : Entity
{
    public Guid ProductId { get; private set; }
    public Guid AttributeId { get; private set; }
    public Guid? AttributeValueId { get; private set; }
    public string? ValueText { get; private set; }
    public decimal? ValueNumber { get; private set; }
    public bool? ValueBoolean { get; private set; }
    public DateTime? ValueDate { get; private set; }

    // Navigation properties
    public Product Product { get; private set; } = null!;
    public Attribute Attribute { get; private set; } = null!;
    public AttributeValue? AttributeValue { get; private set; }

    private ProductAttribute() { } // EF Core

    public ProductAttribute(
        Guid productId,
        Guid attributeId,
        Guid? attributeValueId = null,
        string? valueText = null,
        decimal? valueNumber = null,
        bool? valueBoolean = null,
        DateTime? valueDate = null)
    {
        Id = Guid.NewGuid();
        ProductId = productId;
        AttributeId = attributeId;
        AttributeValueId = attributeValueId;
        ValueText = valueText;
        ValueNumber = valueNumber;
        ValueBoolean = valueBoolean;
        ValueDate = valueDate;
        CreatedAt = DateTime.UtcNow;
    }

    public void UpdateValue(
        Guid? attributeValueId = null,
        string? valueText = null,
        decimal? valueNumber = null,
        bool? valueBoolean = null,
        DateTime? valueDate = null)
    {
        AttributeValueId = attributeValueId;
        ValueText = valueText;
        ValueNumber = valueNumber;
        ValueBoolean = valueBoolean;
        ValueDate = valueDate;
    }
}
