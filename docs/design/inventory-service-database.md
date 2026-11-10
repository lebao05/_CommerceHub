# Inventory Service — Database Design

**Database:** `inventorydb`
**Owner:** `Inventory.Service`
**Audience:** anyone implementing or reviewing the inventory aggregate.

This service supports **product variants** (size, color, etc.). The variant
model is described in [`variants.md`](./variants.md). This document specifies
the inventory side only.

## 1. Purpose

The inventory service is the system of record for **physical stock**. It owns:

- The current on-hand and reserved balance per **variant**. A variant is one
  purchasable configuration of a product (e.g. "Red, Size M"), identified by
  `product_variants.id` and its human-readable SKU.
- A time-bounded reservation system that holds stock for orders between the
  moment the order is confirmed and the moment the order ships.

**Scope: a single fulfilment site.** The platform ships from one warehouse.
There is no `locations` table, no `location_id` column and no stock-transfer
process. Everything that would have been per-location is now per-variant.
If the business later needs a second warehouse, the migration path is given in
§12 — it is additive and does not change the meaning of the existing rows.

**No movement ledger.** There is no append-only table of every stock change.
`stock_items` holds the current balance and is itself the source of truth;
the history of *who ordered what* lives in `Order.Service`, and the history
of *what was reserved* lives in `reservations`. See §9 for what is lost and
when a ledger becomes worth adding back.

It does **not** own the product catalog. Product names, descriptions, images
and categories live in `ProductCatalog.Service`. The inventory service holds
only what it needs to receive, store, pick and ship: a *projection* of catalog
data, kept in sync via events.

## 2. Schema overview

```
                  ┌──────────────┐    ┌──────────────────────┐
                  │  products    │───▶│  product_variants    │  (projection of catalog)
                  └──────────────┘    └──────────┬───────────┘
                                                 │ id (variant_id)
                                         ┌───────▼──────────┐
                                         │  stock_items      │  (one row per variant,
                                         │                   │   the current balance)
                                         └───────┬──────────┘
                                                 │
                          ┌──────────────────────┼──────────────────────┐
                          │                      │                      │
                   ┌──────▼──────┐        ┌──────▼──────┐        ┌──────▼──────┐
                   │ reservations│        │ reservation_ │        │ outbox_     │
                   │             │◀───────│   lines     │        │ messages    │
                   └─────────────┘        └─────────────┘        └─────────────┘
```

## 3. Tables

### 3.1 `products` and `product_variants` (projections)

These are *projections* of `ProductCatalog.Service` data, kept in sync by
`Product.Upserted` / `ProductVariant.Upserted` / `...Deleted` events. The
inventory service holds only the slice of catalog data it needs to receive,
store, pick and ship. The full option matrix (Color / Size / ...) is not
projected here — that lives in the catalog and is rendered by the storefront.

#### `products`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | mirrors catalog |
| `name` | `varchar(256)` | for pick-list headers and warehouse documents |
| `is_active` | `boolean` | mirrors catalog |
| `last_synced_at` | `timestamptz` | |

There is **no foreign key** to the catalog. The catalog's `id` is the
natural key; the row exists only if a catalog event has been received.

#### `product_variants`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | mirrors catalog; **this is the FK target everywhere in inventory** |
| `product_id` | `uuid` FK→`products.id` | |
| `is_active` | `boolean` | mirrors catalog; a deactivated variant refuses stock changes |
| `last_synced_at` | `timestamptz` | |

Indexes:

- `IX_product_variants_product` on `(product_id)`.
- `IX_product_variants_sku` on `(sku)`.

### 3.2 `stock_items`

The current materialised balance per **variant**. This is the hot read path
and the **source of truth** — there is no ledger behind it, so this table is
written directly by every command that changes stock.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `product_id` | `uuid` PK | |
| `variant_id` | `uuid` FK→`product_variants.id` | one row per purchasable configuration |
| `stock_quantity` | `numeric(18,4)` NULL | suggested replenishment qty |
| `updated_at` | `timestamptz` | when the balance last changed |
| `updated_by` | `varchar(64)` | user id or `system` — who made the last change |

Constraints:

- `UNIQUE (variant_id)`.
- `CHECK (on_hand >= 0)`.
- `CHECK (reserved >= 0)`.
- `CHECK (reserved <= on_hand)` — you cannot reserve what you do not have.

Indexes:

- `IX_stock_items_variant` on `(variant_id)` — covered by the unique constraint.

The available-to-promise is computed: `available = on_hand - reserved`. It is
*not* stored. A variant with no `stock_items` row has zero stock.

### 3.3 `reservations`

