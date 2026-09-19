# Event Flow Diagrams - Complete System Flows

This document provides detailed event flow diagrams for the most important distributed workflows in the E-Commerce Microservices Platform.

## 1. Happy Path: Complete Order Flow

```
Customer Checkout → Order Delivered

┌─────────┐
│Customer │
└────┬────┘
     │
     │ 1. POST /checkout
     ↓
┌────────────────┐
│  API Gateway   │
└────────┬───────┘
         │
         │ 2. Create Order
         ↓
┌────────────────┐         ┌─────────────┐
│ Order Service  │────────→│  Order DB   │
└────────┬───────┘         └─────────────┘
         │
         │ 3. OrderCreated Event
         ↓
┌────────────────────────┐
│   Message Broker       │
│   (RabbitMQ/Kafka)     │
└───┬────────────┬───────┘
    │            │
    │            │ 4. Consume Event
    ↓            ↓
┌─────────────┐  ┌──────────────┐
│  Inventory  │  │ Notification │
│   Service   │  │   Service    │
└──────┬──────┘  └──────────────┘
       │
       │ 5. Reserve Stock
       │ 6. InventoryReserved Event
       ↓
┌────────────────────────┐
│   Message Broker       │
└───┬────────────────────┘
    │
    │ 7. Consume Event
    ↓
┌──────────────┐
│   Payment    │
│   Service    │
└──────┬───────┘
       │
       │ 8. Process Payment (Stripe/VNPay)
       │ 9. PaymentCompleted Event
       ↓
┌────────────────────────┐
│   Message Broker       │
└───┬────────────┬───────┘
    │            │
    │            │ 10. Consume Event
    ↓            ↓
┌──────────┐  ┌──────────────┐
│  Order   │  │   Inventory  │
│ Service  │  │   Service    │
└────┬─────┘  └──────────────┘
     │
     │ 11. OrderConfirmed Event
     ↓
┌────────────────────────┐
│   Message Broker       │
└───┬────────────────────┘
    │
    │ 12. Consume Event
    ↓
┌──────────────┐
│  Shipping    │
│   Service    │
└──────┬───────┘
       │
       │ 13. Create Shipment
       │ 14. ShipmentCreated Event
       ↓
┌────────────────────────┐
│   Message Broker       │
└───┬────────────────────┘
    │
    │ 15. Consume Events
    ↓
┌──────────────┐
│ Notification │
│   Service    │
└──────┬───────┘
       │
       │ 16. Send Emails/SMS/Push
       ↓
┌─────────┐
│Customer │
└─────────┘

Timeline:
- OrderCreated → InventoryReserved: 100ms
- InventoryReserved → PaymentCompleted: 2-5 seconds
- PaymentCompleted → OrderConfirmed: 50ms
- OrderConfirmed → ShipmentCreated: 200ms
- Total: ~3-6 seconds
```

## 2. Failure Scenario: Payment Failed with Compensation

```
Payment Failure → Compensation Flow

┌──────────────┐
│ Order Service│
│ (PENDING)    │
└──────┬───────┘
       │ OrderCreated Event
       ↓
┌────────────────────────┐
│   Message Broker       │
└───┬────────────────────┘
    │
    │
    ↓
┌─────────────┐
│  Inventory  │
│   Service   │
└──────┬──────┘
       │ Reserve Stock (Success)
       │ InventoryReserved Event
       ↓
┌────────────────────────┐
│   Message Broker       │
└───┬────────────────────┘
    │
    │
    ↓
┌──────────────┐
│   Payment    │
│   Service    │
└──────┬───────┘
       │
       │ Process Payment
       │ ❌ FAILED (Card Declined)
       │ PaymentFailed Event
       ↓
┌────────────────────────┐
│   Message Broker       │
└───┬────────────┬───────┘
    │            │
    │ Compensation Step 1
    ↓            │
┌─────────────┐  │
│  Inventory  │  │
│   Service   │  │
└──────┬──────┘  │
       │         │
       │ Release Reservation
       │ InventoryReleased Event
       ↓         │
┌────────────────────────┐
│   Message Broker       │
└───┬────────────────────┘
    │
    │ Compensation Step 2
    ↓
┌──────────────┐
│    Order     │
│   Service    │
└──────┬───────┘
       │
       │ Update Status: CANCELLED
       │ OrderCancelled Event
       ↓
┌────────────────────────┐
│   Message Broker       │
└───┬────────────────────┘
    │
    │
    ↓
┌──────────────┐
│ Notification │
│   Service    │
└──────┬───────┘
       │
       │ Send Cancellation Email
       ↓
┌─────────┐
│Customer │
└─────────┘

Result: Order Cancelled, Stock Released
```

