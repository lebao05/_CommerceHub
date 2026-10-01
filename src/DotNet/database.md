# Product Service Database Schema

## Overview
The Product Service manages the product catalog, categories, inventory, and product-related data for the e-commerce platform.

## Database: `product_db`

---

## Tables

### 1. Categories (2-Level Deep)

#### `categories`
Primary product categories (Level 1).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique category identifier |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Category name |
| slug | VARCHAR(120) | NOT NULL, UNIQUE | URL-friendly slug |
| description | TEXT | NULL | Category description |
| image_url | VARCHAR(500) | NULL | Category image |
| icon | VARCHAR(100) | NULL | Icon name/class |
| display_order | INTEGER | DEFAULT 0 | Sort order for display |
| is_active | BOOLEAN | DEFAULT true | Active status |
| meta_title | VARCHAR(200) | NULL | SEO meta title |
| meta_description | VARCHAR(500) | NULL | SEO meta description |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_categories_slug` on `slug`
- `idx_categories_active` on `is_active`
- `idx_categories_display_order` on `display_order`

**Example Data:**
```sql
-- Electronics
-- Fashion & Apparel
-- Home & Kitchen
-- Books & Media
-- Sports & Outdoors
```

---

#### `subcategories`
Product subcategories (Level 2) - children of categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique subcategory identifier |
| category_id | BIGINT | NOT NULL, FK(categories.id) | Parent category |
| name | VARCHAR(100) | NOT NULL | Subcategory name |
| slug | VARCHAR(120) | NOT NULL, UNIQUE | URL-friendly slug |
| description | TEXT | NULL | Subcategory description |
| image_url | VARCHAR(500) | NULL | Subcategory image |
| display_order | INTEGER | DEFAULT 0 | Sort order within parent |
| is_active | BOOLEAN | DEFAULT true | Active status |
| meta_title | VARCHAR(200) | NULL | SEO meta title |
| meta_description | VARCHAR(500) | NULL | SEO meta description |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_subcategories_category_id` on `category_id`
- `idx_subcategories_slug` on `slug`
- `idx_subcategories_active` on `is_active`
- `idx_subcategories_parent_order` on `(category_id, display_order)`

**Foreign Keys:**
- `category_id` REFERENCES `categories(id)` ON DELETE CASCADE

**Example Data:**
```sql
-- Electronics -> Smartphones, Laptops, Tablets, Cameras, Audio
-- Fashion & Apparel -> Men's Clothing, Women's Clothing, Shoes, Accessories
-- Home & Kitchen -> Furniture, Cookware, Bedding, Decor
```

---

### 2. Products

#### `products`
Core product information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique product identifier |
| subcategory_id | BIGINT | NOT NULL, FK(subcategories.id) | Product subcategory |
| sku | VARCHAR(100) | NOT NULL, UNIQUE | Stock Keeping Unit |
| name | VARCHAR(255) | NOT NULL | Product name |
| slug | VARCHAR(280) | NOT NULL, UNIQUE | URL-friendly slug |
| short_description | VARCHAR(500) | NULL | Brief description |
| description | TEXT | NULL | Full product description |
| brand | VARCHAR(100) | NULL | Brand name |
| manufacturer | VARCHAR(100) | NULL | Manufacturer name |
| base_price | DECIMAL(10,2) | NOT NULL | Base price |
| sale_price | DECIMAL(10,2) | NULL | Sale/discounted price |
| cost_price | DECIMAL(10,2) | NULL | Cost price (internal) |
| currency | VARCHAR(3) | DEFAULT 'USD' | Currency code |
| tax_class | VARCHAR(50) | NULL | Tax classification |
| weight | DECIMAL(8,2) | NULL | Weight in kg |
| length | DECIMAL(8,2) | NULL | Length in cm |
| width | DECIMAL(8,2) | NULL | Width in cm |
| height | DECIMAL(8,2) | NULL | Height in cm |
| is_featured | BOOLEAN | DEFAULT false | Featured product flag |
| is_active | BOOLEAN | DEFAULT true | Active status |
| publish_date | TIMESTAMP | NULL | Product publish date |
| meta_title | VARCHAR(200) | NULL | SEO meta title |
| meta_description | VARCHAR(500) | NULL | SEO meta description |
| meta_keywords | VARCHAR(500) | NULL | SEO keywords |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_products_subcategory` on `subcategory_id`
- `idx_products_sku` on `sku`
- `idx_products_slug` on `slug`
- `idx_products_active` on `is_active`
- `idx_products_featured` on `is_featured`
- `idx_products_brand` on `brand`
- `idx_products_price` on `base_price`
- `idx_products_name_search` on `name` (text search)

**Foreign Keys:**
- `subcategory_id` REFERENCES `subcategories(id)` ON DELETE RESTRICT

---

#### `product_images`
Product images and media.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique image identifier |
| product_id | BIGINT | NOT NULL, FK(products.id) | Associated product |
| image_url | VARCHAR(500) | NOT NULL | Image URL |
| thumbnail_url | VARCHAR(500) | NULL | Thumbnail URL |
| alt_text | VARCHAR(255) | NULL | Alt text for accessibility |
| display_order | INTEGER | DEFAULT 0 | Sort order |
| is_primary | BOOLEAN | DEFAULT false | Primary image flag |
| created_at | TIMESTAMP | DEFAULT NOW() | Upload timestamp |

**Indexes:**
- `idx_product_images_product` on `product_id`
- `idx_product_images_primary` on `(product_id, is_primary)`

**Foreign Keys:**
- `product_id` REFERENCES `products(id)` ON DELETE CASCADE

---

#### `product_variants`
Product variations (size, color, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique variant identifier |
| product_id | BIGINT | NOT NULL, FK(products.id) | Parent product |
| sku | VARCHAR(100) | NOT NULL, UNIQUE | Variant SKU |
| name | VARCHAR(255) | NOT NULL | Variant name |
| attributes | JSONB | NOT NULL | Variant attributes (size, color) |
| price_adjustment | DECIMAL(10,2) | DEFAULT 0.00 | Price difference from base |
| weight_adjustment | DECIMAL(8,2) | DEFAULT 0.00 | Weight difference |
| image_url | VARCHAR(500) | NULL | Variant-specific image |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_product_variants_product` on `product_id`
- `idx_product_variants_sku` on `sku`
- `idx_product_variants_attributes` on `attributes` (GIN)

