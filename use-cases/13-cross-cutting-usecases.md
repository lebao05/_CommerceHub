# Cross-Cutting Use Cases - Saga, Outbox, Events & Patterns

## Actors
- **System**: Microservices orchestrating distributed workflows
- **Message Broker**: RabbitMQ/Kafka handling events
- **Database**: Service-specific databases with outbox tables

## Saga Pattern Use Cases

### UC-SAGA-001: Execute Choreography-Based Saga (Order Checkout)
**Primary Actor**: System  
**Precondition**: Customer initiates checkout  
**Main Flow**:
1. Order Service creates order with status = PENDING
2. Order Service publishes OrderCreated event
3. Order Service commits transaction with outbox
4. Inventory Service receives OrderCreated event:
   - Reserves inventory
   - Publishes InventoryReserved event
5. Payment Service receives InventoryReserved event:
   - Processes payment
   - Publishes PaymentCompleted event
6. Order Service receives PaymentCompleted event:
   - Updates status = CONFIRMED
   - Publishes OrderConfirmed event
7. Shipping Service receives OrderConfirmed event:
   - Creates shipment
   - Publishes ShipmentCreated event
8. Notification Service receives events:
   - Sends confirmation emails

**Alternative Flow (Compensation)**:
- 5a. Payment fails:
  * Payment Service publishes PaymentFailed event
  * Inventory Service receives PaymentFailed
  * Inventory Service releases reservation
  * Order Service updates status = CANCELLED

**Postcondition**: Order saga completed or compensated

---

### UC-SAGA-002: Execute Orchestration-Based Saga
**Primary Actor**: Order Service (Orchestrator)  
**Precondition**: Customer initiates checkout  
**Main Flow**:
1. Order Service (orchestrator) creates saga instance:
   - SagaId: unique identifier
   - State: STARTED
   - Steps: [reserve_inventory, process_payment, create_shipment]
2. Step 1: Reserve Inventory
   - Order Service sends ReserveInventoryCommand
   - Inventory Service processes and replies
   - Order Service receives InventoryReserved reply
3. Step 2: Process Payment
   - Order Service sends ProcessPaymentCommand
   - Payment Service processes and replies
   - Order Service receives PaymentCompleted reply
4. Step 3: Create Shipment
   - Order Service sends CreateShipmentCommand
   - Shipping Service processes and replies
   - Order Service receives ShipmentCreated reply
5. Order Service updates saga state = COMPLETED
6. Order Service updates order status = CONFIRMED

**Alternative Flow (Compensation)**:
- 3a. Payment fails:
  * Order Service receives PaymentFailed
  * Order Service executes compensation steps in reverse:
    - Send ReleaseInventoryCommand
    - Inventory Service releases reservation
  * Order Service updates saga state = COMPENSATED
  * Order Service updates order status = CANCELLED

**Postcondition**: Saga orchestrated with compensation on failure

---

### UC-SAGA-003: Handle Saga Timeout
**Primary Actor**: System (Saga Coordinator)  
**Precondition**: Saga step not completed within timeout  
**Main Flow**:
1. Saga started with timeout per step (e.g., 5 minutes)
2. Step execution exceeds timeout
3. Saga Coordinator detects timeout
4. Saga Coordinator marks step as TIMED_OUT
5. Saga Coordinator initiates compensation:
   - Rollback completed steps
6. Saga Coordinator updates saga state = FAILED
7. Saga Coordinator publishes SagaFailed event
8. Saga Coordinator logs timeout for analysis

**Postcondition**: Timed-out saga compensated

---

### UC-SAGA-004: Retry Saga Step
**Primary Actor**: System  
**Precondition**: Saga step failed with retryable error  
**Main Flow**:
1. Saga step fails with transient error (timeout, network)
2. Saga Coordinator checks retry policy:
   - Max retries: 3
   - Backoff: exponential
3. Saga Coordinator increments retry count
4. If retry count < max:
   - Saga Coordinator waits for backoff period
   - Saga Coordinator retries step
5. If step succeeds:
   - Continue to next step
6. If max retries exceeded:
   - Initiate compensation

**Alternative Flow**:
- 2a. Non-retryable error → Immediate compensation

**Postcondition**: Saga step retried or compensated

---

