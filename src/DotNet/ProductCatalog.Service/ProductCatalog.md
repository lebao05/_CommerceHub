# ProductCatalog Service - Database Design

## Overview
The ProductCatalog service manages the complete product information including categories, brands, attributes, variants, images, and tags. It's designed to support complex e-commerce scenarios with flexible attribute systems and multi-level categorization.

## Database Schema

### Core Tables

#### 1. Products
Main product information table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | UNIQUEIDENTIFIER | PRIMARY KEY | Product unique identifier |
| Name | NVARCHAR(500) | NOT NULL | Product name |
| Slug | NVARCHAR(500) | NOT NULL, UNIQUE | URL-friendly identifier |
| Sku | NVARCHAR(100) | NOT NULL, UNIQUE | Stock Keeping Unit |
| ShortDescription | NVARCHAR(1000) | NULL | Brief product description |
| Description | NVARCHAR(MAX) | NULL | Full product description |
| Price | DECIMAL(18,2) | NOT NULL | Current selling price |
| CompareAtPrice | DECIMAL(18,2) | NULL | Original/compare price (for discounts) |
| CostPrice | DECIMAL(18,2) | NULL | Cost price (for margin calculation) |
| CategoryId | UNIQUEIDENTIFIER | NOT NULL, FK | Reference to Categories |
| BrandId | UNIQUEIDENTIFIER | NULL, FK | Reference to Brands |
| Type | INT | NOT NULL | ProductType enum (0=Simple, 1=Variant, 2=Digital, 3=Service) |
| Status | INT | NOT NULL | ProductStatus enum (0=Draft, 1=Published, 2=Archived, 3=OutOfStock) |
| IsFeatured | BIT | NOT NULL, DEFAULT(0) | Featured flag |
| IsNew | BIT | NOT NULL, DEFAULT(0) | New arrival flag |
| Weight | DECIMAL(18,2) | NULL | Product weight in kg |
| Dimensions | NVARCHAR(100) | NULL | Product dimensions (LxWxH) |
| Material | NVARCHAR(200) | NULL | Product material |
| Barcode | NVARCHAR(100) | NULL | Product barcode |
| ViewCount | INT | NOT NULL, DEFAULT(0) | Number of views |
| Rating | DECIMAL(3,2) | NOT NULL, DEFAULT(0) | Average rating (0-5) |
| ReviewCount | INT | NOT NULL, DEFAULT(0) | Number of reviews |
| PublishedAt | DATETIME2 | NULL | Publication timestamp |
| MetaTitle | NVARCHAR(200) | NULL | SEO meta title |
| MetaDescription | NVARCHAR(500) | NULL | SEO meta description |
| MetaKeywords | NVARCHAR(500) | NULL | SEO keywords |
| CreatedBy | NVARCHAR(100) | NULL | User who created |
| UpdatedBy | NVARCHAR(100) | NULL | User who last updated |
| CreatedAt | DATETIME2 | NOT NULL | Creation timestamp |
| UpdatedAt | DATETIME2 | NOT NULL | Last update timestamp |

**Indexes:**
- `IX_Products_Slug` (UNIQUE) on Slug
- `IX_Products_Sku` (UNIQUE) on Sku
- `IX_Products_CategoryId` on CategoryId
- `IX_Products_BrandId` on BrandId
- `IX_Products_Status` on Status
- `IX_Products_IsFeatured` on IsFeatured WHERE IsFeatured = 1
- `IX_Products_IsNew` on IsNew WHERE IsNew = 1
- `IX_Products_PublishedAt` on PublishedAt
- Full-Text Index on (Name, ShortDescription, Description)

---

