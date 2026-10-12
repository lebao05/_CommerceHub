using BuildingBlocks.Core.Domain;

namespace ProductCatalog.Domain.Entities;

public class Category : EntityRootBase
{
    public Guid? ParentId { get; private set; }
    public string Name { get; private set; }
    public string? Description { get; private set; }
    public bool IsActive { get; private set; }

    private Category() { }

    public static Category Create(
        string name,
        Guid? parentId = null,
        string? description = null,
        bool isActive = true)
    {
        var category = new Category
        {
            Name = name,
            ParentId = parentId,
            Description = description,
            IsActive = isActive
        };
        category.Updated = DateTime.UtcNow;
        return category;
    }

    public void UpdateBasicInfo(string name, string? description)
    {
        Name = name;
        Description = description;
        Updated = DateTime.UtcNow;
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
        Updated = DateTime.UtcNow;
    }

    public void MoveToParent(Guid? parentId)
    {
        ParentId = parentId;
        Updated = DateTime.UtcNow;
    }
}
