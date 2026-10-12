using BuildingBlocks.Core.Domain;

namespace ProductCatalog.Domain.Entities;

public class ProductOptionValue : EntityBase
{
    public Guid ProductOptionId { get; private set; }
    public string Value { get; private set; }

    private ProductOptionValue() { }

    public static ProductOptionValue Create(
        Guid productOptionId,
        string value)
    {
        var optionValue = new ProductOptionValue
        {
            ProductOptionId = productOptionId,
            Value = value
        };
        return optionValue;
    }

    public void UpdateValue(string value)
    {
        Value = value;
    }
}
