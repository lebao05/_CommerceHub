# FINAL PROJECT

# E-Commerce Microservices Platform – Distributed E-Commerce Platform

## 1. Problem Context

Modern e-commerce systems must serve large numbers of users, products, orders, and payment transactions. The system must remain stable even when some components fail, while also being able to scale individual components independently according to workload.

A monolithic system can start simply:

```text
Frontend
   ↓
E-Commerce Application
   ↓
Database
```

However, as the system grows, a single application may have to handle:

* Authentication
* Product Catalog
* Search
* Cart
* Order
* Inventory
* Payment
* Shipping
* Notification
* Review
* Recommendation

This leads to high coupling, makes independent scaling difficult, and causes a small change to potentially affect the entire system.

Therefore, the main question of this project is:

> Can we build an E-Commerce Platform using a microservices architecture, where business capabilities can be developed, deployed, scaled, and changed independently while the system still ensures consistency, reliability, security, and observability?

The main focus of this project is **Software Architecture and Distributed Systems**, not simply building an online shopping website.

---

# 2. Overall Objectives

Build an E-Commerce Platform capable of:

* Managing users and authentication.
* Managing products.
* Managing product categories.
* Searching for products.
* Managing shopping carts.
* Creating and managing orders.
* Managing inventory.
* Processing payments.
* Managing shipping.
* Sending notifications.
* Managing reviews and ratings.
* Supporting promotions/coupons.
* Using a message broker for asynchronous communication.
* Handling distributed transactions.
* Supporting the Saga Pattern.
* Supporting the Outbox Pattern.
* Handling duplicate events using idempotency.
* Using Redis for caching.
* Providing an API Gateway.
* Using Database per Service.
* Supporting distributed tracing.
* Providing logging and monitoring.
* Scaling services independently.
* Adding new providers without requiring major changes to existing services.

---

# 3. Overall Example

Users access:

```text
E-Commerce Platform
```

They can:

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

This is only a reference architecture. The team may propose a different architecture if the reasons can be clearly explained.

---

# 4. Architectural Drivers

The project must focus on solving the following architectural drivers.

## 4.1 Modifiability

The system should be able to add:

```text
PayPal
Stripe
VNPay
MoMo
```

without modifying the entire Order Service.

## 4.2 Scalability

For example:

```text
Product Service: 2 instances
Order Service: 10 instances
Payment Service: 5 instances
```

Each service can be scaled independently.

## 4.3 Reliability

If the Payment Service fails:

```text
Order
  ↓
Payment
  ↓
Timeout
```

the system should provide:

* Retry.
* Timeout.
* Circuit Breaker.
* Compensation.
* Dead Letter Queue where appropriate.

## 4.4 Consistency

An order may involve multiple services:

```text
Order
Inventory
Payment
Shipping
```

A single database transaction cannot simply be used across the entire system.

The team needs to study:

* Eventual Consistency.
* Saga.
* Transactional Outbox.
* Idempotency.

## 4.5 Performance

Operations such as:

```text
Product Search
Product Detail
Category Listing
```

may receive a very large number of requests.

The team should study:

* Redis.
* Database indexing.
* Read optimization.
* Search engine.
* CDN if necessary.

## 4.6 Observability

The system should provide:

```text
Request ID
Trace ID
Order ID
Service
Latency
Error
Event
```

A request such as:

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

Possible technologies include:

```text
OpenTelemetry
Prometheus
Grafana
ELK/OpenSearch
```

---

# 5. Module 1 – Identity & Authentication Service

The Identity Service is responsible for:

* Registration.
* Login.
* Logout.
* Password management.
* Access tokens.
* Refresh tokens.
* Roles.
* Permissions.

