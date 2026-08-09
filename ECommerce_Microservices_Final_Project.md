# ĐỒ ÁN CUỐI KỲ
# E-Commerce Microservices Platform – Nền tảng thương mại điện tử phân tán

## 1. Bối cảnh bài toán

Các hệ thống thương mại điện tử hiện đại phải phục vụ lượng lớn người dùng, sản phẩm, đơn hàng và giao dịch thanh toán. Hệ thống phải hoạt động ổn định ngay cả khi một số thành phần gặp lỗi, đồng thời có khả năng mở rộng độc lập theo tải.

Một hệ thống monolithic có thể bắt đầu đơn giản:

```text
Frontend
   ↓
E-Commerce Application
   ↓
Database
```

Nhưng khi hệ thống phát triển, một application duy nhất có thể phải xử lý:

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

Điều này dẫn đến coupling cao, khó scale từng chức năng độc lập và làm cho một thay đổi nhỏ có thể ảnh hưởng đến toàn bộ hệ thống.

Vì vậy, câu hỏi chính của đồ án là:

> Có thể xây dựng một nền tảng E-Commerce theo kiến trúc microservices, trong đó các business capability có thể phát triển, triển khai, scale và thay đổi độc lập, trong khi hệ thống vẫn đảm bảo consistency, reliability, security và observability hay không?

Trọng tâm của đồ án là **Software Architecture và Distributed Systems**, không chỉ là xây dựng một website bán hàng.

---

# 2. Mục tiêu tổng thể

Xây dựng một E-Commerce Platform có khả năng:

- Quản lý người dùng và authentication.
- Quản lý sản phẩm.
- Quản lý danh mục sản phẩm.
- Tìm kiếm sản phẩm.
- Quản lý giỏ hàng.
- Tạo và quản lý đơn hàng.
- Quản lý tồn kho.
- Xử lý thanh toán.
- Quản lý vận chuyển.
- Gửi notification.
- Quản lý review và rating.
- Hỗ trợ promotion/coupon.
- Sử dụng message broker cho communication bất đồng bộ.
- Xử lý distributed transaction.
- Hỗ trợ Saga Pattern.
- Hỗ trợ Outbox Pattern.
- Xử lý duplicate events bằng idempotency.
- Caching bằng Redis.
- API Gateway.
- Database per Service.
- Distributed tracing.
- Logging và monitoring.
- Có khả năng scale service độc lập.
- Có khả năng thêm provider mới mà không sửa nhiều service hiện tại.

---

# 3. Ví dụ tổng thể

Người dùng truy cập:

```text
E-Commerce Platform
```

Có thể:

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

Một architecture tham khảo:

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

Đây chỉ là architecture tham khảo. Nhóm có thể đề xuất architecture khác nếu giải thích được lý do.

---

# 4. Architectural Drivers

Đồ án phải tập trung giải quyết các architectural drivers sau.

## 4.1 Modifiability

Có thể thêm:

```text
PayPal
Stripe
VNPay
MoMo
```

mà không phải sửa toàn bộ Order Service.

## 4.2 Scalability

Ví dụ:

```text
Product Service: 2 instances
Order Service: 10 instances
Payment Service: 5 instances
```

Mỗi service được scale độc lập.

## 4.3 Reliability

Nếu Payment Service bị lỗi:

```text
Order
  ↓
Payment
  ↓
Timeout
```

hệ thống phải có:

- Retry.
- Timeout.
- Circuit Breaker.
- Compensation.
- Dead Letter Queue nếu phù hợp.

## 4.4 Consistency

Một order có thể liên quan đến nhiều service:

```text
Order
Inventory
Payment
Shipping
```

Không thể đơn giản dùng một database transaction cho toàn bộ hệ thống.

Nhóm cần nghiên cứu:

- Eventual Consistency.
- Saga.
- Transactional Outbox.
- Idempotency.

## 4.5 Performance

Các operation như:

```text
Product Search
Product Detail
Category Listing
```

có thể có lượng request rất lớn.

Nhóm cần nghiên cứu:

- Redis.
- Database indexing.
- Read optimization.
- Search engine.
- CDN nếu cần.

## 4.6 Observability

Hệ thống cần biết:

```text
Request ID
Trace ID
Order ID
Service
Latency
Error
Event
```

Một request:

```text
POST /orders
```

có thể đi qua:

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

Có thể sử dụng:

```text
OpenTelemetry
Prometheus
Grafana
ELK/OpenSearch
```

---

# 5. Module 1 – Identity & Authentication Service

Identity Service chịu trách nhiệm:

- Registration.
- Login.
- Logout.
- Password management.
- Access token.
- Refresh token.
- Role.
- Permission.

Ví dụ:

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
```

Không nên để Product Service hoặc Order Service tự quản lý password.

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

Có thể nghiên cứu:

- JWT.
- OAuth2.
- OpenID Connect.
- Role-Based Access Control.

---

# 6. Module 2 – Product Catalog Service

Product Service quản lý:

```text
Product
Category
Brand
ProductImage
ProductVariant
Price
```

Ví dụ:

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

Các API:

```text
GET /products
GET /products/{id}
POST /products
PUT /products/{id}
DELETE /products/{id}
```

Product Service không nên trực tiếp truy cập database của Order Service.

---

# 7. Module 3 – Search Service

Search Service chịu trách nhiệm:

```text
Search products
Filter
Sort
Autocomplete
```

Có thể sử dụng:

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

Khi Product thay đổi, Search Service cập nhật index.

Product Service không cần biết implementation bên trong Search Service.

---

# 8. Module 4 – Cart Service

Cart Service quản lý giỏ hàng:

```text
Cart
CartItem
Quantity
ProductId
PriceSnapshot
```

Ví dụ:

```text
POST /cart/items
PUT /cart/items/{id}
DELETE /cart/items/{id}
GET /cart
```

Cart có thể sử dụng Redis vì dữ liệu:

- thường xuyên thay đổi;
- cần response nhanh;
- có thể có expiration.

Ví dụ:

```text
User
 ↓
Cart Service
 ↓
Redis
```

---

# 9. Module 5 – Inventory Service

Inventory Service quản lý:

```text
Product
AvailableQuantity
ReservedQuantity
Warehouse
```

Một vấn đề quan trọng:

```text
Stock = 1

Customer A → Buy
Customer B → Buy
```

Nếu xử lý không đúng, cả hai customer có thể mua cùng một sản phẩm.

Nhóm cần nghiên cứu:

- Optimistic Concurrency.
- Pessimistic Lock.
- Atomic update.
- Reservation.
- Idempotency.

---

# 10. Module 6 – Order Service

Order Service quản lý:

```text
Order
OrderItem
OrderStatus
OrderTotal
CustomerId
```

Order state có thể:

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

Hoặc:

```text
PENDING
   ↓
CANCELLED
```

Order Service không nên trực tiếp thực hiện toàn bộ:

```text
Payment
Inventory
Shipping
Notification
```

thông qua synchronous calls trong một God Service.

---

# 11. Module 7 – Checkout

Checkout là một business workflow quan trọng.

Ví dụ:

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

Checkout cần xử lý các trường hợp lỗi.

Ví dụ:

```text
Inventory OK
     ↓
Payment FAILED
```

Không thể để inventory bị giữ vĩnh viễn.

Phải có compensation:

```text
Payment Failed
      ↓
Release Inventory
      ↓
Cancel Order
```

---

# 12. Module 8 – Payment Service

Payment Service chịu trách nhiệm:

```text
Create Payment
Process Payment
Refund
Payment Status
```

Có thể hỗ trợ:

```text
Stripe
VNPay
MoMo
PayPal
```

Không nên hard-code:

```text
if provider == "Stripe"
   ...
else if provider == "VNPay"
   ...
else if provider == "MoMo"
   ...
