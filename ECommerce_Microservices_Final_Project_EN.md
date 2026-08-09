# FINAL PROJECT
# E-Commerce Microservices Platform – A Distributed E-Commerce Platform

## 1. Problem Context

Modern e-commerce systems must serve large volumes of users, products, orders, and payment transactions. The system must remain stable even when some components fail, and it must be able to scale independently according to load.

A monolithic system can start simple:

```text
Frontend
   ↓
E-Commerce Application
   ↓
Database
```

But as the system grows, a single application may have to handle:

- Authentication
- Product Catalog
- Search
- Cart
- Order
- Inventory
- Payment
- Shipping
- Notification
- Review
- Recommendation

This leads to high coupling, difficulty in scaling each function independently, and makes even a small change affect the entire system.

Therefore, the main question of the project is:

> Can we build an E-Commerce platform based on a microservices architecture, in which business capabilities can be developed, deployed, scaled, and changed independently, while the system still guarantees consistency, reliability, security, and observability?

The focus of the project is **Software Architecture and Distributed Systems**, not merely building a shopping website.

---

# 2. Overall Goals

Build an E-Commerce Platform capable of:

- Managing users and authentication.
- Managing products.
- Managing product categories.
- Searching for products.
- Managing the shopping cart.
- Creating and managing orders.
- Managing inventory.
- Processing payments.
- Managing shipping.
- Sending notifications.
- Managing reviews and ratings.
- Supporting promotions/coupons.
- Using a message broker for asynchronous communication.
- Handling distributed transactions.
- Supporting the Saga Pattern.
- Supporting the Outbox Pattern.
- Handling duplicate events using idempotency.
- Caching with Redis.
- API Gateway.
- Database per Service.
- Distributed tracing.
- Logging and monitoring.
- Ability to scale services independently.
- Ability to add new providers without modifying many existing services.

---

# 3. Overall Example

The user accesses:

```text
E-Commerce Platform
```

And can:

```text
Browse Product
      ↓
Add to Cart
      ↓
Checkout
      ↓
Create Order
      ↓
Reserve Inventory
      ↓
Process Payment
      ↓
Create Shipment
      ↓
Send Notification
```

A reference architecture:

```text
                         Frontend
                            |
                            v
                       API Gateway
                            |
       +--------------------+--------------------+
       |          |         |         |          |
       v          v         v         v          v
   Identity    Product    Cart      Order    Search
   Service     Service    Service   Service  Service
                                      |
                        +-------------+-------------+
                        |             |             |
                        v             v             v
                   Inventory      Payment       Shipping
                    Service        Service        Service
                        |             |             |
                        +-------------+-------------+
                                      |
                                Message Broker
                                      |
                         +------------+------------+
                         |                         |
                         v                         v
                  Notification               Analytics
                    Service                    Service
```

This is only a reference architecture. The team may propose a different architecture if it can explain the reasoning.

---

# 4. Architectural Drivers

The project must focus on addressing the following architectural drivers.

## 4.1 Modifiability

It must be possible to add:

```text
PayPal
Stripe
VNPay
MoMo
```

without having to modify the entire Order Service.

## 4.2 Scalability

Example:

```text
Product Service: 2 instances
Order Service: 10 instances
Payment Service: 5 instances
```

Each service is scaled independently.

## 4.3 Reliability

If the Payment Service fails:

```text
Order
  ↓
Payment
  ↓
Timeout
```

The system must have:

- Retry.
- Timeout.
- Circuit Breaker.
- Compensation.
- Dead Letter Queue if appropriate.

## 4.4 Consistency

An order may involve multiple services:

```text
Order
Inventory
Payment
Shipping
```

We cannot simply use a single database transaction for the entire system.

The team needs to research:

- Eventual Consistency.
- Saga.
- Transactional Outbox.
- Idempotency.

## 4.5 Performance

Operations such as:

```text
Product Search
Product Detail
Category Listing
```

may receive a very large volume of requests.

The team needs to research:

- Redis.
- Database indexing.
- Read optimization.
- Search engine.
- CDN if needed.

## 4.6 Observability

The system needs to know:

```text
Request ID
Trace ID
Order ID
Service
Latency
Error
Event
```

A request:

```text
POST /orders
```

may pass through:

```text
Gateway
 ↓
Order
 ↓
Inventory
 ↓
Payment
 ↓
Notification
```

It is possible to use:

```text
OpenTelemetry
Prometheus
Grafana
ELK/OpenSearch
```

---

# 5. Module 1 – Identity & Authentication Service

The Identity Service is responsible for:

- Registration.
- Login.
- Logout.
- Password management.
- Access token.
- Refresh token.
- Role.
- Permission.

Example:

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
```

The Product Service or Order Service should not manage passwords on their own.

Architecture:

```text
Frontend
   ↓
API Gateway
   ↓
Identity Service
   ↓
Identity Database
```

Topics to research:

- JWT.
- OAuth2.
- OpenID Connect.
- Role-Based Access Control.

---

# 6. Module 2 – Product Catalog Service

The Product Service manages:

```text
Product
Category
Brand
ProductImage
ProductVariant
Price
```

Example:

```text
Product:
    Id
    Name
    Description
    CategoryId
    BrandId
    Price
    Status