## 3. Saga Pattern: Orchestration vs Choreography

### Choreography-Based Saga (Event-Driven)
```
Each service publishes events and reacts to others' events

┌─────────┐   OrderCreated    ┌───────────┐
│  Order  │──────────────────→│ Inventory │
└────┬────┘                   └─────┬─────┘
     │                              │
     │                              │ InventoryReserved
     │                              ↓
     │                        ┌──────────┐
     │←───────────────────────│ Payment  │
     │   PaymentCompleted     └──────────┘
     │
     │ OrderConfirmed
     ↓
┌──────────┐
│ Shipping │
└──────────┘

Pros:
✓ Loose coupling
✓ Each service autonomous
✓ Easy to add new services

Cons:
✗ Harder to understand flow
✗ Cyclic dependencies possible
✗ Difficult to track saga state
```

### Orchestration-Based Saga (Command-Driven)
```
Orchestrator coordinates all steps

                  ┌────────────────┐
                  │ Saga Manager   │
                  │ (Orchestrator) │
                  └───┬────────┬───┘
                      │        │
        ┌─────────────┘        └─────────────┐
        │                                     │
        │ ReserveInventory          ProcessPayment
        ↓                                     ↓
┌───────────┐                         ┌──────────┐
│ Inventory │                         │ Payment  │
└─────┬─────┘                         └────┬─────┘
      │                                    │
      │ InventoryReserved                 │ PaymentCompleted
      └──────────→┌────────────┐←─────────┘
                  │   Saga     │
                  │  Manager   │
                  └─────┬──────┘
                        │
                        │ CreateShipment
                        ↓
                  ┌──────────┐
                  │ Shipping │
                  └──────────┘

Pros:
✓ Clear workflow visibility
✓ Easier to track state
✓ Centralized compensation logic

Cons:
✗ Orchestrator is single point of failure
✗ Tighter coupling
✗ More complex orchestrator logic
```

## 4. Outbox Pattern with Polling Publisher

```
Atomic Write + Guaranteed Event Publishing

┌─────────────────────────────────────────────┐
│         Application Service                 │
└────────────────┬────────────────────────────┘
                 │
                 │ BEGIN TRANSACTION
                 ↓
         ┌───────────────────┐
         │  Service Database │
         ├───────────────────┤
         │  Business Table   │
         │  ┌──────────────┐ │
         │  │   Orders     │ │
         │  │  INSERT      │ │
         │  └──────────────┘ │
         │                   │
         │  Outbox Table     │
         │  ┌──────────────┐ │
         │  │ EventId      │ │
         │  │ EventType    │ │
         │  │ Payload      │ │
         │  │ ProcessedAt  │ │
         │  │  (NULL)      │ │
         │  └──────────────┘ │
         └─────────┬─────────┘
                   │
                   │ COMMIT (Atomic)
                   ↓
         
         ┌──────────────────┐
         │ Outbox Publisher │  ← Polls every 5 sec
         │ (Background Job) │
         └─────────┬────────┘
                   │
                   │ 1. SELECT * WHERE ProcessedAt IS NULL
                   │ 2. Publish to Broker
                   │ 3. UPDATE ProcessedAt = NOW()
                   ↓
         ┌──────────────────┐
         │ Message Broker   │
         └──────────────────┘

Benefits:
✓ No dual-write problem
✓ At-least-once delivery
✓ Transaction atomicity
✓ Service restart safe
```

## 5. Idempotency Handling

### Event Idempotency
```
Prevent Duplicate Event Processing

┌────────────────┐
│ Message Broker │
└────────┬───────┘
         │ OrderCreated
         │ EventId: "evt-123"
         ↓
┌────────────────────┐
│  Inventory Service │
└────────┬───────────┘
         │
         │ Check Idempotency
         ↓
┌───────────────────────────┐
│  ProcessedEvents Table    │
├───────────────────────────┤
│ EventId      ProcessedAt  │
│ evt-123      NULL         │ ← Not processed yet
└───────────────┬───────────┘
                │
                │ Process Event
                ↓
         ┌──────────────┐
         │ Reserve Stock│
         └──────┬───────┘
                │
                ↓
┌───────────────────────────┐
│  ProcessedEvents Table    │
├───────────────────────────┤
│ EventId      ProcessedAt  │
│ evt-123      2026-09-18   │ ← Mark as processed
└───────────────────────────┘

If Duplicate Event Arrives:
┌────────────────┐
│ Message Broker │
└────────┬───────┘
         │ OrderCreated (DUPLICATE)
         │ EventId: "evt-123"
         ↓
┌────────────────────┐
│  Inventory Service │
└────────┬───────────┘
         │
         │ Check Idempotency
         ↓
┌───────────────────────────┐
│  ProcessedEvents Table    │
├───────────────────────────┤
│ EventId      ProcessedAt  │
│ evt-123      2026-09-18   │ ← Already processed!
└───────────────┬───────────┘
                │
                │ ✓ Skip Processing
                │ ✓ ACK Message
                ↓
         [No side effects]
```