```

Thay vào đó có abstraction:

```text
interface IPaymentProvider
{
    ProcessPayment();
    Refund();
}
```

Provider:

```text
StripeProvider
VNPayProvider
MoMoProvider
PayPalProvider
```

---

# 13. Module 9 – Shipping Service

Shipping Service quản lý:

```text
Shipment
Address
ShippingMethod
TrackingNumber
ShippingStatus
```

Có thể hỗ trợ:

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

Thêm provider mới không nên yêu cầu sửa Order Service.

---

# 14. Module 10 – Notification Service

Notification Service xử lý:

```text
Email
SMS
Push Notification
```

Ví dụ event:

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

Order Service không nên trực tiếp gọi email provider.

---

# 15. Module 11 – Review & Rating

Customer có thể:

```text
Create Review
Update Review
Delete Review
Rate Product
```

Ví dụ:

```text
Product
   |
   +--- Reviews
   +--- Rating
```

Có thể phát event:

```text
ReviewCreated
```

để Analytics hoặc Recommendation Service xử lý.

---

# 16. Module 12 – Promotion & Coupon

Promotion Service quản lý:

```text
Coupon
Discount
Promotion
Campaign
```

Ví dụ:

```text
SAVE10
-10%

FREESHIP
Free shipping

BLACKFRIDAY
-30%
```

Business rule:

```text
Coupon valid?
Customer eligible?
Expiration?
Minimum order?
Usage limit?
```

Không nên đưa toàn bộ promotion logic vào Order Service.

---

# 17. API Gateway

Frontend không nên gọi trực tiếp tất cả services:

```text
Frontend
  ├── Product
  ├── Order
  ├── Payment
  ├── Inventory
  ├── User
  └── Shipping
```

Nên:

```text
Frontend
    ↓
API Gateway
    ↓
Microservices
```

Gateway có thể xử lý:

- Routing.
- Authentication.
- Rate limiting.
- Request logging.
- Correlation ID.
- Aggregation nếu cần.

Có thể nghiên cứu:

```text
YARP
Ocelot
NGINX
Kong
```

---

# 18. Communication giữa Services

Có hai loại communication.

## 18.1 Synchronous

Ví dụ:

```text
Frontend
   ↓ HTTP
API Gateway
   ↓ HTTP
Product Service
```

Phù hợp với request cần response ngay.

## 18.2 Asynchronous

Ví dụ:

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

Phù hợp với:

- Event propagation.
- Background processing.
- Decoupling.
- High throughput.

---

# 19. Message Broker

Có thể sử dụng:

```text
RabbitMQ
```

hoặc:

```text
Kafka
```

Ví dụ:

```text
OrderCreated
PaymentCompleted
InventoryReserved
InventoryReleased
ShipmentCreated
OrderCancelled
```

Nhóm phải giải thích:

> Tại sao chọn RabbitMQ hoặc Kafka?

Không được sử dụng message broker chỉ để làm hệ thống "trông giống microservices".

---

# 20. Event-Driven Architecture

Một flow:

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

Service nhận event không cần biết service publish event nằm ở đâu.

Điều này giúp giảm coupling.

---

# 21. Saga Pattern

Order workflow có thể được xử lý bằng Saga.

Ví dụ:

```text
Create Order
    ↓
Reserve Inventory
    ↓
Process Payment
    ↓
Create Shipment
```

Nếu Payment thất bại:

```text
Payment Failed
      ↓
Release Inventory
      ↓
Cancel Order
```

Đây là compensation.

Có hai hướng:

```text
Choreography Saga
```

và:

```text
Orchestration Saga
```

Nhóm phải giải thích lựa chọn.

---

# 22. Outbox Pattern

Một vấn đề:

```text
Database Transaction
        +
Publish Event
```

Ví dụ:

```text
Save Order
Publish OrderCreated
```

Nếu:

```text
Save Order = SUCCESS
Publish Event = FAILED
```

database có order nhưng hệ thống không có event.

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

Database transaction lưu:

```text
Order
+
Outbox Event
```

trong cùng transaction.

---

# 23. Idempotency

Distributed systems có thể gửi duplicate event.

Ví dụ:

```text
PaymentCompleted
PaymentCompleted
PaymentCompleted
```

Payment Service không được:

```text
charge
charge
charge
```

Một request có:

```text
Idempotency-Key: abc-123
```

Service phải đảm bảo cùng key không tạo nhiều side effects.

Có thể lưu:

```text
IdempotencyKey
RequestHash
Response
CreatedAt
```

---

# 24. Distributed Transaction

Không nên:

```text
BEGIN TRANSACTION