Examples:

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
```

Product Service or Order Service should not manage passwords independently.

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

Possible topics to study:

* JWT.
* OAuth2.
* OpenID Connect.
* Role-Based Access Control.

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

The Product Service should not directly access the Order Service database.

---

# 7. Module 3 – Search Service

The Search Service is responsible for:

```text
Search products
Filter
Sort
Autocomplete
```

Possible technology:

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

When a product changes, the Search Service updates its index.

The Product Service does not need to know the internal implementation of the Search Service.

---

# 8. Module 4 – Cart Service

The Cart Service manages:

```text
Cart
CartItem
Quantity
ProductId
PriceSnapshot
```

Examples:

```text
POST /cart/items
PUT /cart/items/{id}
DELETE /cart/items/{id}
GET /cart
```

The cart can use Redis because its data:

* changes frequently;
* requires fast responses;
* may have expiration.

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

If the operation is not handled correctly, both customers may purchase the same product.

The team should study:

* Optimistic Concurrency.
* Pessimistic Lock.
* Atomic update.
* Reservation.
* Idempotency.

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

Order states may be:

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

The Order Service should not directly perform all:

```text
Payment
Inventory
Shipping
Notification
```

through synchronous calls inside a single God Service.

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

Checkout must handle failure scenarios.

For example:

```text
Inventory OK
     ↓
Payment FAILED
```

Inventory cannot remain reserved forever.

Compensation is required:

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

The system should not hard-code:

```text
if provider == "Stripe"
   ...
else if provider == "VNPay"
   ...
else if provider == "MoMo"
   ...
```

Instead, an abstraction can be used:

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

The service may publish:

```text
ReviewCreated
```

so that Analytics or Recommendation Services can process it.

---

# 16. Module 12 – Promotion & Coupon

The Promotion Service manages:

```text
Coupon
Discount
Promotion
Campaign
```

Examples:

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

Promotion logic should not be placed entirely inside the Order Service.

---

# 17. API Gateway

The frontend should not directly call every service:

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

The Gateway can handle:

* Routing.
* Authentication.
* Rate limiting.
* Request logging.
* Correlation ID.
* Aggregation where necessary.

Possible technologies:

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

Suitable when an immediate response is required.

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

* Event propagation.
* Background processing.
* Decoupling.
* High throughput.

---

# 19. Message Broker

The system can use:

```text
RabbitMQ
```

or:

```text
Kafka
```

Example events:

```text
OrderCreated
PaymentCompleted
InventoryReserved
InventoryReleased
ShipmentCreated
OrderCancelled
```

The team must explain:

> Why was RabbitMQ or Kafka selected?

The message broker must not be used only to make the system "look like microservices."

---

# 20. Event-Driven Architecture

An example flow:

```text
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

A service receiving an event does not need to know where the publishing service is located.

This helps reduce coupling.

---

# 21. Saga Pattern

The order workflow can be handled using a Saga.

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

If payment fails:

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

The team must explain its choice.

---

# 22. Outbox Pattern

A problem:

```text
Database Transaction
        +
Publish Event
```

For example:

```text
Save Order
Publish OrderCreated
```

If:

```text
Save Order = SUCCESS
Publish Event = FAILED
```

the database contains the order, but the system does not have the event.

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

The database transaction stores:

```text
Order
+
Outbox Event
```

within the same transaction.

---

# 23. Idempotency

Distributed systems may deliver duplicate events.

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

A request may contain:

```text
Idempotency-Key: abc-123
```

The service must ensure that the same key does not create multiple side effects.

Possible stored data:

```text
IdempotencyKey
RequestHash
Response
CreatedAt
```

---

# 24. Distributed Transaction

The system should not use:

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

and compensation is used when necessary.

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

The system should not have:

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

The team should study:

* Cache Aside.
* TTL.
* Cache invalidation.
* Cache stampede.

---

# 27. Search

Product search can use:

```text
Elasticsearch / OpenSearch
```

Example:

```text
Search:
"iphone 17 pro"
```

Possible capabilities:

* Full-text search.
* Fuzzy search.
* Filter.
* Sorting.
* Price range.
* Category.
* Brand.

---

# 28. Recommendation Service

A simple recommendation system can be built:

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

Recommendation is not required for the MVP.

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

* Which data requires strong consistency?
* Which data can accept eventual consistency?

---

# 30. Reliability

Services must handle failures.

Example:

```text
Order
 ↓
Payment
 ↓
Timeout
```