**Foreign Keys:**
- `product_id` REFERENCES `products(id)` ON DELETE CASCADE

**Example JSONB:**
```json
{
  "size": "Large",
  "color": "Blue",
  "material": "Cotton"
}
```

---

### 3. Inventory Management

#### `inventory`
Product inventory tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique inventory record |
| product_id | BIGINT | NULL, FK(products.id) | Product reference |
| variant_id | BIGINT | NULL, FK(product_variants.id) | Variant reference |
| warehouse_id | BIGINT | NULL | Warehouse identifier |
| quantity_available | INTEGER | NOT NULL, DEFAULT 0 | Available quantity |
| quantity_reserved | INTEGER | NOT NULL, DEFAULT 0 | Reserved for orders |
| quantity_sold | INTEGER | NOT NULL, DEFAULT 0 | Total sold |
| reorder_level | INTEGER | DEFAULT 10 | Reorder threshold |
| reorder_quantity | INTEGER | DEFAULT 50 | Reorder amount |
| last_restock_date | TIMESTAMP | NULL | Last restocked date |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Constraints:**
- CHECK: `(product_id IS NOT NULL AND variant_id IS NULL) OR (product_id IS NULL AND variant_id IS NOT NULL)`
- CHECK: `quantity_available >= 0`
- CHECK: `quantity_reserved >= 0`

**Indexes:**
- `idx_inventory_product` on `product_id`
- `idx_inventory_variant` on `variant_id`
- `idx_inventory_warehouse` on `warehouse_id`
- `idx_inventory_low_stock` on `quantity_available` WHERE `quantity_available <= reorder_level`

**Foreign Keys:**
- `product_id` REFERENCES `products(id)` ON DELETE CASCADE
- `variant_id` REFERENCES `product_variants(id)` ON DELETE CASCADE

---

#### `inventory_transactions`
Inventory movement history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Transaction identifier |
| inventory_id | BIGINT | NOT NULL, FK(inventory.id) | Inventory reference |
| transaction_type | VARCHAR(50) | NOT NULL | Type (RESTOCK, SALE, RETURN, ADJUSTMENT) |
| quantity_change | INTEGER | NOT NULL | Quantity changed (+ or -) |
| reference_type | VARCHAR(50) | NULL | Reference entity type |
| reference_id | BIGINT | NULL | Reference entity ID |
| notes | TEXT | NULL | Transaction notes |
| performed_by | VARCHAR(100) | NULL | User/system identifier |
| created_at | TIMESTAMP | DEFAULT NOW() | Transaction timestamp |

**Indexes:**
- `idx_inventory_transactions_inventory` on `inventory_id`
- `idx_inventory_transactions_type` on `transaction_type`
- `idx_inventory_transactions_date` on `created_at`

**Foreign Keys:**
- `inventory_id` REFERENCES `inventory(id)` ON DELETE CASCADE

---

### 4. Product Attributes