Order DB
Inventory DB
Payment DB
Shipping DB

COMMIT
```

vì các database nằm ở các service khác nhau.

Thay vào đó:

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

và sử dụng compensation khi cần.

---

# 25. Database per Service

Mỗi service sở hữu database của mình:

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

Không nên:

```text
Order Service
      ↓
Product DB
Inventory DB
Payment DB
```

Service chỉ nên truy cập database mà nó sở hữu.

---

# 26. Caching

Redis có thể được sử dụng cho:

```text
Product Cache
Session
Cart
Rate Limit
Distributed Lock
Idempotency
```

Ví dụ:

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

Nhóm cần nghiên cứu:

- Cache Aside.
- TTL.
- Cache invalidation.
- Cache stampede.

---

# 27. Search

Product search có thể sử dụng:

```text
Elasticsearch / OpenSearch
```

Ví dụ:

```text
Search:
"iphone 17 pro"
```

Có thể hỗ trợ:

- Full-text search.
- Fuzzy search.
- Filter.
- Sorting.
- Price range.
- Category.
- Brand.

---

# 28. Recommendation Service

Có thể xây dựng recommendation đơn giản:

```text
User
 ↓
Purchase History
 ↓
Product Similarity
 ↓
Recommendation
```

Ví dụ:

```text
Customer bought:
Laptop

Recommend:
Mouse
Keyboard
Monitor
Laptop Bag
```

Recommendation không phải phần bắt buộc của MVP.

---

# 29. Eventual Consistency

Ví dụ:

```text
Product Service
Price = 100
```

ProductUpdated event được publish.

Search Service có thể cập nhật sau:

```text
Product DB
   ↓
Event
   ↓
Search Index
```

Trong một khoảng thời gian ngắn:

```text
Product DB = 100
Search Index = 90
```

Đây là eventual consistency.

Nhóm phải xác định:

- Dữ liệu nào cần strong consistency?
- Dữ liệu nào chấp nhận eventual consistency?

---

# 30. Reliability

Các service phải xử lý failure.

Ví dụ:

```text
Order
 ↓
Payment
 ↓
Timeout
```

Có thể sử dụng:

```text
Timeout
Retry
Circuit Breaker
Bulkhead
Fallback
```

Không nên retry vô hạn.

Ví dụ:

```text
Retry 1
Retry 2
Retry 3
      ↓
Dead Letter / Failed
```

---

# 31. Distributed Lock

Một số operation có thể cần lock.

Ví dụ:

```text
Stock = 1

Request A
Request B
```

Có thể sử dụng:

```text
Database optimistic concurrency
```

hoặc trong một số trường hợp:

```text
Redis Distributed Lock
```

Nhóm phải giải thích tại sao cần lock và tại sao chọn phương pháp đó.

---

# 32. Observability

Hệ thống cần có:

```text
Logs
Metrics
Traces
```

Ví dụ:

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

Có thể sử dụng:

```text
OpenTelemetry
Prometheus
Grafana
Jaeger
ELK/OpenSearch
```

---

# 33. Security

Các vấn đề cần giải quyết:

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

Không lưu:

```text
Plain text password
```

Không commit:

```text
DATABASE_PASSWORD
JWT_SECRET
PAYMENT_SECRET
```

vào Git.

---

# 34. Order Flow hoàn chỉnh

Một flow mẫu:

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

Customer nhận:

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

Payment chưa được charge.

---

# 37. Failure Scenario 3 – Payment succeeds but Order Service crashes

Ví dụ:

```text
PaymentCompleted
      ↓
Order Service DOWN
```

Event không được mất.

Khi Order Service hoạt động lại:

```text
Message Broker
      ↓