Possible mechanisms:

```text
Timeout
Retry
Circuit Breaker
Bulkhead
Fallback
```

Retries should not be infinite.

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

Some operations may require locking.

Example:

```text
Stock = 1

Request A
Request B
```

Possible approaches:

```text
Database optimistic concurrency
```

or, in certain cases:

```text
Redis Distributed Lock
```

The team must explain why locking is needed and why the selected approach is appropriate.

---

# 32. Observability

The system needs:

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

Possible technologies:

```text
OpenTelemetry
Prometheus
Grafana
Jaeger
ELK/OpenSearch
```

---

# 33. Security

Security concerns include:

* Authentication.
* Authorization.
* JWT.
* OAuth2/OIDC.
* Password hashing.
* HTTPS.
* CORS.
* Rate limiting.
* Input validation.
* Secret management.
* Service-to-service authentication.

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

# 35. Failure Scenario 1 – Payment Failed

```text
OrderCreated
     ↓
InventoryReserved
     ↓
PaymentFailed
     ↓
ReleaseInventory
     ↓
CancelOrder
```

The customer receives:

```text
Order cancelled because payment failed.
```

---

# 36. Failure Scenario 2 – Inventory Failed

```text
OrderCreated
     ↓
InventoryReservationFailed
     ↓
CancelOrder
```

Payment has not been charged yet.

---

# 37. Failure Scenario 3 – Payment Succeeds but Order Service Crashes

Example:

```text
PaymentCompleted
      ↓
Order Service DOWN
```

The event must not be lost.

When the Order Service becomes available again:

```text
Message Broker
      ↓
Order Service
      ↓
Process PaymentCompleted
```

Therefore, message durability and consumer recovery are very important.

---

# 38. Failure Scenario 4 – Duplicate Event

```text
PaymentCompleted
PaymentCompleted
```

The Order Service must process events idempotently.

```text
if event already processed
    ignore
else
    process
```

Possible mechanism:

```text
ProcessedEvents
```

---

# 39. Failure Scenario 5 – Redis Down

If Redis fails:

```text
Product Cache
     ↓
Redis DOWN
```

the Product Service should still be able to access the database.

The system should not behave like:

```text
Redis DOWN
   ↓
Entire E-Commerce DOWN
```

---

# 40. Failure Scenario 6 – Payment Provider Down

```text
Payment Service
      ↓
Stripe
      ↓
Timeout
```

Possible flow:

```text
Retry
 ↓
Retry
 ↓
Circuit Open
 ↓
Payment Pending
```

The customer must not be charged multiple times.

---

# 41. Extensibility – Payment Provider

Initially:

```text
Stripe
```

Later, the system requires:

```text
VNPay
```

A good architecture:

```text
IPaymentProvider
      |
      +--- StripeProvider
      +--- VNPayProvider
      +--- MoMoProvider
```

Only:

```text
VNPayProvider
```

and its registration need to be added.

There should be no need to rewrite:

```text
Order Service
Inventory Service
Frontend
Shipping Service
```

---

# 42. Extensibility – Shipping Provider

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

Higher-level services do not need to know the specific implementation.

---

# 43. Extensibility – Notification Provider

The system can support:

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

If the backend uses a queue:

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

During Black Friday:

```text
Normal:
1,000 requests/sec

Black Friday:
50,000 requests/sec
```

It is not necessary to scale the entire system equally.

For example:

```text
Product Service   → 20 instances
Search Service    → 15 instances
Cart Service      → 10 instances
Order Service     → 15 instances
Payment Service   → 5 instances
```

This is an important benefit of microservices.

---

# 46. Background Job Processing

Operations that do not require an immediate response can be placed into a queue:

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
     ↓
Queue
     ↓
Invoice Worker
```

---

# 47. Event Catalog

Possible events include:

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

Each event should contain:

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

This helps debug distributed systems.

---

# 49. Versioning

APIs and events need versions.

Example:

```text
OrderCreated.v1
OrderCreated.v2
```

A breaking change to an event contract should not be introduced without a migration strategy.

Possible topics:

* Backward compatibility.
* Schema evolution.
* Consumer-driven contract testing.

---

# 50. Testing Strategy

The system needs multiple types of testing.

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

Verify that:

```text
Producer
     ↕
