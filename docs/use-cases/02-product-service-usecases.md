# Product Catalog Service - Use Cases

## Actors
- **Customer**: End user browsing/searching products
- **Seller**: Vendor managing their products
- **Admin**: System administrator managing catalog
- **System**: Other microservices

## Use Cases

### UC-PROD-001: Create Product
**Primary Actor**: Seller, Admin  
**Precondition**: User has permission to create products  
**Main Flow**:
1. User provides product details (name, description, price, category, brand)
2. System validates required fields
3. System validates price > 0
4. System validates category exists
5. System creates product with DRAFT status
6. System generates product ID
7. System publishes ProductCreated event
8. System returns product details

**Alternative Flow**:
- 2a. Missing required fields → Return validation error
- 3a. Invalid price → Return "Price must be greater than 0"
- 4a. Category not found → Return "Invalid category"

**Postcondition**: Product created and published to event bus

---

### UC-PROD-002: Update Product
**Primary Actor**: Seller, Admin  
**Precondition**: Product exists, user has permission  
**Main Flow**:
1. User provides product ID and updated fields
2. System retrieves existing product
3. System validates ownership (if Seller)
4. System validates updated fields
5. System updates product
6. System publishes ProductUpdated event
7. System returns updated product

**Alternative Flow**:
- 2a. Product not found → Return 404
- 3a. User not owner → Return 403 Forbidden
- 4a. Invalid data → Return validation error

**Postcondition**: Product updated, event published

---

### UC-PROD-003: Delete Product
**Primary Actor**: Seller, Admin  
**Precondition**: Product exists, user has permission  
**Main Flow**:
1. User provides product ID
2. System retrieves product
3. System validates ownership
4. System checks if product has active orders
5. System soft deletes product (status = DELETED)
6. System publishes ProductDeleted event
7. System returns success

**Alternative Flow**:
- 4a. Product has active orders → Return "Cannot delete product with active orders"

**Postcondition**: Product marked as deleted

---

### UC-PROD-004: Get Product Details
**Primary Actor**: Customer, System  
**Precondition**: Product exists and is active  
**Main Flow**:
1. User requests product by ID
2. System checks Redis cache
3. If cache hit → return cached data
4. If cache miss → retrieve from database
5. System stores in cache with TTL
6. System returns product details

**Alternative Flow**:
- 2a. Product not found → Return 404
- 2b. Product deleted/inactive → Return 404

**Postcondition**: Product details returned

---

### UC-PROD-005: List Products
**Primary Actor**: Customer  
**Precondition**: None  
**Main Flow**:
1. Customer requests product list with filters (category, brand, price range)
2. System validates pagination parameters
3. System applies filters
4. System retrieves products from database
5. System returns paginated product list with metadata

**Alternative Flow**:
- 2a. Invalid pagination → Return default page size

**Postcondition**: Product list returned

---

### UC-PROD-006: Create Category
**Primary Actor**: Admin  
**Precondition**: Admin has permission  
**Main Flow**:
1. Admin provides category details (name, slug, parent category)
2. System validates unique slug
3. System validates parent category exists (if provided)
4. System creates category
5. System publishes CategoryCreated event
6. System returns category details

**Alternative Flow**:
- 2a. Slug already exists → Return "Category slug must be unique"
- 3a. Parent category not found → Return error

**Postcondition**: Category created

---

### UC-PROD-007: Update Category
**Primary Actor**: Admin  
**Precondition**: Category exists  
**Main Flow**:
1. Admin provides category ID and updates
2. System retrieves category
3. System validates updates
4. System checks for circular parent references
5. System updates category
6. System publishes CategoryUpdated event
7. System returns updated category

**Alternative Flow**:
- 4a. Circular reference detected → Return error

**Postcondition**: Category updated

---