### UC-SAGA-005: Persist Saga State
**Primary Actor**: System  
**Precondition**: Saga in progress  
**Main Flow**:
1. Saga Coordinator executes saga step
2. After each step completion:
   - Saga Coordinator persists saga state:
     * SagaId
     * CurrentStep
     * CompletedSteps
     * PendingSteps
     * Compensation data
     * Timestamps
3. On service restart:
   - Saga Coordinator loads in-progress sagas
   - Saga Coordinator resumes from last persisted state
4. Saga Coordinator continues execution

**Postcondition**: Saga state persisted for recovery

---

## Outbox Pattern Use Cases

### UC-OUTBOX-001: Write to Outbox Table
**Primary Actor**: Service  
**Precondition**: Service needs to publish event  
**Main Flow**:
1. Service starts database transaction
2. Service performs business logic:
   - Create order
   - Update order status
3. Service writes event to outbox table:
   - EventId (UUID)
   - EventType (e.g., OrderCreated)
   - AggregateId (e.g., OrderId)
   - Payload (JSON)
   - CreatedAt
   - ProcessedAt (null)
4. Service commits transaction (atomic)
5. Business data and event saved together

**Alternative Flow**:
- 4a. Transaction fails → Rollback both business data and event

**Postcondition**: Event stored in outbox atomically

---

### UC-OUTBOX-002: Publish Outbox Messages
**Primary Actor**: Outbox Publisher (Background Job)  
**Precondition**: Messages in outbox table  
**Main Flow**:
1. Outbox Publisher polls outbox table every 5 seconds
2. Publisher queries unprocessed messages:
   - WHERE ProcessedAt IS NULL
   - ORDER BY CreatedAt
   - LIMIT 100
3. For each message:
   a. Publisher publishes to message broker
   b. Broker confirms receipt
   c. Publisher updates ProcessedAt timestamp
   d. Publisher marks as processed
4. Publisher continues polling

**Alternative Flow**:
- 3b. Publish fails → Retry with backoff, leave unprocessed
- 3c. Idempotency key ensures no duplicates

**Postcondition**: Outbox messages published to broker

---

### UC-OUTBOX-003: Handle Outbox Publisher Failure
**Primary Actor**: System  
**Precondition**: Outbox Publisher crashes  
**Main Flow**:
1. Outbox Publisher crashes during processing
2. Messages remain with ProcessedAt = NULL
3. Publisher restarts
4. Publisher queries unprocessed messages
5. Publisher reprocesses from where it stopped
6. Duplicate messages handled by consumer idempotency

**Postcondition**: Messages eventually published

---

### UC-OUTBOX-004: Clean Up Processed Outbox Messages
**Primary Actor**: System (Background Job)  
**Precondition**: Old processed messages accumulate  
**Main Flow**:
1. Cleanup job runs daily
2. Job queries processed messages:
   - WHERE ProcessedAt IS NOT NULL
   - AND ProcessedAt < NOW() - 7 DAYS
3. Job deletes or archives old messages
4. Job logs cleanup summary

**Postcondition**: Old outbox messages cleaned up

---

## Idempotency Use Cases

### UC-IDEM-001: Handle Duplicate Event
**Primary Actor**: Service (Event Consumer)  
**Precondition**: Duplicate event received  
**Main Flow**:
1. Service receives event with EventId
2. Service checks if EventId already processed:
   - Query ProcessedEvents table
3. If EventId exists:
   - Service logs duplicate detection
   - Service skips processing
   - Service acknowledges message
   - Service returns success
4. If EventId not exists:
   - Service processes event
   - Service stores EventId in ProcessedEvents
   - Service acknowledges message

**Alternative Flow**:
- 2a. Race condition → Use unique constraint to prevent duplicate processing

**Postcondition**: Duplicate event safely ignored

---

### UC-IDEM-002: Idempotent HTTP Request
**Primary Actor**: Client  
**Precondition**: Client retries HTTP request  
**Main Flow**:
1. Client sends request with Idempotency-Key header
2. Service receives request
3. Service checks if key already processed:
   - Query IdempotencyKeys table
4. If key exists:
   - Service retrieves stored response
   - Service returns cached response (same as original)
5. If key not exists:
   - Service processes request
   - Service stores idempotency key with response
   - Service returns response

**Alternative Flow**:
- 4a. Processing still in progress → Return 409 Conflict

**Postcondition**: Duplicate requests return same result

---

