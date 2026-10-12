## EF Core Migration Commands

### Create Initial Migration
```bash
cd src/DotNet/ProductCatalog.Service/ProductCatalog.Infrastructure
dotnet ef migrations add InitialCreate --startup-project ../ProductCatalog.API --context ProductCatalogDbContext
```

### Update Database
```bash
cd src/DotNet/ProductCatalog.Service/ProductCatalog.Infrastructure
dotnet ef database update --startup-project ../ProductCatalog.API --context ProductCatalogDbContext
```

### Add New Migration
```bash
cd src/DotNet/ProductCatalog.Service/ProductCatalog.Infrastructure
dotnet ef migrations add <MigrationName> --startup-project ../ProductCatalog.API --context ProductCatalogDbContext
```

### Remove Last Migration
```bash
cd src/DotNet/ProductCatalog.Service/ProductCatalog.Infrastructure
dotnet ef migrations remove --startup-project ../ProductCatalog.API --context ProductCatalogDbContext
```

### Generate SQL Script
```bash
cd src/DotNet/ProductCatalog.Service/ProductCatalog.Infrastructure
dotnet ef migrations script --startup-project ../ProductCatalog.API --context ProductCatalogDbContext --output migration.sql
```

## Connection String

Update `appsettings.json` or `appsettings.Development.json` in ProductCatalog.API:

```json
{
  "ConnectionStrings": {
    "ProductCatalogDb": "Host=localhost;Port=5432;Database=productcatalog_db;Username=postgres;Password=postgres"
  }
}
```

## Database Setup

1. Ensure PostgreSQL is running
2. Create the database (optional, EF will create it):
   ```sql
   CREATE DATABASE productcatalog_db;
   ```
3. Run migrations to create tables
