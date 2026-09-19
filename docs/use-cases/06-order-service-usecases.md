# Order Service - Use Cases

## Actors
- **Customer**: End user placing orders
- **Seller**: Vendor fulfilling orders
- **Admin**: System administrator
- **System**: Other microservices

## Use Cases

### UC-ORD-001: Create Order
**Primary Actor**: Customer  
**Precondition**: Customer authenticated, cart has items  
**Main Flow**:
1. Customer initiates checkout with:
   - Shipping address
   - Payment method
   - Delivery preferences
2. System validates customer authentication
3. System retrieves and validates cart from Cart Service
4. System validates shipping address
5. System calculates order totals:
   - Subtotal
   - Tax
   - Shipping fee
   - Discount (if coupon applied)
   - Grand total
6. System generates unique OrderId
7. System creates order with status = PENDING
8. System creates order items with price snapshots
9. System stores order in database
10. System publishes OrderCreated event with:
    - OrderId
    - CustomerId
    - Items (ProductId, Quantity, Price)
    - TotalAmount
    - ShippingAddress
11. System commits transaction and stores in Outbox
12. System returns order confirmation with OrderId

**Alternative Flow**:
- 3a. Cart empty → Return "Cart is empty"
- 3b. Cart invalid → Return validation errors
- 4a. Invalid address → Return "Invalid shipping address"

**Postcondition**: Order created, event published, saga initiated

---

### UC-ORD-002: Get Order Details
**Primary Actor**: Customer  
**Precondition**: Order exists, customer owns order  
**Main Flow**:
1. Customer requests order by OrderId
2. System validates customer authentication
3. System retrieves order from database
4. System validates customer owns order
5. System enriches order with:
   - Product details (from cache/Product Service)
   - Payment status
   - Shipping status
   - Timeline events
6. System returns complete order details

**Alternative Flow**:
- 3a. Order not found → Return 404
- 4a. Unauthorized → Return 403 Forbidden

**Postcondition**: Order details returned

---

### UC-ORD-003: List Customer Orders
**Primary Actor**: Customer  
**Precondition**: Customer authenticated  
**Main Flow**:
1. Customer requests order history with filters:
   - Status (all, pending, confirmed, shipped, delivered, cancelled)
   - Date range
   - Pagination
2. System validates authentication
3. System queries orders for customer
4. System applies filters and sorting (newest first)
5. System returns paginated order list with summary

**Alternative Flow**:
- 3a. No orders found → Return empty list

**Postcondition**: Order list displayed

---

### UC-ORD-004: Handle Inventory Reserved Event
**Primary Actor**: System (Inventory Service)  
**Precondition**: OrderCreated event processed by Inventory  
**Main Flow**:
1. System receives InventoryReserved event with OrderId
2. System validates event idempotency (check EventId)
3. System retrieves order by OrderId
4. System validates order status = PENDING
5. System updates order status = INVENTORY_RESERVED
6. System stores processed event ID
7. System publishes InventoryReservedReceived event
8. System initiates payment step (publish InitiatePayment event)

**Alternative Flow**:
- 2a. Duplicate event → Skip processing
- 3a. Order not found → Log error, skip
- 4a. Invalid status → Log warning, skip

**Postcondition**: Order progresses to payment step

---

### UC-ORD-005: Handle Inventory Reservation Failed Event
**Primary Actor**: System (Inventory Service)  
**Precondition**: Inventory reservation failed  
**Main Flow**:
1. System receives InventoryReservationFailed event
2. System validates event idempotency
3. System retrieves order
4. System updates order status = CANCELLED
5. System sets cancellation reason = "Out of stock"
6. System publishes OrderCancelled event
7. System stores processed event ID
8. Notification Service sends cancellation email to customer

**Alternative Flow**:
- 2a. Duplicate event → Skip processing

**Postcondition**: Order cancelled due to insufficient inventory

---

### UC-ORD-006: Handle Payment Completed Event
**Primary Actor**: System (Payment Service)  
**Precondition**: Payment processed successfully  
**Main Flow**:
1. System receives PaymentCompleted event with:
   - OrderId
   - PaymentId
   - TransactionId
   - Amount