### UC-IDEM-003: Clean Up Idempotency Keys
**Primary Actor**: System (Background Job)  
**Precondition**: Old idempotency keys accumulate  
**Main Flow**:
1. Cleanup job runs daily
2. Job queries old idempotency records:
   - WHERE CreatedAt < NOW() - 24 HOURS
3. Job deletes expired keys
4. Job logs cleanup summary

**Postcondition**: Old idempotency keys cleaned up

---

## Event-Driven Architecture Use Cases

### UC-EVENT-001: Publish Domain Event
**Primary Actor**: Service  
**Precondition**: Domain state changed  
**Main Flow**:
1. Service completes business operation
2. Service creates domain event:
   - EventId (UUID)
   - EventType
   - AggregateId
   - Timestamp
   - CorrelationId
   - CausationId
   - Payload
   - Version
3. Service writes to outbox table
4. Service commits transaction
5. Outbox Publisher publishes to broker
6. Broker routes to subscribed services

**Postcondition**: Domain event published

---

### UC-EVENT-002: Consume Event with Retry
**Primary Actor**: Service (Consumer)  
**Precondition**: Event received from broker  
**Main Flow**:
1. Service receives event from queue
2. Service validates event schema
3. Service checks idempotency
4. Service processes event
5. Service acknowledges (ACK) message
6. Broker removes message from queue

**Alternative Flow**:
- 4a. Processing fails with transient error:
  * Service negatively acknowledges (NACK)
  * Broker requeues message
  * Service retries after delay
- 4b. Processing fails max retries:
  * Service sends to Dead Letter Queue
  * Service ACKs original message

**Postcondition**: Event consumed or sent to DLQ

---

### UC-EVENT-003: Handle Poison Message
**Primary Actor**: System  
**Precondition**: Message causes repeated failures  
**Main Flow**:
1. Service receives message
2. Service attempts processing
3. Processing fails repeatedly
4. After max retries (e.g., 3):
   - Service sends message to Dead Letter Queue
   - Service logs error details
   - Service ACKs original message
5. Admin reviews DLQ
6. Admin fixes data or code issue
7. Admin reprocesses message manually

**Postcondition**: Poison message isolated in DLQ

---

### UC-EVENT-004: Event Ordering
**Primary Actor**: System  
**Precondition**: Events must be processed in order  
**Main Flow**:
1. Service publishes events with sequence number
2. Broker uses partition key (e.g., OrderId)
3. All events for same aggregate go to same partition
4. Consumer processes events in order per partition
5. Consumer tracks last processed sequence number
6. Consumer rejects out-of-order events

**Alternative Flow**:
- 6a. Gap detected → Wait for missing event or request replay

**Postcondition**: Event ordering maintained per aggregate

---

### UC-EVENT-005: Event Versioning
**Primary Actor**: Service  
**Precondition**: Event schema evolved  
**Main Flow**:
1. Service publishes event with version:
   - OrderCreated.v1
   - OrderCreated.v2
2. Consumers subscribe to versions they support
3. Consumer receives event
4. Consumer checks event version
5. Consumer applies version-specific handler:
   - v1 handler for old events
   - v2 handler for new events
6. Consumer processes event

**Alternative Flow**:
- 4a. Unsupported version → Log error, send to DLQ

**Postcondition**: Event versioning supported

---

## Distributed Tracing Use Cases

### UC-TRACE-001: Propagate Trace Context
**Primary Actor**: System  
**Precondition**: Request enters system  
**Main Flow**:
1. API Gateway receives request
2. Gateway generates or extracts trace context:
   - TraceId (unique per request flow)
   - SpanId (unique per service)
   - ParentSpanId
3. Gateway injects context into headers:
   - traceparent: {version}-{trace-id}-{span-id}-{flags}
4. Service A receives request with context
5. Service A extracts context
6. Service A creates child span
7. Service A calls Service B with propagated context
8. Service B continues trace
9. All spans linked by TraceId

**Postcondition**: Trace context propagated across services

---

### UC-TRACE-002: Create Span for Operation
**Primary Actor**: Service  
**Precondition**: Service processing request  
**Main Flow**:
1. Service receives request with trace context
2. Service creates span:
   - SpanId (unique)
   - ParentSpanId (from context)
   - Operation name (e.g., "ProcessOrder")
   - StartTime
3. Service executes operation
4. Service records span attributes:
   - service.name
   - http.method
   - http.status_code
   - order.id