Order Service
      ↓
Process PaymentCompleted
```

Do đó message durability và consumer recovery rất quan trọng.

---

# 38. Failure Scenario 4 – Duplicate Event

```text
PaymentCompleted
PaymentCompleted
```

Order Service phải xử lý idempotently.

```text
if event already processed
    ignore
else
    process
```

Có thể sử dụng:

```text
ProcessedEvents
```

---

# 39. Failure Scenario 5 – Redis Down

Nếu Redis bị lỗi:

```text
Product Cache
     ↓
Redis DOWN
```

Product Service vẫn phải có khả năng truy cập database.

Không được để:

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

Có thể:

```text
Retry
 ↓
Retry
 ↓
Circuit Open
 ↓
Payment Pending
```

Customer không bị charge nhiều lần.

---

# 41. Extensibility – Payment Provider

Ban đầu:

```text
Stripe
```

Sau đó yêu cầu:

```text
VNPay
```

Kiến trúc tốt:

```text
IPaymentProvider
      |
      +--- StripeProvider
      +--- VNPayProvider
      +--- MoMoProvider
```

Payment Service không phải rewrite.

---

# 42. Extensibility – Shipping Provider

Ban đầu:

```text
GHN
```

Sau đó:

```text
GHTK
```

Thêm:

```text
GHTKAdapter
```

và register provider.

Các service phía trên không cần biết implementation cụ thể.

---

# 43. Extensibility – Notification Provider

Có thể hỗ trợ:

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

Giả sử:

```text
100 orders/sec
```

Order Service cần scale:

```text
Order Worker 1
Order Worker 2
Order Worker 3
Order Worker 4
```

Nếu back-end sử dụng queue:

```text
               Queue
                 |
       +---------+---------+
       |         |         |
    Worker 1  Worker 2  Worker 3
```

Có thể scale worker độc lập.

---

# 45. High Traffic Scenario

Black Friday:

```text
Normal:
1,000 requests/sec

Black Friday:
50,000 requests/sec
```

Không nhất thiết scale toàn bộ system.

Ví dụ:

```text
Product Service   → 20 instances
Search Service    → 15 instances
Cart Service      → 10 instances
Order Service     → 15 instances
Payment Service   → 5 instances
```

Đây là một lợi ích quan trọng của microservices.

---

# 46. Background Job Processing

Các operation không cần response ngay có thể đưa vào queue:

```text
Generate Invoice
Send Email
Process Image
Update Search Index
Generate Recommendation
Analytics
```

Ví dụ:

```text
OrderCreated
     ↓
Queue
     ↓
Invoice Worker
```

---

# 47. Event Catalog

Một số event có thể định nghĩa:

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

Mỗi event nên có:

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

Một order:

```text
OrderId = ORD-123
```

có thể đi qua:

```text
Gateway
Order
Inventory
Payment
Shipping
Notification
```

Tất cả log nên có:

```text
CorrelationId
OrderId
TraceId
```

giúp debug distributed system.

---

# 49. Versioning

API và event cần có version.

Ví dụ:

```text
OrderCreated.v1
OrderCreated.v2
```

Không nên thay đổi event contract một cách breaking mà không có chiến lược migration.

Có thể nghiên cứu:

- Backward compatibility.
- Schema evolution.
- Consumer-driven contract testing.

---

# 50. Testing Strategy

Hệ thống cần nhiều loại test.

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

Kiểm tra:

```text
Producer
     ↕
Consumer
```

có cùng contract hay không.

## End-to-End Test

Ví dụ:

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

Không nên:

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

Một service không nên chứa toàn bộ business logic.

---

# 52. Anti-pattern – Shared Database

Không nên:

```text
Order Service
       |
       +----------+
       |          |