```

APIs:

```text
GET /products
GET /products/{id}
POST /products
PUT /products/{id}
DELETE /products/{id}
```

The Product Service should not directly access the Order Service's database.

---

# 7. Module 3 – Search Service

The Search Service is responsible for:

```text
Search products
Filter
Sort
Autocomplete
```

It may use:

```text
Elasticsearch / OpenSearch
```

Architecture:

```text
Product Service
      |
 ProductUpdated
      |
 Message Broker
      |
   Search Service
      |
 Elasticsearch
```

When a Product changes, the Search Service updates its index.

The Product Service does not need to know the internal implementation of the Search Service.

---

# 8. Module 4 – Cart Service

The Cart Service manages the shopping cart:

```text
Cart
CartItem
Quantity
ProductId
PriceSnapshot
```

Example:

```text
POST /cart/items
PUT /cart/items/{id}
DELETE /cart/items/{id}
GET /cart
```

The Cart can use Redis because the data:

- changes frequently;
- needs fast response;
- can expire.

Example:

```text
User
 ↓
Cart Service
 ↓
Redis
```

---

# 9. Module 5 – Inventory Service

The Inventory Service manages:

```text
Product
AvailableQuantity
ReservedQuantity
Warehouse
```

An important problem:

```text
Stock = 1

Customer A → Buy
Customer B → Buy
```

If not handled correctly, both customers may end up buying the same product.

The team needs to research:

- Optimistic Concurrency.
- Pessimistic Lock.
- Atomic update.
- Reservation.
- Idempotency.

---

# 10. Module 6 – Order Service

The Order Service manages:

```text
Order
OrderItem
OrderStatus
OrderTotal
CustomerId
```

The order state can be:

```text
PENDING
   ↓
CONFIRMED
   ↓
PROCESSING
   ↓
SHIPPED
   ↓
DELIVERED
```

Or:

```text
PENDING
   ↓
CANCELLED
```

The Order Service should not directly perform the entire:

```text
Payment
Inventory
Shipping
Notification
```

via synchronous calls within a single God Service.

---

# 11. Module 7 – Checkout

Checkout is an important business workflow.

Example:

```text
Customer
   ↓
Checkout
   ↓
Validate Cart
   ↓
Check Inventory
   ↓
Create Order
   ↓
Reserve Inventory
   ↓
Payment
   ↓
Confirm Order
   ↓
Create Shipment
```

Checkout must handle error cases.

Example:

```text
Inventory OK
     ↓
Payment FAILED
```

We cannot let the inventory be held forever.

There must be compensation:

```text
Payment Failed
      ↓
Release Inventory
      ↓
Cancel Order
```

---

# 12. Module 8 – Payment Service

The Payment Service is responsible for:

```text
Create Payment
Process Payment
Refund
Payment Status
```

It may support:

```text
Stripe
VNPay
MoMo
PayPal
```

Should not hard-code:

```text
if provider == "Stripe"
   ...
else if provider == "VNPay"
   ...
else if provider == "MoMo"
   ...
```

Instead, use an abstraction:

```text
interface IPaymentProvider
{
    ProcessPayment();
    Refund();
}
```

Providers:

```text
StripeProvider
VNPayProvider
MoMoProvider
PayPalProvider
```

---

# 13. Module 9 – Shipping Service

The Shipping Service manages:

```text
Shipment
Address
ShippingMethod
TrackingNumber
ShippingStatus
```

It may support:

```text
GHN
GHTK
Viettel Post
DHL
FedEx
```

Architecture:

```text
Shipping Service
       |
       +--- GHN Adapter
       +--- GHTK Adapter
       +--- DHL Adapter
```

Adding a new provider should not require modifying the Order Service.

---

# 14. Module 10 – Notification Service

The Notification Service handles:

```text
Email
SMS
Push Notification
```

Example events:

```text
OrderCreated
PaymentCompleted
PaymentFailed
OrderShipped
OrderDelivered
```

Architecture:

```text
Order Service
     |
     | OrderCreated
     v
Message Broker
     |
     v
Notification Service
     |
     +---- Email Provider
     +---- SMS Provider
     +---- Push Provider
```

The Order Service should not directly call an email provider.

---

# 15. Module 11 – Review & Rating

Customers can:

```text
Create Review
Update Review
Delete Review
Rate Product
```

Example:

```text
Product
   |
   +--- Reviews
   +--- Rating
```

It may publish an event:

```text
ReviewCreated
```

so that Analytics or the Recommendation Service can process it.

---

# 16. Module 12 – Promotion & Coupon

The Promotion Service manages:

```text
Coupon
Discount
Promotion
Campaign
```

Example:

```text
SAVE10
-10%

FREESHIP
Free shipping