#### 2. Categories
Hierarchical product categorization with self-referencing structure.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | UNIQUEIDENTIFIER | PRIMARY KEY | Category unique identifier |
| ParentId | UNIQUEIDENTIFIER | NULL, FK (self) | Parent category reference |
| Name | NVARCHAR(200) | NOT NULL | Category name |
| Slug | NVARCHAR(200) | NOT NULL, UNIQUE | URL-friendly identifier |
| Description | NVARCHAR(1000) | NULL | Category description |
| ImageUrl | NVARCHAR(500) | NULL | Category image URL |
| Icon | NVARCHAR(100) | NULL | Icon identifier or class |
| DisplayOrder | INT | NOT NULL, DEFAULT(0) | Sort order |
| IsActive | BIT | NOT NULL, DEFAULT(1) | Active status |
| Level | INT | NOT NULL | Category depth level (1=root, 2=sub) |
| Path | NVARCHAR(500) | NOT NULL | Hierarchical path (/electronics/phones) |
| MetaTitle | NVARCHAR(200) | NULL | SEO meta title |
| MetaDescription | NVARCHAR(500) | NULL | SEO meta description |
| MetaKeywords | NVARCHAR(500) | NULL | SEO keywords |
| CreatedBy | NVARCHAR(100) | NULL | User who created |
| UpdatedBy | NVARCHAR(100) | NULL | User who last updated |
| CreatedAt | DATETIME2 | NOT NULL | Creation timestamp |
| UpdatedAt | DATETIME2 | NOT NULL | Last update timestamp |

**Indexes:**
- `IX_Categories_Slug` (UNIQUE) on Slug
- `IX_Categories_ParentId` on ParentId
- `IX_Categories_IsActive` on IsActive WHERE IsActive = 1
- `IX_Categories_Path` on Path
- `IX_Categories_DisplayOrder` on DisplayOrder

**Constraints:**
- CHECK: Level BETWEEN 1 AND 3 (maximum 3 levels)

---

#### 3. Brands
Product brand/manufacturer information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | UNIQUEIDENTIFIER | PRIMARY KEY | Brand unique identifier |
| Name | NVARCHAR(200) | NOT NULL | Brand name |
| Slug | NVARCHAR(200) | NOT NULL, UNIQUE | URL-friendly identifier |
| Description | NVARCHAR(1000) | NULL | Brand description |
| LogoUrl | NVARCHAR(500) | NULL | Brand logo URL |
| WebsiteUrl | NVARCHAR(500) | NULL | Brand website |
| CountryCode | NVARCHAR(2) | NULL | ISO country code |
| IsActive | BIT | NOT NULL, DEFAULT(1) | Active status |
| DisplayOrder | INT | NOT NULL, DEFAULT(0) | Sort order |
| MetaTitle | NVARCHAR(200) | NULL | SEO meta title |
| MetaDescription | NVARCHAR(500) | NULL | SEO meta description |
| CreatedAt | DATETIME2 | NOT NULL | Creation timestamp |
| UpdatedAt | DATETIME2 | NOT NULL | Last update timestamp |

**Indexes:**
- `IX_Brands_Slug` (UNIQUE) on Slug
- `IX_Brands_IsActive` on IsActive WHERE IsActive = 1
- `IX_Brands_DisplayOrder` on DisplayOrder

---

#### 4. ProductImages
Product image gallery with multiple images per product.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | UNIQUEIDENTIFIER | PRIMARY KEY | Image unique identifier |
| ProductId | UNIQUEIDENTIFIER | NOT NULL, FK | Reference to Products |
| Url | NVARCHAR(500) | NOT NULL | Image URL |
| ThumbnailUrl | NVARCHAR(500) | NULL | Thumbnail URL |
| AltText | NVARCHAR(200) | NULL | Image alt text for SEO |
| DisplayOrder | INT | NOT NULL, DEFAULT(0) | Sort order |
| IsPrimary | BIT | NOT NULL, DEFAULT(0) | Primary image flag |
| Width | INT | NULL | Image width in pixels |
| Height | INT | NULL | Image height in pixels |
| FileSize | INT | NULL | File size in bytes |
| CreatedAt | DATETIME2 | NOT NULL | Creation timestamp |

**Indexes:**
- `IX_ProductImages_ProductId` on ProductId
- `IX_ProductImages_IsPrimary` on IsPrimary, ProductId WHERE IsPrimary = 1
- `IX_ProductImages_DisplayOrder` on ProductId, DisplayOrder

**Constraints:**
- Only one IsPrimary = 1 per ProductId

---