Product DB    Inventory DB
```

Service khác truy cập trực tiếp database của nhau.

Thay vào đó:

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

Microservices không có nghĩa là:

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

và tất cả đều phải hoạt động synchronous.

Nếu một service down thì toàn bộ hệ thống down, đó có thể là distributed monolith.

Nhóm phải giải thích trade-off giữa:

```text
Synchronous Communication
```

và:

```text
Asynchronous Communication
```

---

# 54. Anti-pattern – Too Many Services

Không nên tách:

```text
Price Service
ProductName Service
ProductDescription Service
```

chỉ để có nhiều microservices.

Service boundary phải dựa trên:

- Business capability.
- Data ownership.
- Change frequency.
- Scalability.
- Team ownership.

---

# 55. Anti-pattern – Shared Business Logic

Không nên copy:

```text
CalculateOrderTotal()
```

vào:

```text
Order Service
Payment Service
Invoice Service
```

mỗi nơi một implementation khác nhau.

Business ownership phải rõ ràng.

---

# 56. MVP

MVP tối thiểu phải có:

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

- REST/gRPC cho synchronous communication.
- RabbitMQ hoặc Kafka cho asynchronous communication.

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

# 57. Phần mở rộng

Các nhóm có thể mở rộng:

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

Giảng viên yêu cầu:

> Hệ thống hiện hỗ trợ Stripe. Hãy thêm VNPay.

Architecture tốt:

```text
IPaymentProvider
       |
       +--- StripeProvider
       +--- VNPayProvider
```

Chỉ cần:

```text
VNPayProvider
```

và registration.

Không cần sửa:

```text
Order Service
Inventory Service
Frontend
Shipping Service
```

---

# 59. Architecture Scenario – Replace Message Broker

Hiện tại:

```text
RabbitMQ
```

Giảng viên yêu cầu:

```text
Kafka
```

Nếu architecture tốt:

```text
IEventBus
    |
    +--- RabbitMQEventBus
    +--- KafkaEventBus
```

Business logic không phụ thuộc trực tiếp vào RabbitMQ implementation.

Nhóm phải giải thích abstraction này có thực sự cần thiết hay không và trade-off của nó.

---

# 60. Architecture Scenario – Scale Orders

Giả sử:

```text
1 Worker
2 seconds / order
```

10,000 orders cần lượng thời gian rất lớn.

Kiến trúc có queue:

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

Có thể tăng:

```text
3 → 10 → 50 workers
```

mà không thay đổi business logic.

---

# 61. Architecture Scenario – Product Search

Ban đầu:

```text
Product DB
```

Sau đó cần:

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

Product Service vẫn sở hữu product data.

Search Service sở hữu search index.

---

# 62. Architecture Scenario – Payment Failure

Giảng viên yêu cầu:

> Payment provider timeout sau khi Inventory đã reserve.

Hệ thống phải:

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

Nhóm phải giải thích:

- Saga.
- Compensation.
- Idempotency.
- Retry.
- Timeout.

---

# 63. Architecture Scenario – Duplicate Payment Event

Giả sử:

```text
PaymentCompleted
PaymentCompleted
```

Payment Service hoặc Order Service không được tạo duplicate side effect.

Phải có:

```text
EventId
ProcessedEvent
IdempotencyKey
```

---

# 64. Architecture Scenario – Service Down

Giảng viên tắt:

```text
Notification Service
```

Yêu cầu:

> User vẫn phải checkout được.

Architecture tốt:

```text
Order
 ↓
OrderCreated
 ↓
Message Broker
 ↓