BLACKFRIDAY
-30%
```

Business rules:

```text
Coupon valid?
Customer eligible?
Expiration?
Minimum order?
Usage limit?
```

The entire promotion logic should not be placed inside the Order Service.

---

# 17. API Gateway

The frontend should not call all services directly:

```text
Frontend
  ├── Product
  ├── Order
  ├── Payment
  ├── Inventory
  ├── User
  └── Shipping
```

Instead:

```text
Frontend
    ↓
API Gateway
    ↓
Microservices
```

The Gateway may handle:

- Routing.
- Authentication.
- Rate limiting.
- Request logging.
- Correlation ID.
- Aggregation if needed.

Options to research:

```text
YARP
Ocelot
NGINX
Kong
```

---

# 18. Communication Between Services

There are two types of communication.

## 18.1 Synchronous

Example:

```text
Frontend
   ↓ HTTP
API Gateway
   ↓ HTTP
Product Service
```

Suitable for requests that need an immediate response.

## 18.2 Asynchronous

Example:

```text
Order Service
      ↓
OrderCreated
      ↓
RabbitMQ / Kafka
      ↓
Inventory Service
Payment Service
Notification Service
```

Suitable for:

- Event propagation.
- Background processing.
- Decoupling.
- High throughput.

---

# 19. Message Broker

We may use:

```text
RabbitMQ
```

or:

```text
Kafka
```

Examples:

```text
OrderCreated
PaymentCompleted
InventoryReserved
InventoryReleased
ShipmentCreated
OrderCancelled
```

The team must explain:

> Why choose RabbitMQ or Kafka?

Do not use a message broker just to make the system "look like microservices".

---

# 20. Event-Driven Architecture

A flow:

```text
Customer
   ↓
Order Service
   ↓
OrderCreated
   ↓
Message Broker
   ├───────────────┐
   ↓               ↓
Inventory       Notification
   ↓
InventoryReserved
   ↓
Payment
```

The service receiving an event does not need to know where the publishing service is located.

This reduces coupling.

---

# 21. Saga Pattern

The order workflow can be handled with a Saga.

Example:

```text
Create Order
    ↓
Reserve Inventory
    ↓
Process Payment
    ↓
Create Shipment
```

If Payment fails:

```text
Payment Failed
      ↓
Release Inventory
      ↓
Cancel Order
```

This is compensation.

There are two approaches:

```text
Choreography Saga
```

and:

```text
Orchestration Saga
```

The team must explain the choice.

---

# 22. Outbox Pattern

A problem:

```text
Database Transaction
        +
Publish Event
```

Example:

```text
Save Order
Publish OrderCreated
```

If:

```text
Save Order = SUCCESS
Publish Event = FAILED
```

the database has the order but the system has no event.

Outbox Pattern:

```text
Order DB
   |
   +--- Orders
   |
   +--- OutboxMessages
             |
             v
       Message Publisher
             |
             v
       Message Broker
```

The database transaction saves:

```text
Order
+
Outbox Event
```

in the same transaction.

---

# 23. Idempotency

Distributed systems can send duplicate events.

Example:

```text
PaymentCompleted
PaymentCompleted
PaymentCompleted
```

The Payment Service must not:

```text
charge
charge
charge
```

A request has:

```text
Idempotency-Key: abc-123
```

The service must ensure that the same key does not produce multiple side effects.

It can store:

```text
IdempotencyKey
RequestHash
Response
CreatedAt
```

---

# 24. Distributed Transaction

Should not:

```text
BEGIN TRANSACTION

Order DB
Inventory DB
Payment DB
Shipping DB

COMMIT
```

because the databases belong to different services.

Instead:

```text
Order
 ↓
Saga
 ↓
Inventory
 ↓
Payment
 ↓
Shipping
```

and use compensation when needed.

---

# 25. Database per Service

Each service owns its own database:

```text
Identity Service
   ↓
Identity DB

Product Service
   ↓
Product DB

Order Service
   ↓
Order DB

Inventory Service
   ↓
Inventory DB
```

Should not:

```text
Order Service
      ↓
Product DB
Inventory DB
Payment DB
```

A service should only access the database it owns.

---

# 26. Caching

Redis can be used for:

```text
Product Cache
Session
Cart
Rate Limit
Distributed Lock
Idempotency
```

Example:

```text
GET /products/123
       ↓
Redis
       |
   cache hit
       ↓
    Response

cache miss
       ↓
Product DB
       ↓
Redis
```

The team needs to research:

- Cache Aside.
- TTL.
- Cache invalidation.
- Cache stampede.

---

# 27. Search

Product search may use:

```text
Elasticsearch / OpenSearch
```

Example:

```text
Search:
"iphone 17 pro"
```

It may support:

- Full-text search.
- Fuzzy search.
- Filter.
- Sorting.
- Price range.
- Category.
- Brand.

---

# 28. Recommendation Service

A simple recommendation can be built:

```text
User
 ↓
Purchase History
 ↓
Product Similarity
 ↓
Recommendation
```

Example:

```text
Customer bought:
Laptop