Consumer
```

share a compatible contract.

## End-to-End Test

Example:

```text
Login
 ↓
Browse Product
 ↓
Add Cart
 ↓
Checkout
 ↓
Payment
 ↓
Order Confirmed
```

---

# 51. Anti-pattern – God Service

Avoid:

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

# 52. Anti-pattern – Shared Database

Avoid:

```text
Order Service
       |
       +----------+
       |          |
Product DB    Inventory DB
```

where services directly access each other's databases.

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

# 53. Anti-pattern – Distributed Monolith

Microservices do not mean:

```text
Service A
   ↓
Service B
   ↓
Service C
   ↓
Service D
   ↓
Service E
```

where everything must work synchronously.

If one service goes down and the entire system goes down, the architecture may actually be a distributed monolith.

The team must explain the trade-offs between:

```text
Synchronous Communication
```

and:

```text
Asynchronous Communication
```

---

# 54. Anti-pattern – Too Many Services

Do not split:

```text
Price Service
ProductName Service
ProductDescription Service
```

just to have more microservices.

Service boundaries should be based on:

* Business capability.
* Data ownership.
* Change frequency.
* Scalability.
* Team ownership.

---

# 55. Anti-pattern – Shared Business Logic

Do not duplicate:

```text
CalculateOrderTotal()
```

in:

```text
Order Service
Payment Service
Invoice Service
```

with different implementations in each place.

Business ownership must be clearly defined.

---

# 56. MVP

The minimum MVP must include:

## Identity

* Register.
* Login.
* JWT.

## Product

* Product CRUD.
* Category.
* Product detail.

## Cart

* Add item.
* Remove item.
* Update quantity.

## Order

* Create order.
* Order history.
* Order status.

## Inventory

* Stock.
* Reservation.

## Payment

* Mock payment provider.
* Payment success/failure.

## Communication

* REST/gRPC for synchronous communication.
* RabbitMQ or Kafka for asynchronous communication.

## Architecture

* API Gateway.
* Database per Service.
* Docker.

## Reliability

* Idempotency.
* Retry.
* Timeout.

## Observability

* Centralized logging.
* Correlation ID.

---

# 57. Extensions

Teams can extend the project with:

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

# 58. Architecture Scenario – Add Payment Provider

The lecturer asks:

> The system currently supports Stripe. Add VNPay.

Good architecture:

```text
IPaymentProvider
       |
       +--- StripeProvider
       +--- VNPayProvider
```

Only:

```text
VNPayProvider
```

and its registration are required.

There is no need to modify:

```text
Order Service
Inventory Service
Frontend
Shipping Service
```

---

# 59. Architecture Scenario – Replace Message Broker

Current:

```text
RabbitMQ
```

The lecturer requests:

```text
Kafka
```

If the architecture is well designed:

```text
IEventBus
    |
    +--- RabbitMQEventBus
    +--- KafkaEventBus
```

Business logic does not directly depend on the RabbitMQ implementation.

The team must explain whether this abstraction is actually necessary and its trade-offs.

---

# 60. Architecture Scenario – Scale Orders

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

The system can increase:

```text
3 → 10 → 50 workers
```

without changing the business logic.

---

# 61. Architecture Scenario – Product Search

Initially:

```text
Product DB
```

Later, the system needs:

```text
Elasticsearch
```

Flow:

```text
ProductUpdated
      ↓
Message Broker
      ↓
Search Indexer
      ↓
Elasticsearch
```

The Product Service continues to own product data.

The Search Service owns the search index.

---

# 62. Architecture Scenario – Payment Failure

The lecturer asks:

> The payment provider times out after Inventory has already been reserved.

The system should handle:

```text
OrderCreated
      ↓
InventoryReserved
      ↓
PaymentTimeout
      ↓
Retry
      ↓
PaymentFailed
      ↓
ReleaseInventory
      ↓