2. System validates event idempotency
3. System retrieves order
4. System validates order status = INVENTORY_RESERVED
5. System validates payment amount = order total
6. System updates order:
   - Status = CONFIRMED
   - PaymentId
   - PaidAt timestamp
7. System stores processed event ID
8. System publishes OrderConfirmed event
9. System commits transaction with Outbox

**Alternative Flow**:
- 2a. Duplicate event → Skip processing
- 5a. Amount mismatch → Log error, manual review

**Postcondition**: Order confirmed, shipment creation initiated

---

### UC-ORD-007: Handle Payment Failed Event
**Primary Actor**: System (Payment Service)  
**Precondition**: Payment processing failed  
**Main Flow**:
1. System receives PaymentFailed event with:
   - OrderId
   - Reason
2. System validates event idempotency
3. System retrieves order
4. System updates order status = PAYMENT_FAILED
5. System stores failure reason
6. System publishes OrderPaymentFailed event
7. System stores processed event ID
8. Inventory Service releases reservation (compensation)
9. Notification Service notifies customer

**Alternative Flow**:
- 2a. Duplicate event → Skip processing

**Postcondition**: Order payment failed, inventory released, customer notified

---

### UC-ORD-008: Handle Shipment Created Event
**Primary Actor**: System (Shipping Service)  
**Precondition**: Order confirmed and shipment created  
**Main Flow**:
1. System receives ShipmentCreated event with:
   - OrderId
   - ShipmentId
   - TrackingNumber
   - Carrier
2. System validates event idempotency
3. System retrieves order
4. System updates order:
   - Status = PROCESSING
   - ShipmentId
   - TrackingNumber
5. System stores processed event ID
6. System publishes OrderShipmentCreated event
7. Notification Service sends tracking email

**Alternative Flow**:
- 2a. Duplicate event → Skip processing

**Postcondition**: Order tracking information updated

---

### UC-ORD-009: Handle Order Shipped Event
**Primary Actor**: System (Shipping Service)  
**Precondition**: Order dispatched by carrier  
**Main Flow**:
1. System receives OrderShipped event with:
   - OrderId
   - ShippedAt timestamp
   - EstimatedDelivery date
2. System validates event idempotency
3. System retrieves order
4. System updates order:
   - Status = SHIPPED
   - ShippedAt
   - EstimatedDeliveryAt
5. System stores processed event ID
6. Notification Service notifies customer

**Postcondition**: Order status updated to shipped

---

### UC-ORD-010: Handle Order Delivered Event
**Primary Actor**: System (Shipping Service)  
**Precondition**: Order delivered to customer  
**Main Flow**:
1. System receives OrderDelivered event with:
   - OrderId
   - DeliveredAt timestamp
   - SignedBy (optional)
2. System validates event idempotency
3. System retrieves order
4. System updates order:
   - Status = DELIVERED
   - DeliveredAt
5. System stores processed event ID
6. System publishes OrderCompleted event
7. Notification Service sends delivery confirmation
8. Review Service prompts customer for review

**Postcondition**: Order completed successfully

---

### UC-ORD-011: Cancel Order (Customer Initiated)
**Primary Actor**: Customer  
**Precondition**: Order exists, order not yet shipped  
**Main Flow**:
1. Customer requests order cancellation
2. System validates customer owns order
3. System retrieves order
4. System validates order status allows cancellation:
   - PENDING, INVENTORY_RESERVED, CONFIRMED, PROCESSING
5. System updates order status = CANCELLING
6. System publishes OrderCancellationRequested event
7. System initiates compensation saga:
   - If payment completed → Initiate refund
   - Release inventory reservation
8. System updates order status = CANCELLED
9. System publishes OrderCancelled event
10. System stores cancellation reason

**Alternative Flow**:
- 2a. Unauthorized → Return 403
- 4a. Order already shipped → Return "Cannot cancel shipped order"
- 4b. Order already cancelled → Return 400

**Postcondition**: Order cancelled, refund initiated, inventory released

---

### UC-ORD-012: Cancel Order (Admin/System)
**Primary Actor**: Admin, System  
**Precondition**: Order exists  
**Main Flow**:
1. Admin cancels order with reason (fraud, error, etc.)
2. System validates admin permission
3. System updates order status = CANCELLED
4. System publishes OrderCancelled event
5. System initiates full compensation
6. Notification Service notifies customer