Notification Service
```

Notification failure không được rollback order nếu business requirement cho phép notification eventual.

---

# 65. Architecture Scenario – Database Down

Ví dụ:

```text
Payment DB DOWN
```

Payment Service cần:

```text
Fail gracefully
```

Không nên làm toàn bộ API Gateway crash.

Nhóm phải trình bày:

- Timeout.
- Circuit Breaker.
- Health Check.
- Retry.
- Recovery.

---

# 66. Một luồng hoàn chỉnh của hệ thống

Ví dụ customer mua sản phẩm.

### Bước 1

Customer:

```text
POST /cart/items
```

### Bước 2

Customer:

```text
POST /checkout
```

### Bước 3

Order Service tạo:

```text
Order #1001
```

### Bước 4

Publish:

```text
OrderCreated
```

### Bước 5

Inventory:

```text
Reserve Product
```

### Bước 6

Publish:

```text
InventoryReserved
```

### Bước 7

Payment:

```text
Process Payment
```

### Bước 8

Publish:

```text
PaymentCompleted
```

### Bước 9

Order:

```text
CONFIRMED
```

### Bước 10

Shipping:

```text
ShipmentCreated
```

### Bước 11

Notification:

```text
Order confirmed.
```

---

# 67. Demo Scenario

Một demo tốt có thể diễn ra như sau.

### Bước 1

Login:

```text
User → API Gateway → Identity Service
```

### Bước 2

Browse:

```text
User → Product Service
```

### Bước 3

Search:

```text
"laptop gaming"
```

### Bước 4

Add cart:

```text
Product → Cart
```

### Bước 5

Checkout:

```text
Cart
 ↓
Order
```

### Bước 6

Màn hình hiển thị:

```text
Order #1001
Status: PENDING
```

### Bước 7

Inventory:

```text
RESERVED
```

### Bước 8

Payment:

```text
SUCCESS
```

### Bước 9

Order:

```text
CONFIRMED
```

### Bước 10

Shipping:

```text
SHIPMENT_CREATED
```

### Bước 11

Notification:

```text
Email sent
```

### Bước 12

Mở observability dashboard:

```text
Trace ID
Order ID
Service latency
Events
Errors
```

---

# 68. Database Design

Mỗi service sở hữu dữ liệu riêng.

Ví dụ:

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

Order phải biết chính xác:

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

Không nên chỉ tham chiếu Product Service để lấy giá hiện tại.

Ví dụ:

```text
Product price today = $1,200
```

nhưng order được tạo khi:

```text
Price = $1,000
```

Order phải lưu snapshot phù hợp.

---

# 70. API Versioning

Có thể sử dụng:

```text
/api/v1/products
/api/v1/orders
```

Sau này:

```text
/api/v2/products
```

API contract phải có chiến lược backward compatibility.

---

# 71. CI/CD

Pipeline đề xuất:

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

Có thể sử dụng:

```text
GitHub Actions
GitLab CI
Azure DevOps
Jenkins
```

---

# 72. Containerization

Mỗi service có thể đóng gói thành Docker image:

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

Mỗi service nên có:

```text
GET /health
```

Có thể phân biệt:

```text
Liveness
Readiness
```

Ví dụ:

```text
Product Service
    |
    +-- API healthy
    +-- Database healthy
```

Không nên coi mọi dependency failure đều là process failure nếu business requirement không cần.

---

# 74. Metrics

Các metrics có thể theo dõi:

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

Trong báo cáo, nhóm phải trả lời:

1. Tại sao chọn microservices?
2. Service boundaries được xác định như thế nào?
3. Tại sao Order và Inventory là hai service khác nhau?
4. Service nào sở hữu dữ liệu nào?
5. Khi nào dùng REST?
6. Khi nào dùng asynchronous messaging?
7. Tại sao dùng RabbitMQ hoặc Kafka?
8. Saga được thiết kế như thế nào?
9. Nếu payment fail thì compensation ra sao?
10. Làm sao chống duplicate events?
11. Làm sao đảm bảo Outbox không mất event?
12. Nếu Redis down thì chuyện gì xảy ra?
13. Nếu Payment Provider down thì chuyện gì xảy ra?
14. Làm sao scale Order Service?
15. Làm sao trace một request qua nhiều service?
16. Làm sao thêm payment provider?
17. Làm sao thêm shipping provider?
18. Làm sao thay message broker?
19. Làm sao đảm bảo backward compatibility?
20. Làm sao deploy nhiều instance?
21. Tại sao không dùng shared database?
22. Làm sao tránh distributed monolith?
23. Service nào cần strong consistency?
24. Service nào có thể eventual consistency?
25. Làm sao test distributed workflow?

---

# 76. Deliverables

Nhóm cần nộp:

## 1. Source Code

Repository hoàn chỉnh.

## 2. README

Bao gồm:

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

Tối thiểu:

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

Ví dụ:

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

Bao gồm:

```text
Unit Tests
Integration Tests
Contract Tests
E2E Tests
Failure Tests
Load Tests
```

## 6. Demo

Phải chứng minh:

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

# 78. Phần mở rộng nâng cao

Nếu hoàn thành MVP, có thể nghiên cứu:

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

Business extension:

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

Một sản phẩm:

```text
Stock = 100
```

Traffic:

```text
100,000 users
```

cùng lúc mua.

Architecture phải xử lý:

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

Không được bán:

```text
Stock < 0
```

Đây là scenario tốt để đánh giá:

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
   ↓
Marketplace
   ↓
Seller A
Seller B
Seller C
```