### HTTP Request Idempotency
```
Prevent Duplicate HTTP Requests

┌─────────┐
│ Client  │
└────┬────┘
     │ POST /orders
     │ Idempotency-Key: "key-abc"
     │ (Network timeout, retry)
     ↓
┌────────────────┐
│  Order Service │
└────────┬───────┘
         │
         │ Check Idempotency Key
         ↓
┌─────────────────────────────────┐
│     IdempotencyKeys Table       │
├─────────────────────────────────┤
│ Key         Response  CreatedAt │
│ key-abc     NULL      NOW()     │ ← First request
└─────────────┬───────────────────┘
              │
              │ Process Request
              ↓
       ┌──────────────┐
       │ Create Order │
       │ OrderId: 123 │
       └──────┬───────┘
              │
              ↓
┌─────────────────────────────────┐
│     IdempotencyKeys Table       │
├─────────────────────────────────┤
│ Key         Response  CreatedAt │
│ key-abc     {order:123} NOW()   │ ← Store response
└─────────────────────────────────┘

Retry Request:
┌─────────┐
│ Client  │
└────┬────┘
     │ POST /orders (RETRY)
     │ Idempotency-Key: "key-abc"
     ↓
┌────────────────┐
│  Order Service │
└────────┬───────┘
         │
         │ Check Idempotency Key
         ↓
┌─────────────────────────────────┐
│     IdempotencyKeys Table       │
├─────────────────────────────────┤
│ Key         Response  CreatedAt │
│ key-abc     {order:123} 2 min   │ ← Found!
└─────────────┬───────────────────┘
              │
              │ ✓ Return Cached Response
              ↓
       ┌──────────────┐
       │ Same OrderId │
       │ OrderId: 123 │
       └──────────────┘
```

## 6. Distributed Tracing Example

```
Single Request Across Multiple Services

Customer Request → Complete Trace

TraceId: "trace-abc-123" (Unique per customer request)

┌─────────────────────────────────────────────┐
│        Span 1: API Gateway                  │
│  SpanId: span-1                            │
│  Duration: 850ms                           │
│  ┌─────────────────────────────────────┐   │
│  │  Tags:                              │   │
│  │  - http.method: POST                │   │
│  │  - http.path: /orders               │   │
│  │  - http.status: 200                 │   │
│  └─────────────────────────────────────┘   │
│                                            │
│  ┌────────────────────────────────────────┐│
│  │   Span 2: Order Service               ││
│  │   SpanId: span-2, Parent: span-1      ││
│  │   Duration: 800ms                     ││
│  │   ┌──────────────────────────────┐    ││
│  │   │ Tags:                        │    ││
│  │   │ - service: order-service     │    ││
│  │   │ - order.id: 123              │    ││
│  │   └──────────────────────────────┘    ││
│  │                                       ││
│  │   ┌──────────────────────────────────┐││
│  │   │  Span 3: Inventory Service      │││
│  │   │  SpanId: span-3, Parent: span-2 │││
│  │   │  Duration: 150ms                │││
│  │   │  ┌─────────────────────────┐    │││
│  │   │  │ Tags:                   │    │││
│  │   │  │ - service: inventory    │    │││
│  │   │  │ - reserved: true        │    │││
│  │   │  │ - quantity: 2           │    │││
│  │   │  └─────────────────────────┘    │││
│  │   └──────────────────────────────────┘││
│  │                                       ││
│  │   ┌──────────────────────────────────┐││
│  │   │  Span 4: Payment Service        │││
│  │   │  SpanId: span-4, Parent: span-2 │││
│  │   │  Duration: 600ms                │││
│  │   │  ┌─────────────────────────┐    │││
│  │   │  │ Tags:                   │    │││
│  │   │  │ - service: payment      │    │││
│  │   │  │ - provider: stripe      │    │││
│  │   │  │ - amount: 99.99         │    │││
│  │   │  │                         │    │││
│  │   │  │ Span 5: Stripe API Call │    │││
│  │   │  │ Duration: 550ms         │    │││
│  │   │  └─────────────────────────┘    │││
│  │   └──────────────────────────────────┘││
│  └────────────────────────────────────────┘│
└─────────────────────────────────────────────┘

Visualization in Jaeger:
Gateway (850ms)
  └─ Order Service (800ms)
      ├─ Inventory Service (150ms)
      └─ Payment Service (600ms)
          └─ Stripe API (550ms)

Critical Path: Gateway → Order → Payment → Stripe
Bottleneck: Stripe API call (550ms / 850ms = 65% of total time)
```