#### 5. ProductVariants
Product variants for configurable products (e.g., size, color variations).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | UNIQUEIDENTIFIER | PRIMARY KEY | Variant unique identifier |
| ProductId | UNIQUEIDENTIFIER | NOT NULL, FK | Reference to Products |
| Sku | NVARCHAR(100) | NOT NULL, UNIQUE | Variant SKU |
| Name | NVARCHAR(200) | NULL | Variant name (e.g., "Red - Large") |
| Price | DECIMAL(18,2) | NULL | Variant-specific price override |
| CompareAtPrice | DECIMAL(18,2) | NULL | Variant compare price |
| CostPrice | DECIMAL(18,2) | NULL | Variant cost price |
| Weight | DECIMAL(18,2) | NULL | Variant weight |
| Barcode | NVARCHAR(100) | NULL | Variant barcode |
| IsActive | BIT | NOT NULL, DEFAULT(1) | Active status |
| ImageUrl | NVARCHAR(500) | NULL | Variant-specific image |
| DisplayOrder | INT | NOT NULL, DEFAULT(0) | Sort order |
| CreatedAt | DATETIME2 | NOT NULL | Creation timestamp |
| UpdatedAt | DATETIME2 | NOT NULL | Last update timestamp |

**Indexes:**
- `IX_ProductVariants_Sku` (UNIQUE) on Sku
- `IX_ProductVariants_ProductId` on ProductId
- `IX_ProductVariants_IsActive` on IsActive WHERE IsActive = 1

---

### Attribute System Tables

#### 6. Attributes
Attribute definitions (e.g., Color, Size, Material, CPU, RAM).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | UNIQUEIDENTIFIER | PRIMARY KEY | Attribute unique identifier |
| Name | NVARCHAR(200) | NOT NULL | Attribute name |
| Code | NVARCHAR(100) | NOT NULL, UNIQUE | Attribute code (e.g., "color", "size") |
| Description | NVARCHAR(1000) | NULL | Attribute description |
| Type | INT | NOT NULL | AttributeType enum (0=Text, 1=Select, 2=MultiSelect, 3=Boolean, 4=Number, 5=Date) |
| IsFilterable | BIT | NOT NULL, DEFAULT(1) | Can be used for filtering |
| IsSearchable | BIT | NOT NULL, DEFAULT(0) | Included in search index |
| DisplayOrder | INT | NOT NULL, DEFAULT(0) | Sort order |
| IsRequired | BIT | NOT NULL, DEFAULT(0) | Required attribute |
| IsActive | BIT | NOT NULL, DEFAULT(1) | Active status |
| CreatedAt | DATETIME2 | NOT NULL | Creation timestamp |
| UpdatedAt | DATETIME2 | NOT NULL | Last update timestamp |

**Indexes:**
- `IX_Attributes_Code` (UNIQUE) on Code
- `IX_Attributes_IsFilterable` on IsFilterable WHERE IsFilterable = 1
- `IX_Attributes_IsActive` on IsActive WHERE IsActive = 1

---

#### 7. AttributeValues
Predefined values for select/multiselect attributes (e.g., Red, Blue for Color).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | UNIQUEIDENTIFIER | PRIMARY KEY | Value unique identifier |
| AttributeId | UNIQUEIDENTIFIER | NOT NULL, FK | Reference to Attributes |
| Value | NVARCHAR(200) | NOT NULL | Attribute value |
| Code | NVARCHAR(100) | NULL | Value code |
| ColorHex | NVARCHAR(7) | NULL | Color hex code (for color attributes) |
| ImageUrl | NVARCHAR(500) | NULL | Value image URL |
| DisplayOrder | INT | NOT NULL, DEFAULT(0) | Sort order |
| IsActive | BIT | NOT NULL, DEFAULT(1) | Active status |
| CreatedAt | DATETIME2 | NOT NULL | Creation timestamp |

**Indexes:**
- `IX_AttributeValues_AttributeId` on AttributeId
- `IX_AttributeValues_IsActive` on IsActive WHERE IsActive = 1
- `IX_AttributeValues_DisplayOrder` on AttributeId, DisplayOrder

---

