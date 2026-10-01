# CommerceHub — Architecture Overview

## 1. What this document is

This is the single reference list of every service in the CommerceHub platform: which ones are already scaffolded with code, which ones are designed but not started, what stack each belongs to, and what each one is responsible for. Use it as the master checklist when deciding what to build next.

Status legend:

| Status | Meaning |
|--------|---------|
| ✅ Scaffolded | Project files exist under `src/`, builds and runs (business logic may still be a stub) |
| 📐 Designed | Has use-case docs / DB schema / README entry, but no project folder yet |
| 💡 Proposed | Mentioned as a future/extension idea, not yet designed in detail |

---

## 2. System context

```
                         Frontend (Angular / Mobile)
                                    |
                                    v
                              API Gateway
                                    |
        +--------+--------+--------+--------+--------+--------+
        |        |        |        |        |        |        |
        v        v        v        v        v        v        v
   Identity   ProductCatalog   Cart    Order   Inventory  Payment  Search
                                    |
                    +---------------+---------------+
                    |               |               |
                    v               v               v
               Shipping      Notification      Review/Rating
                                    |
                              Message Broker (RabbitMQ/Kafka)
                                    |
                    +---------------+---------------+
                    |                               |
                    v                               v
              Promotion/Coupon                 Analytics (future)
```

Communication is synchronous (REST/gRPC) for request/response calls through the gateway, and asynchronous (RabbitMQ/Kafka events) for cross-service workflows like checkout, inventory reservation, and notifications. Each service owns its own database — no shared databases between services.

---

## 3. Services to code — full list

### 3.1 .NET services (`src/DotNet/`)

| # | Service | Status | Responsibility |
|---|---------|--------|-----------------|
| 1 | **Order.Service** | ✅ Scaffolded | Order creation, order lifecycle (PENDING → CONFIRMED → SHIPPED → DELIVERED), saga orchestration for checkout, compensation on failure |
| 2 | **Payment.Service** | ✅ Scaffolded | Payment provider abstraction (`IPaymentProvider`), charge/refund, idempotent webhook handling |
| 3 | **Inventory.Service** | ✅ Scaffolded | Stock levels, reservation on order create, release on cancel/fail, overselling prevention |
| 4 | **Product.Service** | 📐 Designed | Product/category/brand catalog, product variants, images, pricing — DB schema in `src/DotNet/database.md`, use cases in `docs/use-cases/02-product-service-usecases.md` |
| 5 | **Cart.Service** | 📐 Designed | Shopping cart, cart items, price snapshot, Redis-backed — use cases in `docs/use-cases/04-cart-service-usecases.md` |
| 6 | **Identity.Service** | 📐 Designed | Registration, login, JWT/OAuth2/OIDC, refresh tokens, roles — fully designed in `docs/IDENTITY-AND-GATEWAY-DESIGN.md` (Duende IdentityServer) |
| 7 | **Notification.Service** | 📐 Designed | Email/SMS/push on order/payment/shipment events — use cases in `docs/use-cases/09-notification-service-usecases.md` |
| 8 | **Review.Service** | 📐 Designed | Product reviews & ratings, moderation — use cases in `docs/use-cases/10-review-rating-service-usecases.md` |
| 9 | **Search.Service** | 📐 Designed | Full-text search via Elasticsearch/OpenSearch, indexed from ProductUpdated events — use cases in `docs/use-cases/03-search-service-usecases.md` |
| 10 | **ApiGateway** (Ocelot) | 📐 Designed | Routing, JWT validation, rate limiting, correlation ID, circuit breaker — full design in `docs/IDENTITY-AND-GATEWAY-DESIGN.md` |
| 11 | **BuildingBlocks** (shared libs) | 📐 Designed | EventBus abstraction (RabbitMQ/Kafka), shared domain primitives, logging — outlined in `docs/FOLDER-STRUCTURE-REFACTORING.md` |

### 3.2 Node.js / NestJS services (`src/Node/`)

| # | Service | Status | Responsibility |
|---|---------|--------|-----------------|
| 12 | **user-service** | ✅ Scaffolded | User profile management (NestJS) |
| 13 | **inventory-service** | ✅ Scaffolded | Node-side inventory variant (NestJS) — check with the team whether this duplicates `Inventory.Service` in .NET or serves a different purpose before building both further |
| 14 | **cart** | 📐 Designed (README only) | Shopping cart service |
| 15 | **wishlist** | 📐 Designed (README only) | User wishlist management |
| 16 | **notification** | 📐 Designed (README only) | Real-time notifications (email, SMS, push) |
| 17 | **payment-gateway** | 📐 Designed (README only) | Payment provider integrations |
| 18 | **email** | 📐 Designed (README only) | Email service with templates |
| 19 | **sms** | 📐 Designed (README only) | SMS gateway integration |
| 20 | **webhook** | 📐 Designed (README only) | Webhook handler and dispatcher |
| 21 | **logger** | 💡 Proposed | Centralized logging service |
| 22 | **audit** | 💡 Proposed | Audit trail and activity logging |
| 23 | **scheduler** | 💡 Proposed | Job scheduling service |