## 7. Circuit Breaker State Transitions

```
Protecting Against Cascading Failures

Normal Operation (CLOSED):
┌──────────────┐
│ Order Service│
└──────┬───────┘
       │ Call Payment Service
       │ Success Rate: 95%
       ↓
┌──────────────┐
│   Payment    │ ✓ Healthy
│   Service    │
└──────────────┘

Circuit Breaker Metrics:
- Requests: 100
- Failures: 5
- Success Rate: 95% → CIRCUIT CLOSED ✓


Degraded Service (OPEN):
┌──────────────┐
│ Order Service│
└──────┬───────┘
       │ Payment Service calls failing
       │ Failure Rate: 60%
       ↓
┌──────────────┐
│ Circuit      │
│ Breaker      │ ❌ THRESHOLD EXCEEDED
└──────┬───────┘
       │
       │ Circuit State: OPEN
       ↓
┌──────────────────────────────┐
│ All requests FAIL FAST       │
│ Return: 503 Service Unavailable │
│ No calls to Payment Service  │
└──────────────────────────────┘

Circuit Breaker Metrics:
- Requests: 100
- Failures: 60
- Failure Rate: 60% > 50% threshold → CIRCUIT OPEN ❌


Recovery Testing (HALF-OPEN):
After timeout (30 seconds):
┌──────────────┐
│ Circuit      │
│ Breaker      │ Circuit State: HALF-OPEN
└──────┬───────┘
       │
       │ Allow LIMITED requests
       ↓
┌──────────────┐
│   Payment    │ Trial Requests
│   Service    │
└──────────────┘

If SUCCESS:
  Circuit → CLOSED ✓
  Resume normal operation

If FAILURE:
  Circuit → OPEN ❌
  Wait another 30 seconds
```

## 8. Event Versioning Strategy

```
Handling Schema Evolution

Producer (Order Service):
┌────────────────────────────┐
│ OrderCreated Event v1      │
├────────────────────────────┤
│ {                          │
│   "eventType": "OrderCreated.v1",
│   "orderId": "123",        │
│   "customerId": "456",     │
│   "total": 99.99           │
│ }                          │
└────────────┬───────────────┘
             │
             ↓
┌────────────────────────────┐
│ OrderCreated Event v2      │
├────────────────────────────┤
│ {                          │
│   "eventType": "OrderCreated.v2",
│   "orderId": "123",        │
│   "customerId": "456",     │
│   "total": 99.99,          │
│   "currency": "USD",       │ ← New field
│   "items": [...]           │ ← New field
│ }                          │
└────────────┬───────────────┘
             │
             ↓
      ┌─────────────┐
      │   Message   │
      │   Broker    │
      └──────┬──────┘
             │
       ┌─────┴─────┐
       │           │
       ↓           ↓
┌─────────┐  ┌─────────┐
│Consumer1│  │Consumer2│
│(Old v1) │  │(New v2) │
└────┬────┘  └────┬────┘
     │            │
     │ v1 Handler │ v2 Handler
     ↓            ↓
   Works!       Works!

Strategy: Support both versions during transition
```

## Summary

These event flows demonstrate the key distributed patterns:

1. **Happy Path**: Complete order flow from checkout to delivery
2. **Compensation**: Payment failure triggers inventory release
3. **Saga Patterns**: Choreography vs Orchestration trade-offs
4. **Outbox Pattern**: Atomic writes with guaranteed delivery
5. **Idempotency**: Handling duplicate events and requests
6. **Distributed Tracing**: Request flow across services
7. **Circuit Breaker**: Protection against cascading failures
8. **Event Versioning**: Schema evolution strategy

All flows ensure:
- ✓ Eventual consistency
- ✓ Fault tolerance
- ✓ No data loss
- ✓ Observability
- ✓ Scalability

