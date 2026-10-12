using BuildingBlocks.Infrastructure.EfCore;

namespace ProductCatalog.Infrastructure.Persistence;

public class ProductCatalogDbContextFactory : DbContextDesignFactoryBase<ProductCatalogDbContext>
{
    public ProductCatalogDbContextFactory() : base("ProductCatalogDb")
    {
    }
}