Recommend:
Mouse
Keyboard
Monitor
Laptop Bag
```

Recommendation is not a mandatory part of the MVP.

---

# 29. Eventual Consistency

Example:

```text
Product Service
Price = 100
```

A ProductUpdated event is published.

The Search Service may update later:

```text
Product DB
   ↓
Event
   ↓
Search Index
```

For a short period:

```text
Product DB = 100
Search Index = 90
```

This is eventual consistency.

The team must identify:

- Which data requires strong consistency?
- Which data can accept eventual consistency?

---

# 30. Reliability

Services must handle failure.

Example:

```text
Order
 ↓
Payment
 ↓
Timeout
```

We can use:

```text
Timeout
Retry
Circuit Breaker
Bulkhead
Fallback
```

Do not retry indefinitely.

Example:

```text
Retry 1
Retry 2
Retry 3
      ↓
Dead Letter / Failed
```

---
# 31. Distributed Lock

Some operations may require a lock.

Example:

```text
Stock = 1

Request A
Request B
```

We can use:

```text
Database optimistic concurrency
```

or in some cases:

```text
Redis Distributed Lock
```

The team must explain why a lock is needed and why a particular method is chosen.

---

# 32. Observability

The system must have:

```text
Logs
Metrics
Traces
```

Example:

```text
POST /orders
TraceId: abc123
```

Trace:

```text
Gateway       10ms
Order         25ms
Inventory     40ms
Payment       250ms
Notification  15ms
```

It is possible to use:

```text
OpenTelemetry
Prometheus
Grafana
Jaeger
ELK/OpenSearch
```

---

# 33. Security

Issues that must be addressed:

- Authentication.
- Authorization.
- JWT.
- OAuth2/OIDC.
- Password hashing.
- HTTPS.
- CORS.
- Rate limiting.
- Input validation.
- Secret management.
- Service-to-service authentication.

Do not store:

```text
Plain text password
```

Do not commit:

```text
DATABASE_PASSWORD
JWT_SECRET
PAYMENT_SECRET
```

to Git.

---

# 34. Complete Order Flow

A sample flow:

```text
Customer
   |
   | POST /checkout
   v
API Gateway
   |
   v
Order Service
   |
   | Create Order
   v
Order DB
   |
   | OrderCreated
   v
Message Broker
   |
   v
Inventory Service
   |
   | Reserve
   v
Inventory DB
   |
   | InventoryReserved
   v
Payment Service
   |
   | Charge
   v
Payment Provider
   |
   | PaymentCompleted
   v
Order Service
   |
   | Confirm
   v
Shipping Service
   |
   | Create Shipment
   v
Notification Service
```

---

# 35. Failure Scenario 1 � Payment Failed

```text
OrderCreated
     ?
InventoryReserved
     ?
PaymentFailed
     ?
ReleaseInventory
     ?
CancelOrder
```

The customer receives:

```text
Order cancelled because payment failed.
```

---

# 36. Failure Scenario 2 � Inventory Failed

```text
OrderCreated
     ?
InventoryReservationFailed
     ?
CancelOrder
```

Payment has not been charged yet.

---

# 37. Failure Scenario 3 � Payment succeeds but Order Service crashes

Example:

```text
PaymentCompleted
      ?
Order Service DOWN
```

The event must not be lost.

When the Order Service comes back up:

```text
Message Broker
      ?
Order Service
      ?
Process PaymentCompleted
```

Therefore, message durability and consumer recovery are very important.

---

# 38. Failure Scenario 4 � Duplicate Event

```text
PaymentCompleted
PaymentCompleted
```

The Order Service must handle it idempotently.

```text
if event already processed
    ignore
else
    process
```

It is possible to use:

```text
ProcessedEvents
```

---

# 39. Failure Scenario 5 � Redis Down

If Redis fails:

```text
Product Cache
     ?
Redis DOWN
```

The Product Service must still be able to access the database.

Do not let:

```text
Redis DOWN
   ?
Entire E-Commerce DOWN
```

---

# 40. Failure Scenario 6 � Payment Provider Down

```text
Payment Service
      ?
Stripe
      ?
Timeout
```

Possible handling:

```text
Retry
 ?
Retry
 ?
Circuit Open
 ?
Payment Pending
```

The customer is not charged multiple times.

---

# 41. Extensibility � Payment Provider

Initially:

```text
Stripe
```

Later, requirement:

```text
VNPay
```

Good architecture:

```text
IPaymentProvider
      |
      +--- StripeProvider
      +--- VNPayProvider
      +--- MoMoProvider
```

The Payment Service does not need to be rewritten.

---

# 42. Extensibility � Shipping Provider

Initially:

```text
GHN
```

Later:

```text
GHTK
```

Add:

```text
GHTKAdapter
```

and register the provider.

The upstream services do not need to know the specific implementation.

---

# 43. Extensibility � Notification Provider

May support:

```text
Email
SMS
Push
```

Architecture:

```text
INotificationProvider
        |
   +----+----+
   |    |    |
 Email SMS Push