A time-bounded hold of N units for an order. Created when an order is
confirmed. Committed when the order ships, or released when the order is
cancelled or the hold expires. The reservation is the durable record of *what
was held and for which order*, and it outlives the change it caused on
`stock_items`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `order_id` | `uuid` | the order service's order id (no FK) |
| `status` | `varchar(16)` | `pending`, `active`, `committed`, `released`, `expired` |
| `expires_at` | `timestamptz` | when the hold is automatically released if not committed |
| `created_at` | `timestamptz` | |
| `committed_at` | `timestamptz` NULL | |
| `released_at` | `timestamptz` NULL | |
| `release_reason` | `varchar(64)` NULL | `cancelled`, `expired`, `manual` |
| `xmin` | `xid` | concurrency token |

Constraints:

- `CHECK (status IN ('pending','active','committed','released','expired'))`.
- `CHECK ((committed_at IS NULL) <> (status = 'committed'))` and similar
  tautologies to keep the timestamps consistent with the status.

Indexes:

- `IX_reservations_order` on `(order_id)`.
- `IX_reservations_status_expires` on `(status, expires_at)` WHERE status = 'active'
  — used by the expiry sweeper.

### 3.4 `reservation_lines`

Which variants and how many of each are held. A reservation covers one or
more lines of an order, all from the same single warehouse.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `reservation_id` | `uuid` FK→`reservations.id` ON DELETE CASCADE | |
| `product_id` | `uuid` PK | |
| `variant_id` | `uuid` FK→`product_variants.id` | the purchasable configuration being held |
| `quantity` | `numeric(18,4)` | positive |

Constraints:

- `UNIQUE (reservation_id, variant_id)`.
- `CHECK (quantity > 0)`.

Indexes:

- `IX_reservation_lines_variant` on `(variant_id)`.

### 3.5 `outbox_messages`

Provided by the building block, declared by this service. Same shape as in
every other service.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `message_type` | `varchar(256)` | full CLR type name |
| `payload` | `jsonb` | the serialized event |
| `headers` | `jsonb` | trace context, message id, causation id |
| `created_at` | `timestamptz` | |
| `published_at` | `timestamptz` NULL | set when the broker has acked |
| `attempts` | `int` | for backoff |
| `next_attempt_at` | `timestamptz` | |

Indexes:

- `IX_outbox_unpublished` on `(next_attempt_at) WHERE published_at IS NULL`.

### 3.6 `processed_messages`

Idempotency for inbound events. This table — not a movement ledger — is what
makes event replay safe.

| Column | Type | Notes |
| --- | --- | --- |
| `event_id` | `uuid` PK | from the `EventId` header |
| `consumer` | `varchar(128)` | the consumer that processed it |
| `processed_at` | `timestamptz` | |

## 4. State transitions

### 4.1 Reservation

```
                create
       (none) ─────────► pending
                           │ stock available
                           ▼
                         active ─────► committed (on shipment)
                           │  ▲
                           │  └──── reactivated on failure retry
                           ▼
                      released / expired
```

`pending` is the brief window between "Order confirmed, ask inventory" and
"inventory has run its check and deducted from reserved". A consumer that
sees `pending` should not assume the hold is real yet.

## 5. Commands that change `stock_items`

Each command reads the current row, computes the new balance, and writes it
inside a transaction that also locks the row.

| Command | Effect on `stock_items` | Recorded where |
| --- | --- | --- |
| `ReceiveStock` | `on_hand += quantity` | `stock_items.updated_by` |
| `AdjustStock` (cycle count) | `on_hand = counted` | `stock_items.updated_by` |
| `ReserveStock` | `reserved += quantity` | `reservations` row (active) |
| `ReleaseStock` | `reserved -= quantity` | `reservations` row (released / expired) |
| `ShipStock` | `on_hand -= quantity`, `reserved -= quantity` | `reservations` row (committed) + `Order.Service` shipment |
| `ReturnStock` | `on_hand += quantity` | `Order.Service` return |

Because there is no movement table, the reservation row and the order record
in `Order.Service` are the audit trail for everything that happens between
"customer ordered" and "customer received". A manual adjustment is visible
only as the new balance plus `updated_by` / `updated_at`.

## 6. Query patterns

| Pattern | How |
| --- | --- |
| "How many of variant X can I promise?" | `SELECT on_hand - reserved FROM stock_items WHERE variant_id = $1` |
| "Reorder alerts" | `SELECT ... WHERE on_hand - reserved <= reorder_point AND reorder_point IS NOT NULL` |
| "When was this variant's balance last touched?" | `stock_items.updated_at`, `stock_items.updated_by` |
| "What is held for order X?" | `reservations WHERE order_id = $1` joined to `reservation_lines` |
| "Active holds about to expire" | `reservations WHERE status = 'active' AND expires_at < now() + interval '15 minutes'` |
| "Total stock for a product, across all variants" | `stock_items JOIN product_variants ON product_variants.id = stock_items.variant_id WHERE product_variants.product_id = $1` |