#### 8. ProductAttributes
Links products to their attribute values (product-level attributes).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | UNIQUEIDENTIFIER | PRIMARY KEY | ProductAttribute identifier |
| ProductId | UNIQUEIDENTIFIER | NOT NULL, FK | Reference to Products |
| AttributeId | UNIQUEIDENTIFIER | NOT NULL, FK | Reference to Attributes |
| AttributeValueId | UNIQUEIDENTIFIER | NULL, FK | Reference to AttributeValues (for select types) |
| ValueText | NVARCHAR(500) | NULL | Text value (for text type) |
| ValueNumber | DECIMAL(18,2) | NULL | Numeric value (for number type) |
| ValueBoolean | BIT | NULL | Boolean value (for boolean type) |
| ValueDate | DATETIME2 | NULL | Date value (for date type) |
| CreatedAt | DATETIME2 | NOT NULL | Creation timestamp |

**Indexes:**
- `IX_ProductAttributes_ProductId` on ProductId
- `IX_ProductAttributes_AttributeId` on AttributeId
- `IX_ProductAttributes_ProductId_AttributeId` (UNIQUE) on (ProductId, AttributeId)

---

#### 9. VariantAttributes
Links product variants to their specific attribute values (variant-level attributes).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | UNIQUEIDENTIFIER | PRIMARY KEY | VariantAttribute identifier |
| VariantId | UNIQUEIDENTIFIER | NOT NULL, FK | Reference to ProductVariants |
| AttributeId | UNIQUEIDENTIFIER | NOT NULL, FK | Reference to Attributes |
| AttributeValueId | UNIQUEIDENTIFIER | NOT NULL, FK | Reference to AttributeValues |
| CreatedAt | DATETIME2 | NOT NULL | Creation timestamp |

**Indexes:**
- `IX_VariantAttributes_VariantId` on VariantId
- `IX_VariantAttributes_AttributeId` on AttributeId
- `IX_VariantAttributes_VariantId_AttributeId` (UNIQUE) on (VariantId, AttributeId)

---

### Tagging System Tables

#### 10. Tags
Product tags for flexible categorization and filtering.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | UNIQUEIDENTIFIER | PRIMARY KEY | Tag unique identifier |
| Name | NVARCHAR(100) | NOT NULL | Tag name |
| Slug | NVARCHAR(100) | NOT NULL, UNIQUE | URL-friendly identifier |
| Description | NVARCHAR(500) | NULL | Tag description |
| Color | NVARCHAR(7) | NULL | Tag color (hex code) |
| IsActive | BIT | NOT NULL, DEFAULT(1) | Active status |
| UsageCount | INT | NOT NULL, DEFAULT(0) | Number of products using this tag |
| CreatedAt | DATETIME2 | NOT NULL | Creation timestamp |

**Indexes:**
- `IX_Tags_Slug` (UNIQUE) on Slug
- `IX_Tags_IsActive` on IsActive WHERE IsActive = 1
- `IX_Tags_UsageCount` on UsageCount DESC

---

#### 11. ProductTags
Many-to-many relationship between products and tags.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| ProductId | UNIQUEIDENTIFIER | PK, FK | Reference to Products |
| TagId | UNIQUEIDENTIFIER | PK, FK | Reference to Tags |
| CreatedAt | DATETIME2 | NOT NULL | Creation timestamp |

**Indexes:**
- `PK_ProductTags` (PRIMARY KEY) on (ProductId, TagId)
- `IX_ProductTags_TagId` on TagId

---

## Relationships

### One-to-Many Relationships
- **Categories → Products**: One category has many products
- **Brands → Products**: One brand has many products
- **Categories → Categories**: One category has many subcategories (self-referencing)
- **Products → ProductImages**: One product has many images
- **Products → ProductVariants**: One product has many variants
- **Products → ProductAttributes**: One product has many attributes
- **Attributes → AttributeValues**: One attribute has many values
- **ProductVariants → VariantAttributes**: One variant has many attributes

### Many-to-Many Relationships
- **Products ↔ Tags**: Through ProductTags table

---

