# Variants — the Product ↔ Variant Model

**Owner:** `ProductCatalog.Service` (canonical), with projections in
`Inventory.Service` and snapshots in `Order.Service`.
**Audience:** anyone implementing or reviewing how products, options and
variants are stored and referenced.

Related documents:

- [`inventory-service-database.md`](./inventory-service-database.md) — how
  stock is held per variant
- [`order-service-database.md`](./order-service-database.md) — how a variant is
  snapshotted onto an order line

## 1. The decision

Both shapes are supported by one schema:

1. **Flat SKU per item** — a product that comes in one style ("Classic
   T-Shirt") has exactly one variant. The storefront shows no option picker.
2. **Parent product + option matrix** — a product with options ("Red /
   Small") has one variant per valid combination of option values.

Nothing is special-cased. A product with no option types simply has one
variant; a product with two option types has one variant per combination.

### Why a variant row even for a single-SKU product

A product with one variant still needs a variant row because:

- **Inventory is always per-variant**, never per-product. A single product
  with one variant means `stock_items` has one row for it — no special case.
- **Price is per-variant.** When a product gains a "Large" option later, the
  existing row becomes one cell of the matrix instead of requiring a data
  migration.
- **The order line always points at a variant.** No polymorphic
  `sku`-or-`variant_id` column, no nullable columns, no branching logic in
  the order pipeline.

The cost is one extra join per product read. That is acceptable.

## 2. Entity model

```
Product
 ├── ProductOption            (an axis: "Color", "Size")
 │    └── ProductOptionValue  (a cell on that axis: "Red", "M")
 └── ProductVariant           (a purchasable configuration)
      └── ProductVariantOption (link: variant ↔ one option value)
```

| Entity | Meaning | Cardinality |
| --- | --- | --- |
| `Product` | The sellable concept. Has a name, description, category, images. | 1 : N variants |
| `ProductOption` | An axis of variation (Color, Size). Belongs to a product. | 1 : N values |
| `ProductOptionValue` | One allowed value on an axis (Red, M). | N : N variants (via `ProductVariantOption`) |
| `ProductVariant` | One purchasable configuration. Owns SKU, price, weight, barcode. | N : N option values |
| `ProductVariantOption` | Join row. | — |

A variant with **zero** option links is the flat case. A variant with **one**
link per axis is the matrix case.

## 3. Catalog tables (canonical)

### 3.1 `products` (existing)

Unchanged. A product is the parent; it owns the name, slug, description,
category, status, rating.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `name` | `varchar(256)` | |
| `slug` | `varchar(256)` | unique, url-safe |
| `description` | `text` NULL | |
| `category_id` | `uuid` FK→`categories.id` | |
| `status` | `varchar(16)` | `draft`, `active`, `archived` |
| `is_featured` | `boolean` | |
| `rating` | `numeric(3,2)` | denormalised from reviews |
| `review_count` | `int` | |
| `is_variant_axis_visible` | `boolean` | whether option pickers are shown on the storefront |
| `created_at` / `updated_at` | `timestamptz` | |
| `deleted_at` | `timestamptz` NULL | soft delete |

`is_variant_axis_visible = false` means "the storefront shows the product as
a single SKU" — it is a presentation switch, not a data-model switch. The
variant rows still exist and inventory still tracks them.

### 3.2 `product_options` (axes)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `product_id` | `uuid` FK→`products.id` ON DELETE CASCADE | |
| `name` | `varchar(64)` | display label, e.g. `Color`, `Size` |
| `code` | `varchar(32)` | stable machine key, e.g. `color`, `size` — used by integrations |
| `display_order` | `int` | order of the picker on the storefront |
| `created_at` / `updated_at` | `timestamptz` | |

Constraints:

- `UNIQUE (product_id, code)`.

### 3.3 `product_option_values`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `product_option_id` | `uuid` FK→`product_options.id` ON DELETE CASCADE | |
| `value` | `varchar(64)` | display label, e.g. `Red`, `M` |
| `code` | `varchar(32)` | stable machine key, e.g. `red`, `m` |
| `swatch_url` | `varchar(512)` NULL | colour chip image for colour axes |
| `display_order` | `int` | order of the value within the axis |
| `is_active` | `boolean` | a retired value stops being offered, existing variants are untouched |
| `created_at` / `updated_at` | `timestamptz` | |

Constraints:

- `UNIQUE (product_option_id, code)`.

### 3.4 `product_variants`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `product_id` | `uuid` FK→`products.id` ON DELETE CASCADE | |
| `sku` | `varchar(64)` | **unique**, human-readable, printed on labels |
| `name` | `varchar(256)` | display label for the variant, e.g. "Red / Small" |
| `barcode` | `varchar(64)` NULL | for scanning |
| `price` | `numeric(18,4)` | selling price |
| `compare_at_price` | `numeric(18,4)` NULL | struck-through "was" price |
| `currency` | `char(3)` | ISO-4217 |
| `tax_class` | `varchar(32)` NULL | which tax rate applies |
| `weight_grams` | `int` NULL | for shipping calculation |
| `length_mm` / `width_mm` / `height_mm` | `int` NULL | for shipping calculation |
| `is_active` | `boolean` | a deactivated variant is not offered |
| `display_order` | `int` | order of the variant in the catalog listing |
| `created_at` / `updated_at` | `timestamptz` | |
| `deleted_at` | `timestamptz` NULL | soft delete |

Constraints:

- `UNIQUE (sku)`.
- `UNIQUE (barcode) WHERE barcode IS NOT NULL` — partial index.
- `CHECK (price >= 0)`.
- `CHECK (compare_at_price IS NULL OR compare_at_price >= price)`.
- `CHECK (weight_grams IS NULL OR weight_grams >= 0)`.

Indexes:

- `IX_product_variants_product` on `(product_id)`.
- `IX_product_variants_sku` on `(sku)` — covered by the unique constraint.

### 3.5 `product_variant_options` (join)

| Column | Type | Notes |
| --- | --- | --- |
| `variant_id` | `uuid` FK→`product_variants.id` ON DELETE CASCADE | |
| `option_value_id` | `uuid` FK→`product_option_values.id` ON DELETE CASCADE | |

Composite PK `(variant_id, option_value_id)`.

Index: `IX_product_variant_options_value` on `(option_value_id)` — needed to
answer "which variants use Red?".

### 3.6 Combination uniqueness

Two variants of the same product must not share the same set of option
values. A plain unique constraint cannot express this (the number of columns
varies per product), so it is enforced by a **deferred constraint trigger**,
not by a `UNIQUE` index.

```sql
CREATE OR REPLACE FUNCTION check_variant_option_combination() RETURNS trigger
AS $$
DECLARE
  dup_count integer;
BEGIN
  SELECT count(*) INTO dup_count
  FROM product_variant_options mine
  JOIN product_variant_options other
    ON other.variant_id = (
        SELECT v.id FROM product_variants v
        WHERE v.product_id = (
                SELECT pvo.variant_id FROM product_variant_options pvo
                JOIN product_variants v2 ON v2.id = pvo.variant_id
                WHERE pvo.option_value_id = NEW.option_value_id
                LIMIT 1)
          AND v.id <> NEW.variant_id)
    AND other.option_value_id = mine.option_value_id
  WHERE mine.variant_id = NEW.variant_id;

  IF dup_count > 0 THEN
    RAISE EXCEPTION 'Duplicate option combination for product';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

This is deliberately deferred to commit time (`SET CONSTRAINTS ALL DEFERRED`),
because a matrix is built by inserting several `product_variant_options` rows
in a row and an immediate check would fire on the partial state.

**Alternative, if the trigger proves troublesome in practice:** add a
materialised `option_signature` column on `product_variants` — a canonical,
sorted concatenation of the variant's option value codes, e.g.
`color:red|size:m` — and enforce `UNIQUE (product_id, option_signature)`.
This is simpler, indexable, and the application maintains it. It is not the
default because it duplicates state that must be kept in sync.

## 4. How each service uses variants

| Service | Role | Detail |
| --- | --- | --- |
| `ProductCatalog` | **Canonical** | Owns products, options, option values, variants. |
| `Inventory` | **Projection** | Owns stock per `variant_id`. Does **not** project the option matrix. |
| `Order` | **Snapshot** | Copies name, sku, options and price onto the order line. |
| `Search` | **Projection** | Indexes variant attributes for faceting. |
| `Storefront (React)` | **Reader** | Renders the option picker from the catalog projection. |

### 4.1 Inventory side

Full detail in [`inventory-service-database.md`](./inventory-service-database.md).
The essentials:

- `stock_items` is keyed on `variant_id` (one warehouse only — see §5).
- The `product_variants` projection carries only what shipping and picking
  need: `id`, `product_id`, `sku`, `name`, `barcode`, `weight_grams`,
  `unit_price`, `currency`, `is_active`.
- The option matrix is **deliberately not projected**. Inventory asks
  "how many of this exact variant?", and `variant_id` answers it. Storing the
  matrix would add sync complexity with no operational benefit.

### 4.2 Order side

Full detail in [`order-service-database.md`](./order-service-database.md) §3.2.
When an order is placed, the order service copies onto `order_items`:

| Column | Source |
| --- | --- |
| `product_id` | catalog product id |
| `variant_id` | catalog variant id |
| `product_name` | catalog product name |
| `variant_name` | catalog variant name |
| `variant_sku` | catalog variant sku |
| `variant_options_snapshot` | `{"Color": "Red", "Size": "M"}` as jsonb |
| `unit_price` | catalog variant price |

The snapshot is written in the same transaction as the order row. After
that, historical orders are readable even if the variant is renamed,
repriced or deleted, and every published event carries the snapshot so
consumers never have to call back to the catalog.

### 4.3 Storefront side

The React app loads the product with its option axes and values, lets the
customer pick one value per axis, resolves the combination to a `variant_id`,
and sends that id — **not** the option values — to the cart and order APIs.

The API validates the id against the catalog. The storefront never decides
prices; the server always re-reads the price when the order is created.

## 5. Single warehouse

The platform ships from **one** fulfilment site. Variants are therefore the
only stock dimension:

- `stock_items` is unique on `(variant_id)`, not `(variant_id, location_id)`.
- `reservation_lines` holds `variant_id` and `quantity` — no location.
- There is no `locations` table, no `stock_transfers` and no
  `transfer_out` / `transfer_in` stock-change types.

If a second warehouse is ever needed, the migration path is documented in
[`inventory-service-database.md`](./inventory-service-database.md) §12. It is
additive: a `location_id` column is added and backfilled, and no existing
column's meaning changes.

## 6. Events

### Produced by ProductCatalog

| Event | Payload |
| --- | --- |
| `Product.Upserted.v1` | `productId`, `name`, `slug`, `categoryId`, `status`, `isFeatured` |
| `Product.Deleted.v1` | `productId` |
| `ProductVariant.Upserted.v1` | `variantId`, `productId`, `sku`, `name`, `barcode`, `price`, `compareAtPrice`, `currency`, `weightGrams`, `isActive` |
| `ProductVariant.Deleted.v1` | `variantId`, `productId` |
| `ProductVariant.PriceChanged.v1` | `variantId`, `oldPrice`, `newPrice`, `currency` |

### Consumed

| Consumer | Effect |
| --- | --- |
| `Inventory.Service` | upserts the `product_variants` projection; refuses stock changes for a deleted variant |
| `Order.Service` | refreshes its variant cache used for order-line snapshots; updates `unit_price` on **pending** orders only |
| `Search.Service` | updates the search index |

The `ProductVariant.*` events carry only the variant's own attributes — not
the option matrix. A consumer that needs the matrix reads it from the catalog
API.

## 7. Catalog domain — gaps to fill

The current C# entities are missing several of the fields described above.
This is the concrete to-do list.

### `ProductVariant` (`ProductCatalog.Domain/Entities/ProductVariant.cs`)

Missing properties:

| Property | Type | Notes |
| --- | --- | --- |
| `Sku` | `string` | required, unique across the catalog |
| `Name` | `string` | display label, e.g. "Red / Small" |
| `Barcode` | `string?` | unique when present |
| `Currency` | `string` | ISO-4217, e.g. `VND` |
| `TaxClass` | `string?` | |
| `WeightGrams` | `int?` | |
| `LengthMm` / `WidthMm` / `HeightMm` | `int?` | |

Missing domain methods:

- `UpdateDetails(string name, string? barcode)` — rename / re-barcode.
- `UpdateWeight(int? grams, int? lengthMm, int? widthMm, int? heightMm)`.
- `SetSku(string sku)` — guarded by a uniqueness check at the repository level.
- `UpdatePrice` should also accept a currency, so a currency change is an
  explicit, audited operation rather than a silent mutation.

### `ProductOptionValue` (`ProductCatalog.Domain/Entities/ProductOptionValue.cs`)

Missing properties:

| Property | Type | Notes |
| --- | --- | --- |
| `Code` | `string` | stable machine key, unique per option |
| `DisplayOrder` | `int` | |
| `SwatchUrl` | `string?` | colour chip image |
| `IsActive` | `bool` | |

Missing domain methods:

- `UpdateValue(string value, string code)`.
- `UpdateSwatch(string? swatchUrl)`.
- `UpdateDisplayOrder(int displayOrder)`.
- `SetActive(bool isActive)`.

### `Product` (`ProductCatalog.Domain/Entities/Product.cs`)

Missing properties:

| Property | Type | Notes |
| --- | --- | --- |
| `IsVariantAxisVisible` | `bool` | whether the storefront shows option pickers |

### `ProductOption` (`ProductCatalog.Domain/Entities/ProductOption.cs`)

Missing properties:

| Property | Type | Notes |
| --- | --- | --- |
| `Code` | `string` | stable machine key, unique per product |
| `DisplayOrder` | `int` | |

## 8. Migration path from a flat-SKU design

If the catalog was originally flat (SKU directly on `product`), migrate in
four steps:

1. **Add the variant tables** (`product_options`, `product_option_values`,
   `product_variants`, `product_variant_options`) and the new columns.
2. **Backfill** — for every existing product, insert exactly one
   `product_variants` row carrying the product's old SKU, price and weight.
   Set `product.is_variant_axis_visible = false`. The system is now
   running on the new model with no visible behaviour change.
3. **Dual-read** — make the API accept the old product-level SKU and resolve
   it to the single variant. Keep the storefront pointed at the old endpoint.
4. **Cut over** — point the storefront at the variant endpoint, then drop the
   old product-level SKU column in a later release.

Step 2 never loses data and the schema is valid at every point, so each step
is independently deployable.

## 9. Open questions

1. **Option value codes vs labels.** `value` is for humans and can be
   renamed; `code` is for machines and should not be. Should renaming a
   label be a soft change with history, or a hard update? Current design: hard
   update, `code` is the stable anchor.
2. **Variant images.** Should a variant carry its own images (a red shoe
   photographed differently), or do all variants of a product share the
   product's media? Current design: product media only; a per-variant image
   table would be an additive change.
3. **Option combination count.** A product with 6 colours × 12 sizes = 72
   variants. Is there a cap? Should the catalog refuse to create a product
   whose full matrix exceeds a threshold, forcing the merchant to declare
   only the valid combinations?