CancelOrder
```

The team must explain:

* Saga.
* Compensation.
* Idempotency.
* Retry.
* Timeout.

---

# 63. Architecture Scenario – Duplicate Payment Event

Suppose:

```text
PaymentCompleted
PaymentCompleted
```

The Payment Service or Order Service must not create duplicate side effects.

It should use:

```text
EventId
ProcessedEvent
IdempotencyKey
```

---

# 64. Architecture Scenario – Service Down

The lecturer shuts down:

```text
Notification Service
```

Requirement:

> The user must still be able to complete checkout.

Good architecture:

```text
Order
 ↓
OrderCreated
 ↓
Message Broker
 ↓
Notification Service
```

Notification failure should not roll back the order if the business requirement allows notification to be eventual.

---

# 65. Architecture Scenario – Database Down

Example:

```text
Payment DB DOWN
```

The Payment Service needs to:

```text
Fail gracefully
```

The entire API Gateway should not crash.

The team must present:

* Timeout.
* Circuit Breaker.
* Health Check.
* Retry.
* Recovery.

---

# 66. Complete System Flow

Example of a customer purchasing a product.

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
Email sent
```

---

# 67. Demo Scenario

A good demo can proceed as follows.

### Step 1

Login:

```text
User → API Gateway → Identity Service
```

### Step 2

Browse:

```text
User → Product Service
```

### Step 3

Search:

```text
"gaming laptop"
```

### Step 4

Add to cart:

```text
Product → Cart
```

### Step 5

Checkout:

```text
Cart
 ↓
Order
```

### Step 6

The screen displays:

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

Open the observability dashboard:

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

An order must know exactly:

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

It should not only reference the Product Service to retrieve the current price.

Example:

```text
Product price today = $1,200
```

but the order was created when:

```text
Price = $1,000
```

The order must store an appropriate snapshot.

---

# 70. API Versioning

The system may use:

```text
/api/v1/products
/api/v1/orders
```

Later:

```text
/api/v2/products
```

The API contract must have a backward compatibility strategy.

---

# 71. CI/CD

Suggested pipeline:

```text
Developer
    ↓
Git Push
    ↓
CI
    ↓
Build
    ↓
Unit Tests
    ↓
Integration Tests
    ↓
Contract Tests
    ↓
Docker Build
    ↓
Security Scan
    ↓
Deploy
```

Possible technologies:

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

The system can distinguish between:

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

Not every dependency failure should be considered a process failure if the business requirement does not require it.

---

# 74. Metrics

Possible metrics to monitor:

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

The report must answer:

1. Why choose microservices?
2. How are service boundaries determined?
3. Why are Order and Inventory separate services?
4. Which service owns which data?
5. When should REST be used?
6. When should asynchronous messaging be used?
7. Why use RabbitMQ or Kafka?
8. How is the Saga designed?
9. What happens when payment fails?
10. How are duplicate events prevented?
11. How is it ensured that Outbox events are not lost?
12. What happens if Redis goes down?
13. What happens if the Payment Provider goes down?
14. How is the Order Service scaled?
15. How is a request traced across multiple services?
16. How can a payment provider be added?
17. How can a shipping provider be added?
18. How can the message broker be replaced?
19. How is backward compatibility maintained?
20. How are multiple service instances deployed?
21. Why not use a shared database?
22. How is a distributed monolith avoided?
23. Which services require strong consistency?
24. Which services can use eventual consistency?
25. How is a distributed workflow tested?

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

At minimum:

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

Examples:

```text
ADR-001 – Why Microservices?
ADR-002 – Why Database per Service?
ADR-003 – Why RabbitMQ/Kafka?
ADR-004 – Why Saga?
ADR-005 – Why Outbox?
ADR-006 – Why Redis?
ADR-007 – Why API Gateway?
ADR-008 – Why Elasticsearch?
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

The demo must demonstrate:

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

After completing the MVP, the team can study:

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

# 79. Flash Sale – Advanced Scenario

A product has:

```text
Stock = 100
```

Traffic:

```text
100,000 users
```

trying to purchase at the same time.

The architecture must handle:

```text
100,000 requests
       ↓