### UC-PROD-008: Delete Category
**Primary Actor**: Admin  
**Precondition**: Category exists  
**Main Flow**:
1. Admin provides category ID
2. System checks if category has products
3. System checks if category has subcategories
4. System soft deletes category
5. System publishes CategoryDeleted event
6. System returns success

**Alternative Flow**:
- 2a. Category has products → Return "Cannot delete category with products"
- 3a. Category has subcategories → Return "Cannot delete category with subcategories"

**Postcondition**: Category deleted

---

### UC-PROD-009: Upload Product Images
**Primary Actor**: Seller, Admin  
**Precondition**: Product exists, user has permission  
**Main Flow**:
1. User uploads image files for product
2. System validates file type (jpg, png, webp)
3. System validates file size < 5MB
4. System generates unique filename
5. System uploads to storage (S3, Azure Blob)
6. System creates ProductImage record
7. System publishes ProductImageAdded event
8. System returns image URLs

**Alternative Flow**:
- 2a. Invalid file type → Return "Only jpg, png, webp allowed"
- 3a. File too large → Return "File size must be < 5MB"

**Postcondition**: Product images uploaded and linked

---

### UC-PROD-010: Manage Product Variants
**Primary Actor**: Seller, Admin  
**Precondition**: Product exists  
**Main Flow**:
1. User creates product variant (size, color, material)
2. System validates variant attributes
3. System validates unique combination
4. System creates variant with own SKU
5. System links variant to parent product
6. System publishes ProductVariantCreated event
7. System returns variant details

**Alternative Flow**:
- 3a. Variant combination exists → Return "Variant already exists"

**Postcondition**: Product variant created

---

### UC-PROD-011: Update Product Price
**Primary Actor**: Seller, Admin  
**Precondition**: Product exists  
**Main Flow**:
1. User provides new price
2. System validates price > 0
3. System creates price history record
4. System updates product price
5. System publishes ProductPriceUpdated event
6. System invalidates cache
7. System returns success

**Alternative Flow**:
- 2a. Invalid price → Return validation error

**Postcondition**: Price updated, event published, cache invalidated

---

### UC-PROD-012: Create Brand
**Primary Actor**: Admin  
**Precondition**: Admin has permission  
**Main Flow**:
1. Admin provides brand details (name, description, logo)
2. System validates brand name is unique
3. System validates logo file (if provided)
4. System creates brand record
5. System publishes BrandCreated event
6. System returns brand details

**Alternative Flow**:
- 2a. Brand name already exists → Return "Brand name must be unique"
- 3a. Invalid logo format → Return "Logo must be jpg, png, or svg"

**Postcondition**: Brand created

---

### UC-PROD-012a: Update Brand
**Primary Actor**: Admin  
**Precondition**: Brand exists  
**Main Flow**:
1. Admin provides brand ID and updated fields
2. System retrieves existing brand
3. System validates brand name unique (if changed)
4. System updates brand
5. System publishes BrandUpdated event
6. System returns updated brand

**Alternative Flow**:
- 2a. Brand not found → Return 404
- 3a. Brand name already taken → Return error

**Postcondition**: Brand updated

---

### UC-PROD-012b: Delete Brand
**Primary Actor**: Admin  
**Precondition**: Brand exists  
**Main Flow**:
1. Admin provides brand ID
2. System checks if brand has products
3. If products exist → Prevent deletion
4. System soft deletes brand
5. System publishes BrandDeleted event
6. System returns success

**Alternative Flow**:
- 3a. Brand has products → Return "Cannot delete brand with existing products"

**Postcondition**: Brand deleted

---

### UC-PROD-013: Activate/Deactivate Product
**Primary Actor**: Seller, Admin  
**Precondition**: Product exists  
**Main Flow**:
1. User changes product status
2. System validates status transition
3. System updates product status
4. System publishes ProductStatusChanged event
5. System invalidates cache
6. System returns success

**Alternative Flow**:
- 2a. Invalid status transition → Return error

**Postcondition**: Product status changed