```

---

# 44. Scalability Scenario

Suppose:

```text
100 orders/sec
```

The Order Service needs to scale:

```text
Order Worker 1
Order Worker 2
Order Worker 3
Order Worker 4
```

If the back-end uses a queue:

```text
               Queue
                 |
       +---------+---------+
       |         |         |
    Worker 1  Worker 2  Worker 3
```

Workers can be scaled independently.

---

# 45. High Traffic Scenario

Black Friday:

```text
Normal:
1,000 requests/sec

Black Friday:
50,000 requests/sec
```

We do not necessarily scale the entire system.

Example:

```text
Product Service   ? 20 instances
Search Service    ? 15 instances
Cart Service      ? 10 instances
Order Service     ? 15 instances
Payment Service   ? 5 instances
```

This is an important benefit of microservices.

---

# 46. Background Job Processing

Operations that do not need an immediate response can be put into a queue:

```text
Generate Invoice
Send Email
Process Image
Update Search Index
Generate Recommendation
Analytics
```

Example:

```text
OrderCreated
     ?
Queue
     ?
Invoice Worker
```

---

# 47. Event Catalog

Some events that can be defined:

```text
UserRegistered
ProductCreated
ProductUpdated
CartUpdated

OrderCreated
OrderCancelled
OrderConfirmed

InventoryReserved
InventoryReleased
InventoryReservationFailed

PaymentStarted
PaymentCompleted
PaymentFailed
PaymentRefunded

ShipmentCreated
ShipmentShipped
ShipmentDelivered

ReviewCreated
CouponApplied
```

Each event should have:

```text
EventId
EventType
OccurredAt
CorrelationId
CausationId
Version
Payload
```

---

# 48. Correlation ID

An order:

```text
OrderId = ORD-123
```

may pass through:

```text
Gateway
Order
Inventory
Payment
Shipping
Notification
```

All logs should contain:

```text
CorrelationId
OrderId
TraceId
```

to help debug distributed systems.

---

# 49. Versioning

APIs and events need versioning.

Example:

```text
OrderCreated.v1
OrderCreated.v2
```

We should not change an event contract in a breaking way without a migration strategy.

Topics to research:

- Backward compatibility.
- Schema evolution.
- Consumer-driven contract testing.

---

# 50. Testing Strategy

The system needs many types of tests.

## Unit Test

Test:

```text
Order business rules
Payment rules
Inventory rules
Coupon rules
```

## Integration Test

Test:

```text
Service + Database
Service + Redis
Service + Message Broker
```

## Contract Test

Check that:

```text
Producer
     ?
Consumer
```

share the same contract.

## End-to-End Test

Example:

```text
Login
 ?
Browse Product
 ?
Add Cart
 ?
Checkout
 ?
Payment
 ?
Order Confirmed
```

---

# 51. Anti-pattern � God Service

Do not:

```text
ECommerceService
   |
   +-- User
   +-- Product
   +-- Cart
   +-- Order
   +-- Payment
   +-- Inventory
   +-- Shipping
   +-- Email
```

A single service should not contain all business logic.

---

# 52. Anti-pattern � Shared Database

Do not:

```text
Order Service
       |
       +----------+
       |          |
Product DB    Inventory DB
```

Other services should not directly access each other's databases.

Instead:

```text
Order Service
      |
      | API/Event
      v
Inventory Service
      |
Inventory DB
```

---

# 53. Anti-pattern � Distributed Monolith

Microservices do not mean:

```text
Service A
   ?
Service B
   ?
Service C
   ?
Service D
   ?
Service E
```

where everything must operate synchronously.

If one service goes down, the entire system goes down � that may be a distributed monolith.

The team must explain the trade-off between:

```text
Synchronous Communication
```

and:

```text
Asynchronous Communication
```

---

# 54. Anti-pattern � Too Many Services

Do not split:

```text
Price Service
ProductName Service
ProductDescription Service
```

just to have more microservices.

Service boundaries should be based on:

- Business capability.
- Data ownership.
- Change frequency.
- Scalability.
- Team ownership.

---

# 55. Anti-pattern � Shared Business Logic

Do not copy:

```text
CalculateOrderTotal()
```

into:

```text
Order Service
Payment Service
Invoice Service
```

with a different implementation in each place.

Business ownership must be clear.

---

# 56. MVP

The minimum MVP must have:

## Identity

- Register.
- Login.
- JWT.

## Product

- Product CRUD.
- Category.
- Product detail.

## Cart

- Add item.
- Remove item.
- Update quantity.

## Order

- Create order.
- Order history.
- Order status.

## Inventory

- Stock.
- Reservation.

## Payment

- Mock payment provider.
- Payment success/failure.

## Communication

- REST/gRPC for synchronous communication.
- RabbitMQ or Kafka for asynchronous communication.

## Architecture

- API Gateway.
- Database per Service.
- Docker.

## Reliability

- Idempotency.
- Retry.
- Timeout.

## Observability

- Centralized logging.
- Correlation ID.

---

# 57. Extensions

Teams may extend:

## Infrastructure

```text
Kubernetes
Terraform
CI/CD
Service Mesh
```

## Messaging

```text
Kafka
RabbitMQ
Dead Letter Queue
Event Replay
```

## Data

```text
Redis
Elasticsearch
Read Replica
Database Sharding
```

## Architecture

```text
CQRS
Event Sourcing
Saga
Outbox
```

## Business

```text
Recommendation
Promotion
Wishlist
Gift Card
Subscription
Marketplace
Multi-vendor
```

## Security

```text
OAuth2
OpenID Connect
API Key
Rate Limiting
mTLS
```

---

# 58. Architecture Scenario � Add Payment Provider

The instructor requires:

> The system currently supports Stripe. Add VNPay.

Good architecture:

```text
IPaymentProvider
       |
       +--- StripeProvider
       +--- VNPayProvider
