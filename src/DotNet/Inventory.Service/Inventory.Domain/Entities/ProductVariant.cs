using BuildingBlocks.Core.Domain;

namespace Inventory.Domain.Entities;

/// <summary>
/// Catalog projection actually stocked and shipped
/// (inventory-service-database.md §3.1 product_variants).
/// Contains exactly the columns listed in the product_variants table.
/// </summary>
public class ProductVariant : EntityBase
{
    public Guid ProductId { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime LastSyncedAt { get; private set; }

    private ProductVariant() { }

    public static ProductVariant Create(
        Guid id,
        Guid productId,
        bool isActive,
        DateTime lastSyncedAt)
    {
        var variant = new ProductVariant
        {
            ProductId = productId,
            IsActive = isActive,
            LastSyncedAt = lastSyncedAt
        };
        // Id mirrors the catalog id (§3.1).
        variant.Id = id;
        return variant;
    }

    public void ApplySync(bool isActive, DateTime lastSyncedAt)
    {
        IsActive = isActive;
        LastSyncedAt = lastSyncedAt;
        Updated = DateTime.UtcNow;
    }
}
