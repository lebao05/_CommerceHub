# Inventory Service - Use Cases

## Actors
- **Customer**: End user (indirect, through Order Service)
- **Seller**: Vendor managing stock
- **Admin**: System administrator
- **System**: Other microservices (Order, Product)

## Use Cases

### UC-INV-001: Add Stock
**Primary Actor**: Seller, Admin  
**Precondition**: Product exists, user has permission  
**Main Flow**:
1. User provides product ID and quantity to add
2. System validates product exists
3. System validates quantity > 0
4. System uses optimistic concurrency or lock
5. System retrieves current stock
6. System adds quantity to available stock
7. System creates stock movement record
8. System commits transaction
9. System publishes StockAdded event
10. System returns updated stock level

**Alternative Flow**:
- 2a. Product not found → Return "Product not found"
- 4a. Concurrency conflict → Retry operation

**Postcondition**: Stock increased, event published

---

### UC-INV-002: Remove Stock (Manual)
**Primary Actor**: Seller, Admin  
**Precondition**: Product has stock  
**Main Flow**:
1. User provides product ID and quantity to remove
2. System validates quantity > 0
3. System validates sufficient available stock
4. System uses pessimistic lock or optimistic concurrency
5. System deducts quantity from available stock
6. System creates stock movement record (reason: damaged/lost/returned)
7. System commits transaction
8. System publishes StockRemoved event
9. System returns updated stock

**Alternative Flow**:
- 3a. Insufficient stock → Return "Insufficient stock available"

**Postcondition**: Stock decreased

---

### UC-INV-003: Reserve Inventory (Order Creation)
**Primary Actor**: System (Order Service)  
**Precondition**: OrderCreated event received  
**Main Flow**:
1. System receives OrderCreated event with items
2. System validates event idempotency (check EventId)
3. System starts database transaction
4. For each order item:
   a. System locks inventory row (pessimistic lock)
   b. System checks available quantity >= requested
   c. System moves quantity from available to reserved
   d. System creates reservation record with:
      - OrderId
      - ProductId
      - Quantity
      - ExpiresAt (30 minutes)
      - Status: RESERVED
5. System commits transaction
6. System publishes InventoryReserved event
7. System stores processed event ID

**Alternative Flow**:
- 2a. Duplicate event → Return success (idempotent)
- 4b. Insufficient stock → Rollback, publish InventoryReservationFailed event
- 5a. Transaction fails → Retry, then publish failure event

**Postcondition**: Inventory reserved for order

---

### UC-INV-004: Release Inventory (Order Cancelled/Payment Failed)
**Primary Actor**: System (Order Service)  
**Precondition**: InventoryReleaseRequested or PaymentFailed event received  
**Main Flow**:
1. System receives release event with OrderId
2. System validates event idempotency
3. System starts transaction
4. System retrieves reservation by OrderId
5. System validates reservation exists and status = RESERVED
6. System moves quantity from reserved back to available
7. System updates reservation status to RELEASED
8. System commits transaction
9. System publishes InventoryReleased event
10. System stores processed event ID

**Alternative Flow**:
- 2a. Duplicate event → Return success
- 4a. Reservation not found → Log warning, return success
- 5a. Already released → Return success (idempotent)

**Postcondition**: Reserved inventory returned to available stock

---

### UC-INV-005: Confirm Reservation (Order Confirmed/Payment Success)
**Primary Actor**: System (Order Service)  
**Precondition**: PaymentCompleted event received  
**Main Flow**:
1. System receives PaymentCompleted event with OrderId
2. System validates event idempotency
3. System retrieves reservation by OrderId
4. System validates reservation status = RESERVED
5. System updates reservation status to CONFIRMED
6. System deducts reserved quantity (moves to sold)
7. System creates stock movement record
8. System commits transaction
9. System publishes InventoryConfirmed event
10. System stores processed event ID

**Alternative Flow**:
- 2a. Duplicate event → Return success
- 3a. Reservation not found → Publish error event
- 4a. Already confirmed → Return success (idempotent)

**Postcondition**: Reserved inventory confirmed and deducted

---

### UC-INV-006: Get Stock Level
**Primary Actor**: Customer, System  
**Precondition**: Product exists  
**Main Flow**:
1. User requests stock for product ID
2. System retrieves inventory record
3. System calculates:
   - Available = Total - Reserved
   - Status = InStock | LowStock | OutOfStock
4. System returns stock information:
   - Available quantity
   - Reserved quantity
   - Status

**Alternative Flow**:
- 2a. Product not in inventory → Return stock = 0

**Postcondition**: Stock level returned

---

### UC-INV-007: Check Bulk Availability
**Primary Actor**: System (Cart/Order Service)  
**Precondition**: Multiple products to check  
**Main Flow**:
1. System receives list of product IDs and quantities
2. System retrieves inventory for all products in single query
3. For each product:
   - Check if available quantity >= requested
   - Mark as available or unavailable
4. System returns availability result for all products

**Alternative Flow**:
- 2a. Some products not in inventory → Mark as unavailable

**Postcondition**: Bulk availability result returned

---