5. Service completes operation
6. Service ends span with EndTime
7. Service exports span to collector (Jaeger)

**Postcondition**: Operation traced in distributed trace

---

### UC-TRACE-003: Trace Async Event Flow
**Primary Actor**: System  
**Precondition**: Event published with trace context  
**Main Flow**:
1. Order Service publishes OrderCreated event
2. Order Service injects trace context into event:
   - TraceId
   - SpanId
3. Event sent to message broker
4. Inventory Service consumes event
5. Inventory Service extracts trace context
6. Inventory Service creates child span
7. Inventory Service processes event
8. Inventory Service ends span
9. Complete trace shows:
   - Order Service → Broker → Inventory Service

**Postcondition**: Async event flow traced

---

### UC-TRACE-004: Add Trace Annotations
**Primary Actor**: Service  
**Precondition**: Span in progress  
**Main Flow**:
1. Service creates span
2. Service adds custom annotations:
   - timestamp: "Inventory check started"
   - timestamp: "Payment initiated"
   - timestamp: "Payment completed"
3. Service adds tags:
   - order.amount: 99.99
   - payment.method: "stripe"
   - inventory.reserved: true
4. Service logs important events in span
5. Service ends span
6. Trace includes all annotations

**Postcondition**: Span enriched with annotations

---

## Circuit Breaker Use Cases

### UC-CB-001: Open Circuit Breaker
**Primary Actor**: System  
**Precondition**: Service experiencing high failure rate  
**Main Flow**:
1. Service calls downstream dependency
2. Circuit breaker tracks metrics:
   - Request count: 100
   - Failure count: 55
   - Failure rate: 55%
3. Failure rate > threshold (50%)
4. Circuit breaker state = OPEN
5. Subsequent requests:
   - Circuit breaker immediately rejects
   - Returns fallback response
   - Does not call downstream service
6. Circuit breaker logs state change
7. Circuit breaker publishes CircuitOpened event

**Postcondition**: Circuit breaker open, requests fail fast

---

### UC-CB-002: Half-Open Circuit Breaker
**Primary Actor**: System  
**Precondition**: Circuit open for timeout period  
**Main Flow**:
1. Circuit breaker has been open for 30 seconds
2. Circuit breaker state = HALF_OPEN
3. Circuit breaker allows limited trial requests
4. If trial requests succeed:
   - Circuit breaker state = CLOSED
   - Normal operation resumes
5. If trial requests fail:
   - Circuit breaker state = OPEN
   - Reset timeout period

**Postcondition**: Circuit breaker attempts recovery

---

### UC-CB-003: Provide Fallback Response
**Primary Actor**: Service  
**Precondition**: Circuit breaker open  
**Main Flow**:
1. Client calls service
2. Circuit breaker is open
3. Service provides fallback:
   - Return cached data
   - Return default values
   - Return partial data
   - Return degraded functionality
4. Service logs fallback used
5. Service returns fallback response to client

**Postcondition**: Graceful degradation with fallback

---

## Resilience Patterns Use Cases

### UC-RES-001: Retry with Exponential Backoff
**Primary Actor**: Service  
**Precondition**: Transient failure occurred  
**Main Flow**:
1. Service calls external API
2. Request fails with timeout
3. Service determines error is retryable
4. Service retries with backoff:
   - Attempt 1: Wait 1 second
   - Attempt 2: Wait 2 seconds
   - Attempt 3: Wait 4 seconds
5. If success → Return response
6. If all retries fail → Return error

**Alternative Flow**:
- 3a. Non-retryable error (4xx) → Don't retry

**Postcondition**: Transient failures handled with retry

---

### UC-RES-002: Implement Bulkhead Pattern
**Primary Actor**: Service  
**Precondition**: Service has multiple dependencies  
**Main Flow**:
1. Service isolates resource pools:
   - Thread pool for Payment: 20 threads
   - Thread pool for Inventory: 10 threads
   - Thread pool for Shipping: 10 threads
2. Payment service slows down
3. Payment pool saturates (20/20 threads busy)
4. Inventory and Shipping pools unaffected
5. Service continues processing inventory/shipping
6. Payment requests rejected when pool full

**Postcondition**: Failure isolated, other operations unaffected

---

This completes the comprehensive use case documentation for the E-Commerce Microservices Platform!