Một order có thể chứa:

```text
Seller A products
Seller B products
```

Cần nghiên cứu:

```text
Order splitting
Seller settlement
Shipping per seller
Payment distribution
```

Đây là một bài toán distributed system phức tạp hơn.

---

# 81. Ý nghĩa cuối cùng của đồ án

Không nên hiểu đồ án là:

> Xây dựng một website bán hàng có nhiều backend project.

Mà phải hiểu là:

> Thiết kế một distributed system trong đó các business capability có thể thay đổi, scale, deploy và fail độc lập nhưng toàn hệ thống vẫn duy trì tính đúng đắn.

Ví dụ hôm nay hệ thống có:

```text
Stripe
```

ngày mai có:

```text
VNPay
```

nhưng:

```text
Order Service
Inventory Service
Frontend
```

không cần rewrite.

Hôm nay dùng:

```text
RabbitMQ
```

ngày mai có thể nghiên cứu:

```text
Kafka
```

mà business logic không bị phụ thuộc trực tiếp.

Hôm nay có:

```text
1 Order Worker
```

ngày mai:

```text
50 Order Workers
```

mà architecture vẫn giữ nguyên.

---

# 82. Bản chất của đồ án

Đồ án là sự kết hợp của:

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

Flow trung tâm:

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

Mục tiêu cuối cùng là chứng minh rằng:

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

có thể được thiết kế một cách có hệ thống.

---

# 83. Tiêu chí đánh giá kiến trúc

Một architecture tốt phải chứng minh:

### Modifiability

Thêm service/provider mới với thay đổi tối thiểu.

### Scalability

Có thể scale từng service độc lập.

### Reliability

Một dependency failure không làm toàn hệ thống sụp đổ.

### Consistency

Có chiến lược rõ ràng cho distributed transaction.

### Maintainability

Business logic được chia theo business capability.

### Testability

Service có thể được test độc lập.

### Observability

Có thể xác định request/event đang lỗi ở đâu.

### Security

Authentication và authorization được thiết kế đúng boundary.

### Deployment

Service có thể build và deploy độc lập.

---

# 84. Final Demo

Demo cuối kỳ đề xuất:

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

Sau đó demo failure:

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

Cuối cùng demo scalability:

```text
1 Worker
   ↓
10 Workers
   ↓
50 Workers
```

và chứng minh hệ thống có thể scale mà không cần thay đổi business workflow.

---

# 85. Kết luận

Mục tiêu của đồ án không phải chứng minh rằng:

> "Microservices tốt hơn monolith trong mọi trường hợp."

Mà phải chứng minh rằng nhóm hiểu:

- Khi nào microservices phù hợp.
- Cách xác định service boundary.
- Cách quản lý data ownership.
- Cách giao tiếp giữa services.
- Cách xử lý distributed transaction.
- Cách xử lý failure.
- Cách scale.
- Cách observe.
- Cách test.
- Cách deploy.
- Các trade-off của từng architectural decision.

Một hệ thống tốt không phải là hệ thống có nhiều technology nhất.

Một hệ thống tốt là hệ thống mà mỗi architectural decision đều giải quyết được một vấn đề thực tế và có thể giải thích rõ:

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

Đây mới là mục tiêu chính của đồ án E-Commerce Microservices Platform.
