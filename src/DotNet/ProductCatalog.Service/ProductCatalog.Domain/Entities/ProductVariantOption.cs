namespace ProductCatalog.Domain.Entities;

public class ProductVariantOption
{
    public Guid VariantId { get; private set; }
    public Guid OptionValueId { get; private set; }

    private ProductVariantOption() { }

    public ProductVariantOption(Guid variantId, Guid optionValueId)
    {
        VariantId = variantId;
        OptionValueId = optionValueId;
    }
}