```

We only need:

```text
VNPayProvider
```

and registration.

No need to modify:

```text
Order Service
Inventory Service
Frontend
Shipping Service
```

---

# 59. Architecture Scenario � Replace Message Broker

Currently:

```text
RabbitMQ
```

The instructor requires:

```text
Kafka
```

If the architecture is good:

```text
IEventBus
    |
    +--- RabbitMQEventBus
    +--- KafkaEventBus
```

Business logic does not depend directly on the RabbitMQ implementation.

The team must explain whether this abstraction is truly necessary and its trade-offs.

---

# 60. Architecture Scenario � Scale Orders

Suppose:

```text
1 Worker
2 seconds / order
```

10,000 orders would require a very large amount of time.

Architecture with a queue:

```text
             Order Queue
                  |
       +----------+----------+
       |          |          |
    Worker 1   Worker 2   Worker 3
       |          |          |
       +----------+----------+
                  |
              Order DB
```

We can increase:

```text
3 ? 10 ? 50 workers
```

without changing business logic.

---
# 61. Architecture Scenario � Product Search

Initially:

```text
Product DB
```

Later, we need:

```text
Elasticsearch
```

Flow:

```text
ProductUpdated
      ?
Message Broker
      ?
Search Indexer
      ?
Elasticsearch
```

The Product Service still owns the product data.

The Search Service owns the search index.

---

# 62. Architecture Scenario � Payment Failure

The instructor requires:

> The payment provider times out after Inventory has reserved.

The system must:

```text
OrderCreated
      ?
InventoryReserved
      ?
PaymentTimeout
      ?
Retry
      ?
PaymentFailed
      ?
ReleaseInventory
      ?
CancelOrder
```

The team must explain:

- Saga.
- Compensation.
- Idempotency.
- Retry.
- Timeout.

---

# 63. Architecture Scenario � Duplicate Payment Event

Suppose:

```text
PaymentCompleted
PaymentCompleted
```

The Payment Service or Order Service must not create duplicate side effects.

Must have:

```text
EventId
ProcessedEvent
IdempotencyKey
```

---

# 64. Architecture Scenario � Service Down

The instructor turns off:

```text
Notification Service
```

Requirement:

> The user must still be able to checkout.

Good architecture:

```text
Order
 ?
OrderCreated
 ?
Message Broker
 ?
Notification Service
```

A notification failure must not roll back the order if the business requirement allows notifications to be eventual.

---

# 65. Architecture Scenario � Database Down

Example:

```text
Payment DB DOWN
```

The Payment Service needs to:

```text
Fail gracefully
```

It should not crash the entire API Gateway.

The team must present:

- Timeout.
- Circuit Breaker.
- Health Check.
- Retry.
- Recovery.

---

# 66. A Complete Flow of the System

Example: a customer buys a product.

### Step 1

Customer:

```text
POST /cart/items
```

### Step 2

Customer:

```text
POST /checkout
```

### Step 3

Order Service creates:

```text
Order #1001
```

### Step 4

Publish:

```text
OrderCreated
```

### Step 5

Inventory:

```text
Reserve Product
```

### Step 6

Publish:

```text
InventoryReserved
```

### Step 7

Payment:

```text
Process Payment
```

### Step 8

Publish:

```text
PaymentCompleted
```

### Step 9

Order:

```text
CONFIRMED
```

### Step 10

Shipping:

```text
ShipmentCreated
```

### Step 11

Notification:

```text
Order confirmed.
```

---

# 67. Demo Scenario

A good demo can go like this.

### Step 1

Login:

```text
User ? API Gateway ? Identity Service
```

### Step 2

Browse:

```text
User ? Product Service
```

### Step 3

Search:

```text
"laptop gaming"
```

### Step 4

Add cart:

```text
Product ? Cart
```

### Step 5

Checkout:

```text
Cart
 ?
Order
```

### Step 6

Screen displays:

```text
Order #1001
Status: PENDING
```

### Step 7

Inventory:

```text
RESERVED
```

### Step 8

Payment:

```text
SUCCESS
```

### Step 9

Order:

```text
CONFIRMED
```

### Step 10

Shipping:

```text
SHIPMENT_CREATED
```

### Step 11

Notification:

```text
Email sent
```

### Step 12

Open observability dashboard:

```text
Trace ID
Order ID
Service latency
Events
Errors
```

---

# 68. Database Design

Each service owns its own data.

Example:

```text
Identity DB
----------------
Users
Roles
RefreshTokens

