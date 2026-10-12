# ProductCatalog EF Core Configuration

## Overview
EF Core configuration for ProductCatalog service using PostgreSQL database with repository pattern.

## Structure

### DbContext
- **ProductCatalogDbContext**: Main database context
  - Inherits from `AppDbContextBase` (BuildingBlocks)
  - Enables domain events through `IDomainEventContext`
  - Uses PostgreSQL UUID extension
  - Applies entity configurations from assembly

### Entity Configurations
Located in `Persistence/Configurations/`:

1. **CategoryConfiguration**
   - Table: `categories`
   - Self-referencing hierarchy via `ParentId`
   - Indexes: Name, ParentId, IsActive

2. **ProductConfiguration**
   - Table: `products`
   - Unique slug index
   - Status enum stored as string
   - Decimal precision for Rating (3,2)
   - Cascade delete for Options and Variants
   - Indexes: CategoryId, Status, IsFeatured, Slug

3. **ProductOptionConfiguration**
   - Table: `product_options`
   - Cascade delete for Values
   - Display order support

4. **ProductOptionValueConfiguration**
   - Table: `product_option_values`
   - Links to ProductOption

5. **ProductVariantConfiguration**
   - Table: `product_variants`
   - Unique SKU index
   - Decimal precision for prices (18,2)
   - Cascade delete for VariantOptions
   - Indexes: ProductId, IsActive, Sku

6. **ProductVariantOptionConfiguration**
   - Table: `product_variant_options`
   - Links variants to option values

### Repositories
Located in `Repositories/`:

- **ProductRepository**: Implements `IProductRepository`
- **CategoryRepository**: Implements `ICategoryRepository`

Both inherit from `RepositoryBase<ProductCatalogDbContext, TEntity>` providing:
- CRUD operations
- Specification pattern support
- Grid/pagination support
- Transaction support via `ITxRequest`

### Design-Time Factory
- **ProductCatalogDbContextFactory**: Used by EF Core tools
  - Reads connection string from `appsettings.json`
  - Connection name: `"ProductCatalogDb"`

## Features

### Domain Events
- Automatically collected from aggregate roots
- Published via MediatR in transaction
- Cleared after publishing

### Transactions
- Use `ITxRequest` marker interface on commands
- Automatic transaction wrapping via `TxBehavior`
- Domain events published before commit
- Read Committed isolation level

### Naming Convention
- Snake_case table and column names (via EFCore.NamingConventions)
- Consistent with PostgreSQL standards

### Audit Fields
- `Created`: Auto-set via `now()` default
- `Updated`: Manually managed

### Defaults
- UUIDs via `uuid_generate_v4()`
- Timestamps via `now()`
- Boolean defaults where applicable

## Usage

### Register Services
```csharp
// In Program.cs
var connectionString = builder.Configuration.GetConnectionString("ProductCatalogDb");
builder.Services.AddInfrastructure(connectionString);
```

### Use Repository
```csharp
public class MyHandler
{
    private readonly IProductRepository _productRepository;
    
    public async Task Handle(MyCommand request)
    {
        var product = await _productRepository.FindById(request.ProductId);
        product.UpdateBasicInfo(request.Name, request.Slug, request.Description);
        await _productRepository.EditAsync(product);
    }
}
```

### Use Specifications
```csharp
var spec = new ProductsByCategory(categoryId);
var products = await _productRepository.FindAsync(spec);
```

## Migration Commands

See `MIGRATIONS.md` for detailed migration commands.

## Database Schema

Tables created:
- `categories`
- `products`
- `product_options`
- `product_option_values`
- `product_variants`
- `product_variant_options`

Extensions:
- `uuid-ossp`
