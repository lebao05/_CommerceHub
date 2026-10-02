using BuildingBlocks.Core.Domain;

namespace ProductCatalog.Domain.Entities;

public class Attribute : Entity
{
    public string Name { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public AttributeType Type { get; private set; }
    public bool IsFilterable { get; private set; }
    public bool IsSearchable { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsRequired { get; private set; }
    public bool IsActive { get; private set; }

    // Navigation properties
    private readonly List<AttributeValue> _values = new();
    public IReadOnlyCollection<AttributeValue> Values => _values.AsReadOnly();

    private Attribute() { } // EF Core

    public Attribute(
        string name,
        string code,
        AttributeType type,
        string? description = null)
    {
        Id = Guid.NewGuid();
        Name = name;
        Code = code;
        Type = type;
        Description = description;
        IsFilterable = true;
        IsSearchable = false;
        IsRequired = false;
        IsActive = true;
        DisplayOrder = 0;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Update(string name, string code, string? description)
    {
        Name = name;
        Code = code;
        Description = description;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetFilterable(bool isFilterable)
    {
        IsFilterable = isFilterable;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetSearchable(bool isSearchable)
    {
        IsSearchable = isSearchable;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetRequired(bool isRequired)
    {
        IsRequired = isRequired;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetDisplayOrder(int order)
    {
        DisplayOrder = order;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AddValue(AttributeValue value)
    {
        _values.Add(value);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemoveValue(Guid valueId)
    {
        var value = _values.FirstOrDefault(v => v.Id == valueId);
        if (value != null)
        {
            _values.Remove(value);
            UpdatedAt = DateTime.UtcNow;
        }
    }
}

public enum AttributeType
{
    Text,
    Select,
    MultiSelect,
    Boolean,
    Number,
    Date
}