### 3.3 Go services (`src/Go/`)

Nothing scaffolded yet — only `README.md` and `database.md` exist. The DB schema in `src/Go/database.md` already defines 5 service databases, so these are the most fleshed-out "designed but not started" services:

| # | Service | Status | Responsibility |
|---|---------|--------|-----------------|
| 24 | **api-gateway** (Go variant) | 📐 Designed (DB schema exists: `gateway_db`) | High-performance alternative/companion to the Ocelot gateway — routes, middlewares, rate-limit rules, request logs |
| 25 | **rate-limiter** | 📐 Designed (DB schema exists: `ratelimiter_db`) | Token-bucket rate limiting service, per-client overrides |
| 26 | **websocket-server** | 📐 Designed (DB schema exists: `websocket_db`) | WebSocket connection manager, rooms/namespaces, real-time messaging |
| 27 | **caching-proxy** | 📐 Designed (DB schema exists: `cache_db`) | Distributed caching proxy, cache policies/rules, hit-rate stats |
| 28 | **metrics-collector** | 📐 Designed (DB schema exists: `metrics_db`) | Custom metrics collection, alert rules and incidents |
| 29 | **message-broker** | 💡 Proposed | Custom message broker/router (README only, no schema) |
| 30 | **event-stream** | 💡 Proposed | Server-sent events service |
| 31 | **notification-dispatcher** | 💡 Proposed | Real-time notification dispatcher |
| 32 | **file-upload** | 💡 Proposed | High-performance file upload service |
| 33 | **image-processor** | 💡 Proposed | Image optimization and processing |

### 3.4 Cross-cutting / supporting capabilities (not standalone services, but must be coded inside the services above)

These aren't separate deployable services — they're patterns that need to be implemented within Order, Payment, Inventory, and the gateway:

| Capability | Where it lives | Why it matters |
|---|---|---|
| Saga (orchestration) | Order.Service | Coordinates Order → Inventory → Payment → Shipping, with compensation on failure |
| Outbox pattern | Order.Service, Payment.Service | Guarantees DB write + event publish happen atomically |
| Idempotency | Payment.Service, Order.Service | Prevents duplicate charges/side effects from retried or duplicate events |
| Correlation ID propagation | ApiGateway + all services | Lets you trace one request across the whole call chain |
| Circuit breaker / retry / timeout | ApiGateway, Payment.Service | Stops one failing dependency from taking down the whole system |

### 3.5 Extension services (not required for MVP)

| Service | Stack (suggested) | Notes |
|---|---|---|
| Promotion/Coupon | .NET or Node | 20 use cases already documented in `docs/use-cases/11-promotion-coupon-service-usecases.md` — biggest "designed but not scheduled" item |
| Shipping | .NET or Go | 20 use cases documented, carrier-adapter pattern (GHN/GHTK/DHL) |
| Recommendation | Python (per `FOLDER-STRUCTURE-REFACTORING.md`) | Not required for MVP per the project brief |
| Fraud detection | Python | Mentioned in refactoring doc as a future Python service |
| Analytics | Any | Consumes ReviewCreated / order events for reporting |

---

## 4. Recommended build order

Based on what's already scaffolded and the dependency chain in the checkout flow, this is the order that unblocks the most work fastest:

1. **Identity.Service** — nothing else can be properly secured (including the gateway) until auth exists.
2. **ApiGateway** — needed before services can be safely exposed to a frontend.
3. **Product.Service** — Cart and Order both need product data to reference.
4. **Cart.Service** — sits between Product and Order in the checkout flow.
5. Finish wiring **Order.Service ↔ Inventory.Service ↔ Payment.Service** (already scaffolded — this is about completing the saga/event flow between them, not starting from scratch).
6. **Notification.Service** — low risk, high demo value, plugs into events already being published.
7. **Search.Service**, **Review.Service**, **Shipping.Service** — round out the MVP checklist in `docs/use-cases/00-USE-CASES-SUMMARY.md`.
8. Go services (**rate-limiter**, **caching-proxy**, **metrics-collector**) — valuable but not blocking; pick these up once the core .NET/Node flow works end-to-end.

---

## 5. Source documents this overview was built from

- `src/DotNet/README.md`, `src/DotNet/database.md`
- `src/Node/README.md`
- `src/Go/README.md`, `src/Go/database.md`
- `docs/IDENTITY-AND-GATEWAY-DESIGN.md`
- `docs/FOLDER-STRUCTURE-REFACTORING.md`
- `docs/ECommerce_Microservices_Final_Project.md`
- `docs/use-cases/00-USE-CASES-SUMMARY.md` and the 13 per-service use-case files
- Actual folder scan of `src/DotNet/` and `src/Node/` (`.csproj` / `package.json` presence)

**Totals**: 5 services scaffolded, 19 designed but not started, 9 proposed/future. 33 services tracked in all, plus 5 cross-cutting patterns that live inside existing services rather than as standalone deployables.