Product DB
----------------
Products
Categories
Brands
ProductImages

Cart DB / Redis
----------------
Carts
CartItems

Order DB
----------------
Orders
OrderItems
OrderStatusHistory
OutboxMessages

Inventory DB
----------------
Stocks
Reservations

Payment DB
----------------
Payments
Transactions
Refunds

Shipping DB
----------------
Shipments
TrackingEvents

Review DB
----------------
Reviews
Ratings
```

---

# 69. Reproducibility

An Order must know exactly:

```text
OrderId
CustomerId
ProductId
Price
Quantity
Discount
Tax
ShippingFee
PaymentMethod
```

We should not only reference the Product Service to get the current price.

Example:

```text
Product price today = $1,200
```

but the order was created when:

```text
Price = $1,000
```

The Order must store the appropriate snapshot.

---

# 70. API Versioning

We may use:

```text
/api/v1/products
/api/v1/orders
```

Later:

```text
/api/v2/products
```

API contracts must have a backward compatibility strategy.

---

# 71. CI/CD

Suggested pipeline:

```text
Developer
    ?
Git Push
    ?
CI
    ?
Build
    ?
Unit Tests
    ?
Integration Tests
    ?
Contract Tests
    ?
Docker Build
    ?
Security Scan
    ?
Deploy
```

May use:

```text
GitHub Actions
GitLab CI
Azure DevOps
Jenkins
```

---

# 72. Containerization

Each service can be packaged as a Docker image:

```text
identity-service
product-service
cart-service
order-service
inventory-service
payment-service
shipping-service
notification-service
```

Local development:

```text
Docker Compose
```

Production extension:

```text
Kubernetes
```

---

# 73. Health Check

Each service should have:

```text
GET /health
```

It may distinguish:

```text
Liveness
Readiness
```

Example:

```text
Product Service
    |
    +-- API healthy
    +-- Database healthy
```

Not every dependency failure should be treated as a process failure if the business requirement does not require it.

---

# 74. Metrics

Metrics that can be monitored:

```text
HTTP Request Count
HTTP Error Rate
Request Latency
Orders/sec
Payment Success Rate
Inventory Reservation Failure Rate
Queue Depth
Consumer Lag
Database Connection Pool
Cache Hit Rate
```

---

# 75. Central Architectural Questions

In the report, the team must answer:

1. Why choose microservices?
2. How are service boundaries determined?
3. Why are Order and Inventory two different services?
4. Which service owns which data?
5. When to use REST?
6. When to use asynchronous messaging?
7. Why use RabbitMQ or Kafka?
8. How is the Saga designed?
9. If payment fails, what is the compensation?
10. How to prevent duplicate events?
11. How to ensure the Outbox does not lose events?
12. What happens if Redis goes down?
13. What happens if the Payment Provider goes down?
14. How to scale the Order Service?
15. How to trace a request across multiple services?
16. How to add a payment provider?
17. How to add a shipping provider?
18. How to replace the message broker?
19. How to ensure backward compatibility?
20. How to deploy multiple instances?
21. Why not use a shared database?
22. How to avoid a distributed monolith?
23. Which service needs strong consistency?
24. Which service can have eventual consistency?
25. How to test distributed workflows?

---

# 76. Deliverables

The team must submit:

## 1. Source Code

A complete repository.

## 2. README

Including:

```text
Installation
Configuration
Run locally
Docker
API
Architecture
Testing
Demo
```

## 3. Architecture Document

Minimum:

```text
System Context
Container Diagram
Service Boundaries
Component Diagram
Data Flow
Order Flow
Payment Flow
Saga Flow
Event Flow
Deployment Diagram
```

## 4. ADR

Example:

```text
ADR-001 � Why Microservices?
ADR-002 � Why Database per Service?
ADR-003 � Why RabbitMQ/Kafka?
ADR-004 � Why Saga?
ADR-005 � Why Outbox?
ADR-006 � Why Redis?
ADR-007 � Why API Gateway?
ADR-008 � Why Elasticsearch?
```

## 5. Testing Report

Including:

```text
Unit Tests
Integration Tests
Contract Tests
E2E Tests
Failure Tests
Load Tests
```

## 6. Demo

Must demonstrate:

```text
Login
Product
Cart
Checkout
Inventory
Payment
Order
Shipping
Notification
Event flow
Failure recovery
Observability
```

---

# 77. MVP Checklist

```text
[ ] Identity Service
[ ] Product Service
[ ] Cart Service
[ ] Order Service
[ ] Inventory Service
[ ] Payment Service
[ ] Notification Service

[ ] API Gateway
[ ] Database per Service
[ ] Docker
[ ] Message Broker

[ ] OrderCreated Event
[ ] InventoryReserved Event
[ ] PaymentCompleted Event
[ ] PaymentFailed Event

[ ] Saga
[ ] Idempotency
[ ] Outbox

[ ] Redis
[ ] Logging
[ ] Correlation ID
[ ] Health Check

