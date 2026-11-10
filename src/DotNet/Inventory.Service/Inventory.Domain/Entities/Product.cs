using BuildingBlocks.Core.Domain;

namespace Inventory.Domain.Entities;

/// <summary>
/// Catalog projection for pick-list headers and warehouse documents
/// (inventory-service-database.md §3.1 products).
/// Contains exactly the columns listed in the products table.
/// </summary>
public class Product : EntityRootBase
{
    public string Name { get; private set; } = default!;
    public bool IsActive { get; private set; }
    public DateTime LastSyncedAt { get; private set; }

    private Product() { }

    public static Product Create(
        Guid id,
        string name,
        bool isActive,
        DateTime lastSyncedAt)
    {
        var product = new Product
        {
            Name = name,
            IsActive = isActive,
            LastSyncedAt = lastSyncedAt
        };
        // Id mirrors the catalog id (§3.1).
        product.Id = id;
        return product;
    }

    public void ApplySync(string name, bool isActive, DateTime lastSyncedAt)
    {
        Name = name;
        IsActive = isActive;
        LastSyncedAt = lastSyncedAt;
        Updated = DateTime.UtcNow;
    }
}