### UC-INV-008: Handle Reservation Expiration
**Primary Actor**: System (Background Job)  
**Precondition**: Reservation expired (> 30 minutes)  
**Main Flow**:
1. Background job runs every 5 minutes
2. System queries reservations where:
   - Status = RESERVED
   - ExpiresAt < NOW
3. For each expired reservation:
   a. System starts transaction
   b. System moves quantity from reserved to available
   c. System updates reservation status to EXPIRED
   d. System commits transaction
   e. System publishes ReservationExpired event
4. System logs expired reservations

**Postcondition**: Expired reservations released

---

### UC-INV-009: Set Low Stock Threshold
**Primary Actor**: Seller, Admin  
**Precondition**: Product exists  
**Main Flow**:
1. User sets low stock threshold (e.g., 10 units)
2. System validates threshold >= 0
3. System updates inventory record
4. System returns success

**Postcondition**: Low stock threshold configured

---

### UC-INV-010: Low Stock Alert
**Primary Actor**: System  
**Precondition**: Stock falls below threshold  
**Main Flow**:
1. System detects available stock < threshold
2. System checks if alert already sent (within 24 hours)
3. System publishes LowStockAlert event with:
   - ProductId
   - CurrentStock
   - Threshold
   - Timestamp
4. System updates last alert timestamp
5. Notification Service sends alert to seller/admin

**Alternative Flow**:
- 2a. Alert recently sent → Skip to avoid spam

**Postcondition**: Low stock alert sent

---

### UC-INV-011: Sync Product Inventory (Product Created)
**Primary Actor**: System (Product Service)  
**Precondition**: ProductCreated event received  
**Main Flow**:
1. System receives ProductCreated event
2. System validates event idempotency
3. System creates inventory record with:
   - ProductId
   - AvailableQuantity = 0
   - ReservedQuantity = 0
   - LowStockThreshold = 5 (default)
4. System stores processed event ID
5. System returns success

**Alternative Flow**:
- 2a. Duplicate event → Skip processing

**Postcondition**: Inventory record created for new product

---

### UC-INV-012: Handle Product Deletion
**Primary Actor**: System (Product Service)  
**Precondition**: ProductDeleted event received  
**Main Flow**:
1. System receives ProductDeleted event
2. System validates no active reservations exist
3. System soft deletes inventory record
4. System stores processed event ID

**Alternative Flow**:
- 2a. Active reservations exist → Log warning, wait for expiration

**Postcondition**: Inventory record archived

---

### UC-INV-013: Adjust Inventory (Stock Take/Correction)
**Primary Actor**: Seller, Admin  
**Precondition**: Physical stock count completed  
**Main Flow**:
1. User provides actual stock count
2. System retrieves current system stock
3. System calculates difference
4. System validates adjustment reason provided
5. System updates available quantity to actual count
6. System creates adjustment record with:
   - OldQuantity
   - NewQuantity
   - Difference
   - Reason
   - AdjustedBy
7. System publishes StockAdjusted event
8. System returns adjustment summary

**Postcondition**: Inventory adjusted to match physical count

---

### UC-INV-014: Transfer Stock Between Warehouses
**Primary Actor**: Admin  
**Precondition**: Multiple warehouses configured  
**Main Flow**:
1. Admin initiates stock transfer
2. System validates source warehouse has stock
3. System validates destination warehouse exists
4. System starts transaction
5. System deducts from source warehouse
6. System adds to destination warehouse
7. System creates transfer record
8. System commits transaction
9. System publishes StockTransferred event
10. System returns transfer confirmation

**Alternative Flow**:
- 2a. Insufficient stock → Return error

**Postcondition**: Stock transferred between warehouses

---

### UC-INV-015: Get Inventory History
**Primary Actor**: Seller, Admin  
**Precondition**: Product exists  
**Main Flow**:
1. User requests inventory history for product
2. System retrieves stock movement records with filters:
   - Date range
   - Movement type (added, removed, reserved, sold, adjusted)
   - Warehouse (if applicable)
3. System returns paginated history with:
   - Timestamp
   - Type
   - Quantity change
   - Reference (OrderId, AdjustmentId)
   - User
   - Balance after

**Postcondition**: Inventory history displayed

---

### UC-INV-016: Prevent Overselling
**Primary Actor**: System  
**Precondition**: Multiple concurrent reservation attempts  
**Main Flow**:
1. Multiple orders request same product simultaneously
2. System uses database row-level locking (SELECT FOR UPDATE)
3. First transaction acquires lock
4. First transaction reserves stock, commits
5. Second transaction waits for lock
6. Second transaction checks remaining stock
7. If sufficient → reserve, commit
8. If insufficient → rollback, return failure

**Alternative Flow**:
- 8a. Stock exhausted → Publish OutOfStockAlert event

**Postcondition**: Overselling prevented through locking

---

### UC-INV-017: Backorder Management
**Primary Actor**: Customer, System  
**Precondition**: Product out of stock  
**Main Flow**:
1. Customer attempts to order out-of-stock product
2. System offers backorder option
3. Customer accepts backorder
4. System creates backorder record with expected date
5. System publishes BackorderCreated event
6. When stock arrives → System fulfills backorder
7. System notifies customer

**Postcondition**: Backorder created and tracked