## Entity Relationships Diagram (ERD)

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│ Categories  │◄────┐   │  Products   │────────►│   Brands    │
│  (Self-Ref) │     │   │             │         │             │
└─────────────┘     └───┤             │         └─────────────┘
                        │             │
                        │             │◄────┐
                        └──────┬──────┘     │
                               │            │
        ┌──────────────────────┼────────────┼───────────────┐
        │                      │            │               │
        ▼                      ▼            │               ▼
┌──────────────┐      ┌────────────────┐   │      ┌──────────────┐
│ProductImages │      │ProductVariants │───┘      │ProductTags   │
└──────────────┘      └────────┬───────┘          └──────┬───────┘
                               │                         │
                               ▼                         ▼
                      ┌──────────────────┐      ┌──────────────┐
                      │VariantAttributes │      │     Tags     │
                      └────────┬─────────┘      └──────────────┘
                               │
        ┌──────────────────────┴────────────────────┐
        │                                            │
        ▼                                            ▼
┌──────────────┐                           ┌──────────────────┐
│  Attributes  │◄──────────────────────────┤ProductAttributes │
└──────┬───────┘                           └──────────────────┘
       │
       ▼
┌──────────────┐
│AttributeValues│
└──────────────┘
```

---

## Sample Data Scenarios

### Scenario 1: Simple Product (T-Shirt)
```
Product:
- Name: "Classic Cotton T-Shirt"
- Type: Simple
- Category: Men → Clothing → T-Shirts
- Brand: "Nike"
- Price: $29.99
- Status: Published

ProductImages (3 images):
- Front view (Primary)
- Back view
- Side view

ProductAttributes:
- Material: "100% Cotton"
- Care Instructions: "Machine wash cold"
- Country of Origin: "Vietnam"

ProductTags:
- "summer"
- "casual"
- "bestseller"
```

### Scenario 2: Variant Product (Laptop)
```
Product:
- Name: "ThinkPad X1 Carbon"
- Type: Variant
- Category: Electronics → Computers → Laptops
- Brand: "Lenovo"
- BasePrice: $1,499.99

ProductVariants (4 variants):
1. i5/8GB/256GB - SKU: TP-X1-001
   - Attributes: CPU=i5, RAM=8GB, Storage=256GB
   - Price: $1,499.99
   
2. i5/16GB/512GB - SKU: TP-X1-002
   - Attributes: CPU=i5, RAM=16GB, Storage=512GB
   - Price: $1,799.99
   
3. i7/16GB/512GB - SKU: TP-X1-003
   - Attributes: CPU=i7, RAM=16GB, Storage=512GB
   - Price: $1,999.99
   
4. i7/32GB/1TB - SKU: TP-X1-004
   - Attributes: CPU=i7, RAM=32GB, Storage=1TB
   - Price: $2,499.99

ProductAttributes:
- Screen Size: "14 inches"
- Weight: "2.4 lbs"
- OS: "Windows 11 Pro"
- Warranty: "3 years"
```

---

## Indexes Strategy

### Performance Indexes
1. **Covering Indexes for Product Listing**:
   ```sql
   CREATE INDEX IX_Products_Listing 
   ON Products (Status, CategoryId, IsFeatured)
   INCLUDE (Name, Slug, Price, Rating, ViewCount);
   ```

2. **Search Optimization**:
   ```sql
   CREATE FULLTEXT INDEX ON Products (Name, ShortDescription, Description);
   ```

3. **Filtering by Attributes**:
   ```sql
   CREATE INDEX IX_ProductAttributes_Filtering
   ON ProductAttributes (AttributeId, AttributeValueId)
   INCLUDE (ProductId);
   ```

---

## Query Patterns

### 1. Get Products by Category with Filters
```sql
SELECT p.*, b.Name as BrandName, c.Name as CategoryName
FROM Products p
INNER JOIN Categories c ON p.CategoryId = c.Id
LEFT JOIN Brands b ON p.BrandId = b.Id
WHERE p.Status = 1 -- Published
  AND c.Path LIKE '/electronics%' -- Category hierarchy
  AND p.Price BETWEEN @MinPrice AND @MaxPrice