API Gateway
       ↓
Queue
       ↓
Inventory Workers
       ↓
Atomic Reservation
```

The system must not allow:

```text
Stock < 0
```

This is a good scenario for evaluating:

* Concurrency.
* Queue.
* Backpressure.
* Rate limiting.
* Inventory consistency.

---

# 80. Multi-vendor Marketplace

Extension:

```text
Customer
   ↓
Marketplace
   ↓
Seller A
Seller B
Seller C
```

A single order may contain:

```text
Seller A products
Seller B products
```

The system needs to study:

```text
Order splitting
Seller settlement
Shipping per seller
Payment distribution
```

This is a more complex distributed system problem.

---

# 81. Meaning of the Project

The project should not be understood as:

> Building an online shopping website with multiple backend projects.

Instead, it should be understood as:

> Designing a distributed system in which business capabilities can change, scale, deploy, and fail independently while the entire system maintains correctness.

For example, today the system supports:

```text
Stripe
```

and tomorrow:

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

Today the system uses:

```text
RabbitMQ
```

and tomorrow it may study:

```text
Kafka
```

without business logic being directly dependent on the broker implementation.

Today there is:

```text
1 Order Worker
```

and tomorrow:

```text
50 Order Workers
```

while the architecture remains unchanged.

---

# 82. Core of the Project

The project combines:

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

Core flow:

```text
Request
   ↓
API Gateway
   ↓
Service
   ↓
Database
   ↓
Event
   ↓
Message Broker
   ↓
Other Services
   ↓
Eventual Consistency
```

The ultimate goal is to demonstrate that:

```text
Business Requirement
        ↓
Service Boundary
        ↓
Independent Deployment
        ↓
Asynchronous Communication
        ↓
Failure Handling
        ↓
Observability
        ↓
Scalability
```

can be designed systematically.

---

# 83. Architecture Evaluation Criteria

A good architecture must demonstrate:

### Modifiability

New services/providers can be added with minimal changes.

### Scalability

Each service can be scaled independently.

### Reliability

A dependency failure does not bring down the entire system.

### Consistency

There is a clear strategy for distributed transactions.

### Maintainability

Business logic is organized according to business capabilities.

### Testability

Services can be tested independently.

### Observability

The system can identify where a request or event is failing.

### Security

Authentication and authorization are designed at the correct boundaries.

### Deployment

Services can be built and deployed independently.

---

# 84. Final Demo

The final demo should demonstrate:

```text
1. Login
       ↓
2. Browse products
       ↓
3. Search product
       ↓
4. Add to cart
       ↓
5. Checkout
       ↓
6. Create Order
       ↓
7. Reserve Inventory
       ↓
8. Process Payment
       ↓
9. Confirm Order
       ↓
10. Create Shipment
       ↓
11. Send Notification
       ↓
12. Show distributed trace
```

Then demonstrate a failure:

```text
Payment Provider DOWN
       ↓
Timeout
       ↓
Retry
       ↓
Payment Failed
       ↓
Release Inventory
       ↓
Cancel Order
```

Finally, demonstrate scalability:

```text
1 Worker
   ↓
10 Workers
   ↓
50 Workers
```

and prove that the system can scale without changing the business workflow.

---

# 85. Conclusion

The goal of the project is not to prove that:

> "Microservices are better than monoliths in every situation."

Instead, the team must demonstrate an understanding of:

* When microservices are appropriate.
* How to define service boundaries.
* How to manage data ownership.
* How services communicate.
* How to handle distributed transactions.
* How to handle failures.
* How to scale.
* How to observe the system.
* How to test.
* How to deploy.
* The trade-offs of each architectural decision.

A good system is not the system with the most technologies.

A good system is one where every architectural decision solves a real problem and can be clearly explained:

```text
Problem
   ↓
Constraint
   ↓
Architectural Decision
   ↓
Trade-off
   ↓
Implementation
   ↓
Measurement
```

This is the main objective of the **E-Commerce Microservices Platform** final project.