**Postcondition**: Order cancelled by admin

---

### UC-ORD-013: Update Order Status
**Primary Actor**: System  
**Precondition**: Status transition event received  
**Main Flow**:
1. System receives status update event
2. System validates state transition is valid:
   ```
   PENDING → INVENTORY_RESERVED → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
                ↓                      ↓           ↓
             CANCELLED            CANCELLED   CANCELLED
   ```
3. System updates order status
4. System creates status history record with:
   - OrderId
   - FromStatus
   - ToStatus
   - Timestamp
   - Reason
   - TriggeredBy
5. System publishes OrderStatusChanged event

**Alternative Flow**:
- 2a. Invalid transition → Log error, skip update

**Postcondition**: Order status updated with audit trail

---

### UC-ORD-014: Calculate Order Totals
**Primary Actor**: System  
**Precondition**: Order items provided  
**Main Flow**:
1. System calculates subtotal (sum of item prices × quantities)
2. System applies coupon discount (if applicable)
3. System calculates tax based on shipping address
4. System calculates shipping fee based on:
   - Weight
   - Destination
   - Shipping method
5. System calculates grand total:
   - Total = Subtotal - Discount + Tax + Shipping
6. System returns order totals breakdown

**Postcondition**: Order totals calculated

---

### UC-ORD-015: Apply Coupon to Order
**Primary Actor**: Customer  
**Precondition**: Valid coupon code provided  
**Main Flow**:
1. Customer applies coupon during checkout
2. System validates coupon with Promotion Service
3. System calculates discount amount
4. System stores coupon details in order
5. System recalculates order total
6. System returns updated order

**Alternative Flow**:
- 2a. Invalid coupon → Return error
- 2b. Coupon conditions not met → Return error

**Postcondition**: Coupon applied, total recalculated

---

### UC-ORD-016: Get Order Status
**Primary Actor**: Customer  
**Precondition**: Order exists  
**Main Flow**:
1. Customer requests order status by OrderId
2. System validates customer owns order
3. System retrieves current status and timeline
4. System returns:
   - Current status
   - Status history with timestamps
   - Next expected status
   - Estimated delivery (if applicable)

**Postcondition**: Order status returned

---

### UC-ORD-017: Initiate Order Refund
**Primary Actor**: Customer, Admin  
**Precondition**: Order delivered, within refund window  
**Main Flow**:
1. User requests refund with reason
2. System validates refund eligibility
3. System creates refund request with status = PENDING
4. System publishes RefundRequested event
5. System returns refund request details
6. Admin reviews and approves/rejects
7. If approved → Payment Service processes refund

**Alternative Flow**:
- 2a. Outside refund window → Return "Refund period expired"
- 2b. Already refunded → Return 400

**Postcondition**: Refund request created

---

### UC-ORD-018: Track Order
**Primary Actor**: Customer  
**Precondition**: Order has tracking number  
**Main Flow**:
1. Customer requests tracking information
2. System retrieves order and shipment details
3. System queries Shipping Service for latest tracking events
4. System returns timeline with:
   - Order placed
   - Payment confirmed
   - Order shipped
   - In transit updates
   - Out for delivery
   - Delivered
5. System displays map/route (if available)

**Alternative Flow**:
- 3a. No tracking available yet → Return "Tracking not available"

**Postcondition**: Tracking information displayed

---

### UC-ORD-019: Handle Partial Fulfillment
**Primary Actor**: System  
**Precondition**: Multi-item order, some items unavailable  
**Main Flow**:
1. System detects partial inventory availability
2. System offers customer options:
   - Ship available items now, backorder rest
   - Wait for all items
   - Cancel unavailable items
3. Customer selects option
4. System splits order or adjusts accordingly
5. System publishes OrderAdjusted event

**Postcondition**: Partial fulfillment handled

---

### UC-ORD-020: Generate Order Invoice
**Primary Actor**: Customer, System  
**Precondition**: Order confirmed  
**Main Flow**:
1. System generates invoice PDF with:
   - Order details
   - Item breakdown
   - Totals
   - Tax details
   - Payment method
   - Shipping address
2. System stores invoice URL
3. System returns invoice link
4. Customer can download invoice

**Postcondition**: Invoice generated and accessible

