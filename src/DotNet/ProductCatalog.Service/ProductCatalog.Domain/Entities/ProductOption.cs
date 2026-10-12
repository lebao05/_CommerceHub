using BuildingBlocks.Core.Domain;

namespace ProductCatalog.Domain.Entities;

public class ProductOption : EntityBase
{
    public Guid ProductId { get; private set; }
    public string Name { get; private set; }

    private readonly List<ProductOptionValue> _values = new();
    public IReadOnlyCollection<ProductOptionValue> Values => _values.AsReadOnly();

    private ProductOption() { }

    public static ProductOption Create(
        Guid productId,
        string name)
    {
        var option = new ProductOption
        {
            ProductId = productId,
            Name = name
        };
        return option;
    }

    public void UpdateName(string name)
    {
        Name = name;
    }

    public ProductOptionValue AddValue(string value)
    {
        var optionValue = ProductOptionValue.Create(Id, value);
        _values.Add(optionValue);
        return optionValue;
    }

    public void RemoveValue(Guid valueId)
    {
        var value = _values.FirstOrDefault(v => v.Id == valueId);
        if (value != null)
        {
            _values.Remove(value);
        }
    }
}