ORDER BY p.CreatedAt DESC;
```

### 2. Get Product with All Details
```sql
-- Product with images, variants, attributes, and tags
SELECT 
    p.*,
    pi.Id as ImageId, pi.Url as ImageUrl, pi.IsPrimary,
    pv.Id as VariantId, pv.Sku as VariantSku, pv.Price as VariantPrice,
    pa.AttributeId, a.Name as AttributeName, av.Value as AttributeValue,
    t.Name as TagName
FROM Products p
LEFT JOIN ProductImages pi ON p.Id = pi.ProductId
LEFT JOIN ProductVariants pv ON p.Id = pv.ProductId
LEFT JOIN ProductAttributes pa ON p.Id = pa.ProductId
LEFT JOIN Attributes a ON pa.AttributeId = a.Id
LEFT JOIN AttributeValues av ON pa.AttributeValueId = av.Id
LEFT JOIN ProductTags pt ON p.Id = pt.ProductId
LEFT JOIN Tags t ON pt.TagId = t.Id
WHERE p.Id = @ProductId;
```

### 3. Filter Products by Multiple Attributes
```sql
-- Find products with specific attribute values (e.g., Color=Red AND Size=Large)
SELECT DISTINCT p.*
FROM Products p
INNER JOIN ProductAttributes pa1 ON p.Id = pa1.ProductId
INNER JOIN ProductAttributes pa2 ON p.Id = pa2.ProductId
WHERE pa1.AttributeId = @ColorAttributeId 
  AND pa1.AttributeValueId = @RedValueId
  AND pa2.AttributeId = @SizeAttributeId
  AND pa2.AttributeValueId = @LargeValueId
  AND p.Status = 1;
```

### 4. Get Category Hierarchy
```sql
-- Recursive CTE for category tree
WITH CategoryTree AS (
    SELECT Id, ParentId, Name, Path, Level, 0 as Depth
    FROM Categories
    WHERE ParentId IS NULL
    
    UNION ALL
    
    SELECT c.Id, c.ParentId, c.Name, c.Path, c.Level, ct.Depth + 1
    FROM Categories c
    INNER JOIN CategoryTree ct ON c.ParentId = ct.Id
    WHERE ct.Depth < 3
)
SELECT * FROM CategoryTree
ORDER BY Path;
```

---

## Data Integrity Rules

### Business Rules
1. **Product Status Workflow**:
   - Draft → Published → Archived
   - Cannot publish product without: Name, SKU, Category, Price, Primary Image

2. **Category Rules**:
   - Maximum 3 levels deep
   - Cannot delete category with products
   - Root categories must have IsActive = true

3. **Variant Rules**:
   - Variant products (Type=1) must have at least 1 variant
   - Each variant must have unique SKU
   - Variant must have at least 1 attribute value

4. **Image Rules**:
   - Each product must have exactly 1 primary image
   - DisplayOrder must be unique per product

5. **Attribute Rules**:
   - Select/MultiSelect attributes must have AttributeValues
   - Text/Number/Boolean/Date attributes store values in ProductAttributes fields
   - One attribute can be assigned to a product only once

---

## Performance Considerations

### Caching Strategy
1. **Category Tree**: Cache entire hierarchy (rarely changes)
2. **Brand List**: Cache all brands (rarely changes)
3. **Attribute Definitions**: Cache attributes and values
4. **Featured Products**: Cache for 1 hour
5. **Product Details**: Cache individual products for 15 minutes

### Partitioning Strategy
For high-volume scenarios:
- Partition Products table by Status and CreatedAt
- Partition ProductImages by ProductId (file groups)
- Archive old inactive products to separate table

### Full-Text Search
Enable full-text indexing on:
- Products: Name, ShortDescription, Description
- Categories: Name, Description
- Brands: Name, Description

---

## Migration Notes

### Phase 1: Core Tables
1. Create Categories, Brands, Products
2. Create ProductImages
3. Create basic indexes

### Phase 2: Variant System
1. Create ProductVariants
2. Create Attributes, AttributeValues
3. Create ProductAttributes, VariantAttributes

### Phase 3: Tagging & Search
1. Create Tags, ProductTags
2. Create full-text indexes
3. Create performance covering indexes

---

## Sample Insert Scripts

### Insert Sample Category
```sql
-- Root category
INSERT INTO Categories (Id, Name, Slug, Level, Path, IsActive, CreatedAt, UpdatedAt)
VALUES (NEWID(), 'Electronics', 'electronics', 1, '/electronics', 1, GETUTCDATE(), GETUTCDATE());