#### `product_attributes`
Product specifications and features.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Attribute identifier |
| product_id | BIGINT | NOT NULL, FK(products.id) | Product reference |
| attribute_name | VARCHAR(100) | NOT NULL | Attribute name |
| attribute_value | TEXT | NOT NULL | Attribute value |
| display_order | INTEGER | DEFAULT 0 | Display order |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_product_attributes_product` on `product_id`
- `idx_product_attributes_name` on `attribute_name`

**Foreign Keys:**
- `product_id` REFERENCES `products(id)` ON DELETE CASCADE

**Example Data:**
```sql
-- Laptop: Processor='Intel i7', RAM='16GB', Storage='512GB SSD'
-- Phone: Screen Size='6.5 inches', Battery='4000mAh', OS='Android 13'
```

---

### 5. Product Tags & SEO

#### `tags`
Product tags for filtering and search.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Tag identifier |
| name | VARCHAR(50) | NOT NULL, UNIQUE | Tag name |
| slug | VARCHAR(60) | NOT NULL, UNIQUE | URL-friendly slug |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_tags_slug` on `slug`

---

#### `product_tags`
Many-to-many relationship between products and tags.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| product_id | BIGINT | NOT NULL, FK(products.id) | Product reference |
| tag_id | BIGINT | NOT NULL, FK(tags.id) | Tag reference |
| created_at | TIMESTAMP | DEFAULT NOW() | Association timestamp |

**Constraints:**
- PRIMARY KEY: `(product_id, tag_id)`

**Indexes:**
- `idx_product_tags_product` on `product_id`
- `idx_product_tags_tag` on `tag_id`

**Foreign Keys:**
- `product_id` REFERENCES `products(id)` ON DELETE CASCADE
- `tag_id` REFERENCES `tags(id)` ON DELETE CASCADE

---

## Relationships Summary

```
categories (1) ──< (N) subcategories
                         │
                         │ (1)
                         │
                         V
                       (N) products
                         │
                         ├──< (N) product_images
                         ├──< (N) product_variants
                         ├──< (N) product_attributes
                         └──< (N) product_tags ──> tags

products/variants (1) ──< (N) inventory ──< (N) inventory_transactions
```

---

## Category Structure Example

```
Electronics (category)
├── Smartphones (subcategory)
│   └── Products: iPhone 15, Samsung Galaxy S24, etc.
├── Laptops (subcategory)
│   └── Products: MacBook Pro, Dell XPS, etc.
└── Tablets (subcategory)
    └── Products: iPad Air, Galaxy Tab, etc.

Fashion & Apparel (category)
├── Men's Clothing (subcategory)
│   └── Products: T-Shirts, Jeans, Jackets, etc.
├── Women's Clothing (subcategory)
│   └── Products: Dresses, Tops, Pants, etc.
└── Shoes (subcategory)
    └── Products: Sneakers, Boots, Sandals, etc.
```

---

## Indexes Strategy

### Performance Optimization
1. **Category browsing**: Indexes on category_id, is_active
2. **Product search**: Full-text indexes on name, description
3. **Price filtering**: Index on base_price
4. **Inventory checks**: Indexes on product_id, variant_id
5. **Low stock alerts**: Partial index on quantity_available

---

## Sample Queries

### Get all products in a category (2-level deep)
```sql
SELECT p.*, s.name as subcategory_name, c.name as category_name
FROM products p
JOIN subcategories s ON p.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE c.slug = 'electronics'
  AND p.is_active = true
ORDER BY p.created_at DESC;
```

### Get products in a specific subcategory
```sql
SELECT p.*
FROM products p
JOIN subcategories s ON p.subcategory_id = s.id
WHERE s.slug = 'smartphones'
  AND p.is_active = true
ORDER BY p.is_featured DESC, p.created_at DESC;
```

### Check inventory availability
```sql
SELECT 
  p.id, p.name, p.sku,
  i.quantity_available,
  i.quantity_reserved,
  (i.quantity_available - i.quantity_reserved) as actual_available
FROM products p
JOIN inventory i ON p.id = i.product_id
WHERE p.id = $1;
```

### Get low stock products
```sql
SELECT p.name, p.sku, i.quantity_available, i.reorder_level
FROM products p
JOIN inventory i ON p.id = i.product_id
WHERE i.quantity_available <= i.reorder_level
ORDER BY i.quantity_available ASC;
```

### Get category tree with product counts
```sql
SELECT 
  c.id, c.name, c.slug,
  s.id as subcategory_id, s.name as subcategory_name, s.slug as subcategory_slug,
  COUNT(p.id) as product_count
FROM categories c
LEFT JOIN subcategories s ON c.id = s.category_id
LEFT JOIN products p ON s.id = p.subcategory_id AND p.is_active = true
WHERE c.is_active = true AND s.is_active = true
GROUP BY c.id, c.name, c.slug, s.id, s.name, s.slug
ORDER BY c.display_order, s.display_order;
```

---

## Migration Notes

### Initial Setup
1. Create database: `product_db`
2. Create tables in order: categories → subcategories → products → related tables
3. Add indexes after initial data load for better performance
4. Set up foreign key constraints
5. Create database user with appropriate permissions

### Data Migration Strategy
1. Import categories first
2. Import subcategories with category references
3. Import products with subcategory references
4. Import product images, variants, attributes
5. Import inventory data
6. Create product-tag associations