## 7. Concurrency rules

1. **Reservation create / commit / release** open a transaction and run
   `SELECT ... FOR UPDATE` on every `stock_items` row they touch. The
   `CHECK (reserved <= on_hand)` constraint is the last line of defence if
   the application logic has a bug.
2. **Receipts and adjustments** do not need a lock — they increase `on_hand`,
   which cannot violate the constraint.
3. The `xmin` column on `stock_items` and `reservations` is mapped as a
   concurrency token so optimistic-concurrency retries are possible when the
   pessimistic lock is not enough (e.g. cache-miss path).
4. **Replay safety** comes from `processed_messages`: a redelivered
   `Order.Confirmed.v1` is recognised by `event_id` and skipped, so the
   reservation is not created twice. There is no per-movement
   `idempotency_key` — the event-level key is the only one.

## 8. Events produced

| Event | When | Payload |
| --- | --- | --- |
| `Inventory.StockReserved.v1` | reservation transitions to `active` | `reservationId`, `orderId`, `lines[]` (each: `variantId`, `sku`, `quantity`) |
| `Inventory.StockReservationFailed.v1` | reservation cannot be created | `orderId`, `reason`, `shortages[]` (each: `variantId`, `requested`, `available`) |
| `Inventory.StockCommitted.v1` | reservation committed (shipped) | `reservationId`, `orderId`, `shipmentId` |
| `Inventory.StockReleased.v1` | reservation released/expired | `reservationId`, `orderId`, `reason` |
| `Inventory.StockLow.v1` | `on_hand - reserved <= reorder_point` | `variantId`, `sku`, `available` |

## 9. Events consumed

| Event | Source | Effect |
| --- | --- | --- |
| `Product.Upserted.v1` | ProductCatalog | upsert `products` projection |
| `Product.Deleted.v1` | ProductCatalog | soft-delete `products`; refuse stock changes |
| `ProductVariant.Upserted.v1` | ProductCatalog | upsert `product_variants` projection |
| `ProductVariant.Deleted.v1` | ProductCatalog | soft-delete the projection; refuse stock changes; existing stock remains until consumed |
| `ProductVariant.PriceChanged.v1` | ProductCatalog | update `unit_price`; recompute reorder signals |
| `Order.Confirmed.v1` | Order | attempt to create reservations for each line (by `variant_id`) |
| `Order.Cancelled.v1` | Order | release any active reservations for that order |

## 10. Connection string

```
Host=127.0.0.1;Port=5432;Database=inventorydb;Username=postgres;Password=...
```

## 11. Open questions

1. **Audit trail.** Without a ledger, "why did stock of variant X drop from
   120 to 80?" is only partly answerable — the reservation explains the
   order-driven part, but a manual adjustment leaves only the new balance and
   `updated_by`. If auditors need the full history, the cheapest fix is a
   `stock_adjustments` table (one row per manual change) rather than a
   full movement ledger.
2. **Backorders.** Should a `pending` reservation be allowed to oversell
   (queue the order until restock)? Current design says no — overcommit must
   be a separate, opt-in `backorder` field on the reservation.
3. **Lot / serial tracking.** For now, stock is fungible. If/when lots matter
   (food, electronics), `stock_items` grows a `lot_id` column and the
   quantity becomes per lot.
4. **Cost.** Stock is quantity-only. If FIFO/LIFO costing is needed, add a
   `unit_cost` column and a `cost_total` materialised column to
   `stock_items`.
5. **Safety stock.** `reorder_point` covers the simple case. If per-channel
   safety stock is needed, add `safety_stock` to `stock_items`.

## 12. Migration path if a second warehouse is ever needed

The single-warehouse model is deliberately a strict subset of the
multi-warehouse one, so adding a site later is additive:

1. Add `locations` (id, code, name, type, is_active) and seed one row for the
   current warehouse.
2. Add `location_id` to `stock_items`, `reservation_lines` and `shipments`,
   backfill every existing row with the seeded location, then make
   `stock_items` unique on `(variant_id, location_id)` instead of
   `(variant_id)`.
3. Add the `stock_transfers` / `stock_transfer_lines` tables and the
   `transfer_out` / `transfer_in` stock-change types back.
4. Add `location_id` to the `Inventory.*` event payloads.

No existing column's meaning changes, and no consumer outside inventory has
to change until the payload gains an optional field.
