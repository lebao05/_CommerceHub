# CommerceHub — Database Design

This folder contains the per-service database designs for the CommerceHub platform:

- [`order-service-database.md`](./order-service-database.md) — order lifecycle, payments, shipments, outbox
- [`inventory-service-database.md`](./inventory-service-database.md) — single-warehouse stock, reservations, balances
- [`variants.md`](./variants.md) — the Product ↔ Variant model and how each service uses it

## Shared conventions

All the services described here follow the same conventions. The goal is that the
EF Core model in
`Domain` + the migration in `Infrastructure` + the conventions enforced by the
building block produce identical SQL.

### Stack

| Concern | Choice |
| --- | --- |
| RDBMS | PostgreSQL 16+ |
| ODM/ORM | EF Core 10 with `EFCore.NamingConventions` (snake_case) from `BuildingBlocks.Infrastructure` |
| IDs | `uuid` (`.HasDefaultValueSql("gen_random_uuid()")`), generated client-side by EF |
| Timestamps | `timestamptz` (UTC) |
| Money | `numeric(18,4)` + ISO-4217 currency code column |
| Enums | `varchar` with check constraint (not `int` — readable in psql) |
| Concurrency | `xmin` system column mapped as `IsRowVersion()`; explicit `SELECT ... FOR UPDATE` for stock math |
| Soft delete | `deleted_at timestamptz NULL` + filtered index `WHERE deleted_at IS NULL` for hot paths |
| Audit columns | `created_at`, `created_by`, `updated_at`, `updated_by` on every aggregate root |
| Migrations | one assembly per service, applied at startup behind `--migrate` flag in non-prod |

### Project layout

Each service is a four-project solution (matches `ProductCatalog.Service`):

```
Order.Service/
  Order.Domain/         # entities, value objects, domain events, no EF
  Order.Application/    # MediatR handlers, validators, DTOs
  Order.Infrastructure/ # DbContext, repositories, MassTransit consumers
  Order.API/            # controllers, Program.cs, appsettings
```

The `Domain` project has **no** reference to EF Core. The `Infrastructure`
project references `Domain` and is the only place EF Core is used.

### Cross-service integration

All writes that need to be visible to other services go through a **transactional
outbox**:

- The aggregate root has a `DomainEvents` collection.
- A SaveChanges interceptor (`BuildingBlocks.Infrastructure`) writes
  `OutboxMessages` rows in the **same transaction** as the business write.
- A background `OutboxDispatcher` reads unpublished rows and publishes to
  MassTransit → Kafka. It marks the row published on broker ack.
- Consumers are idempotent: every consumer table includes a
  `processed_messages(event_id uuid PRIMARY KEY)` table it checks before
  applying an event.

This means a service is consistent with itself and at-least-once across services
without 2PC.

### Per-service database

Each service has its own PostgreSQL database. No cross-service foreign keys. A
reference to another service's aggregate is the other service's `uuid`, not a
foreign key.

| Service | Database | Owner |
| --- | --- | --- |
| Identity | `identitydb` | Identity.Service |
| ProductCatalog | `productcatalogdb` | ProductCatalog.Service |
| **Inventory** | `inventorydb` | Inventory.Service |
| **Order** | `orderdb` | Order.Service |

### Currency

All monetary columns are `numeric(18,4)` (4 decimal places) with a sibling
`currency char(3)` column. We never use `float` for money.

### Time

All timestamps are `timestamptz` stored in UTC. EF Core converts from `DateTimeOffset`
to UTC on write.

## Reading order

1. This file for shared conventions.
2. `variants.md` — the shared vocabulary: what a variant is and which service
   owns which part of it.
3. `inventory-service-database.md` — simpler model, defines the events
   `Order.Service` consumes and produces.
4. `order-service-database.md` — the consumer side, with the saga-like flow
   that ties the two services together.
