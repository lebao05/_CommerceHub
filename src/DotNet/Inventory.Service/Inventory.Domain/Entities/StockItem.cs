using BuildingBlocks.Core.Domain;

namespace Inventory.Domain.Entities;

/// <summary>
/// Current materialised balance per variant (§3.2).
/// Contains exactly the columns listed in the stock_items table.
/// </summary>
public class StockItem : EntityRootBase
{
    public Guid ProductId { get; private set; }
    public Guid VariantId { get; private set; }
    public decimal? StockQuantity { get; private set; }
    public string UpdatedBy { get; private set; } = default!;

    private StockItem() { }

    public static StockItem Create(
        Guid productId,
        Guid variantId,
        decimal? stockQuantity,
        string updatedBy)
    {
        return new StockItem
        {
            ProductId = productId,
            VariantId = variantId,
            StockQuantity = stockQuantity,
            UpdatedBy = updatedBy
        };
    }

    public void UpdateStockQuantity(decimal? stockQuantity, string updatedBy)
    {
        StockQuantity = stockQuantity;
        UpdatedBy = updatedBy;
        Updated = DateTime.UtcNow;
    }

    public void Touch(string updatedBy)
    {
        UpdatedBy = updatedBy;
        Updated = DateTime.UtcNow;
    }
}