-- Subcategory
INSERT INTO Categories (Id, ParentId, Name, Slug, Level, Path, IsActive, CreatedAt, UpdatedAt)
VALUES (NEWID(), @ElectronicsId, 'Laptops', 'laptops', 2, '/electronics/laptops', 1, GETUTCDATE(), GETUTCDATE());
```

### Insert Sample Product with Images
```sql
-- Product
DECLARE @ProductId UNIQUEIDENTIFIER = NEWID();
INSERT INTO Products (Id, Name, Slug, Sku, CategoryId, BrandId, Price, Type, Status, CreatedAt, UpdatedAt)
VALUES (@ProductId, 'iPhone 15 Pro', 'iphone-15-pro', 'IP15PRO', @CategoryId, @BrandId, 999.99, 0, 1, GETUTCDATE(), GETUTCDATE());

-- Primary Image
INSERT INTO ProductImages (Id, ProductId, Url, ThumbnailUrl, IsPrimary, DisplayOrder, CreatedAt)
VALUES (NEWID(), @ProductId, '/images/iphone-15-pro-front.jpg', '/images/thumbs/iphone-15-pro-front.jpg', 1, 1, GETUTCDATE());

-- Additional Images
INSERT INTO ProductImages (Id, ProductId, Url, ThumbnailUrl, IsPrimary, DisplayOrder, CreatedAt)
VALUES (NEWID(), @ProductId, '/images/iphone-15-pro-back.jpg', '/images/thumbs/iphone-15-pro-back.jpg', 0, 2, GETUTCDATE());
```

---

## API Integration Points

### Required Integrations
1. **Inventory Service**: 
   - Check stock levels when displaying products
   - Update product status based on inventory

2. **Order Service**:
   - Provide product details for order creation
   - Track product view counts from order pages

3. **Review Service**:
   - Update Rating and ReviewCount when reviews change

4. **Search Service** (Elasticsearch/Azure Search):
   - Sync product data for advanced search
   - Index attributes for faceted search

5. **Media Service**:
   - Upload and process product images
   - Generate thumbnails

---

## Security & Compliance

### Sensitive Data
- CostPrice: Restricted to admin users only
- CreatedBy/UpdatedBy: Audit trail for compliance

### Data Retention
- Keep archived products for 7 years (compliance)
- Soft delete by setting Status = Archived

### Access Control
- Read: Public (published products only)
- Write: Catalog managers, admins
- Delete: Admins only

---

## Monitoring & Metrics

### Key Metrics
1. Total products by status
2. Average product rating
3. Most viewed products
4. Products without images
5. Products with low inventory (via Inventory service)
6. Category distribution
7. Brand popularity

### Health Checks
- Database connectivity
- Index fragmentation
- Query performance
- Cache hit rates

---

## Future Enhancements

### Phase 2 Features
1. **Product Collections**: Curated product groups
2. **Related Products**: Product recommendations
3. **Product Bundles**: Package deals
4. **Price History**: Track price changes over time
5. **Product Questions**: Q&A section
6. **Availability Schedules**: Time-based product availability
7. **Multi-currency Support**: Price in different currencies
8. **Localization**: Multi-language product information

---

## Conclusion

This database design provides a robust foundation for a comprehensive product catalog system with support for:
- ✅ Hierarchical categories (3 levels)
- ✅ Product variants with flexible attributes
- ✅ Multiple product images
- ✅ Brand management
- ✅ Flexible tagging system
- ✅ SEO optimization
- ✅ Performance indexing
- ✅ Audit trails
- ✅ Status workflow
- ✅ Full-text search capabilities

The design is normalized to 3NF, scalable, and optimized for read-heavy e-commerce workloads.