[ ] Unit Test
[ ] Integration Test
[ ] E2E Test
```

---

# 78. Advanced Extensions

If the MVP is completed, we may research:

```text
Kubernetes
Terraform
Service Mesh
CQRS
Event Sourcing
Kafka
Redis Cluster
Elasticsearch
Read Replica
Sharding
Distributed Tracing
OpenTelemetry
Prometheus
Grafana
GitHub Actions
Blue-Green Deployment
Canary Deployment
Feature Flags
```

Business extensions:

```text
Multi-vendor Marketplace
Recommendation
Flash Sale
Auction
Subscription
Gift Card
Loyalty
Wishlist
Multi-currency
Multi-language
```

---

# 79. Flash Sale � Advanced Scenario

A product:

```text
Stock = 100
```

Traffic:

```text
100,000 users
```

buying at the same time.

The architecture must handle:

```text
100,000 requests
       ?
API Gateway
       ?
Queue
       ?
Inventory Workers
       ?
Atomic Reservation
```

Must not sell:

```text
Stock < 0
```

This is a good scenario to evaluate:

- Concurrency.
- Queue.
- Backpressure.
- Rate limiting.
- Inventory consistency.

---

# 80. Multi-vendor Marketplace

Extension:

```text
Customer
   ?
Marketplace
   ?
Seller A
Seller B
Seller C
```

An order may contain:

```text
Seller A products
Seller B products
```

Needs to research:

```text
Order splitting
Seller settlement
Shipping per seller
Payment distribution
```

This is a more complex distributed system problem.

---

# 81. The Ultimate Meaning of the Project

Do not understand the project as:

> Building a shopping website with many backend projects.

But understand it as:

> Designing a distributed system in which business capabilities can change, scale, deploy, and fail independently while the entire system still maintains correctness.

Example: today the system has:

```text
Stripe
```

tomorrow it has:

```text
VNPay
```

but:

```text
Order Service
Inventory Service
Frontend
```

do not need to be rewritten.

Today it uses:

```text
RabbitMQ
```

tomorrow we may research:

```text
Kafka
```

without business logic depending directly on it.

Today it has:

```text
1 Order Worker
```

tomorrow:

```text
50 Order Workers
```

while the architecture remains the same.

---

# 82. The Nature of the Project

The project is a combination of:

```text
Microservices
       +
Distributed Systems
       +
Event-Driven Architecture
       +
Database per Service
       +
Saga
       +
Outbox
       +
Caching
       +
API Gateway
       +
Observability
       +
Security
       +
CI/CD
```

Central flow:

```text
Request
   ?
API Gateway
   ?
Service
   ?
Database
   ?
Event
   ?
Message Broker
   ?
Other Services
   ?
Eventual Consistency
```

The ultimate goal is to demonstrate that:

```text
Business Requirement
        ?
Service Boundary
        ?
Independent Deployment
        ?
Asynchronous Communication
        ?
Failure Handling
        ?
Observability
        ?
Scalability
```

can be designed in a systematic way.

---

# 83. Architecture Evaluation Criteria

A good architecture must demonstrate:

### Modifiability

Add a new service/provider with minimal changes.

### Scalability

Each service can be scaled independently.

### Reliability

A dependency failure does not cause the whole system to collapse.

### Consistency

Has a clear strategy for distributed transactions.

### Maintainability

Business logic is divided by business capability.

### Testability

Services can be tested independently.

### Observability

Can determine where a request/event is failing.

### Security

Authentication and authorization are designed at the correct boundary.

### Deployment

Services can be built and deployed independently.

---

# 84. Final Demo

Suggested final demo:

```text
1. Login
       ?
2. Browse products
       ?
3. Search product
       ?
4. Add to cart
       ?
5. Checkout
       ?
6. Create Order
       ?
7. Reserve Inventory
       ?
8. Process Payment
       ?
9. Confirm Order
       ?
10. Create Shipment
       ?
11. Send Notification
       ?
12. Show distributed trace
```

Then demonstrate failure:

```text
Payment Provider DOWN
       ?
Timeout
       ?
Retry
       ?
Payment Failed
       ?
Release Inventory
       ?
Cancel Order
```

Finally, demonstrate scalability:

```text
1 Worker
   ?
10 Workers
   ?
50 Workers
```

and prove that the system can scale without changing the business workflow.

---

# 85. Conclusion

The goal of the project is not to prove that:

> "Microservices are better than monoliths in every case."

But to prove that the team understands:

- When microservices are appropriate.
- How to determine service boundaries.
- How to manage data ownership.
- How services communicate.
- How to handle distributed transactions.
- How to handle failure.
- How to scale.
- How to observe.
- How to test.
- How to deploy.
- The trade-offs of each architectural decision.

A good system is not the one with the most technologies.

A good system is the one where each architectural decision solves a real problem and can be clearly explained:

```text
Problem
   ?
Constraint
   ?
Architectural Decision
   ?
Trade-off
   ?
Implementation
   ?
Measurement
```

That is the main goal of the E-Commerce Microservices Platform project.
