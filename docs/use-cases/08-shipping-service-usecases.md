# Shipping Service - Use Cases

## Actors
- **Customer**: End user tracking shipment
- **Seller**: Vendor preparing shipment
- **Admin**: System administrator
- **System**: Other microservices (Order Service)
- **Shipping Provider**: External carrier (GHN, GHTK, DHL, FedEx)

## Use Cases

### UC-SHIP-001: Create Shipment
**Primary Actor**: System (Order Service)  
**Precondition**: Order confirmed, payment completed  
**Main Flow**:
1. System receives OrderConfirmed event with:
   - OrderId
   - CustomerId
   - ShippingAddress
   - Items (weight, dimensions)
   - ShippingMethod
2. System validates event idempotency (check EventId)
3. System generates unique ShipmentId
4. System selects shipping provider based on:
   - Shipping method
   - Destination
   - Package weight/size
5. System calculates shipping cost
6. System creates shipment record with status = CREATED
7. System stores processed event ID
8. System publishes ShipmentCreated event with ShipmentId
9. System returns shipment details

**Alternative Flow**:
- 2a. Duplicate event → Return existing ShipmentId
- 4a. No provider available for destination → Return error

**Postcondition**: Shipment created, ready for label generation

---

### UC-SHIP-002: Generate Shipping Label
**Primary Actor**: System  
**Precondition**: Shipment created  
**Main Flow**:
1. System retrieves shipment details
2. System selects shipping provider adapter
3. System calls provider API to create shipment with:
   - Sender address
   - Recipient address
   - Package details (weight, dimensions)
   - Service level
   - Insurance value
   - IdempotencyKey
4. Provider validates addresses
5. Provider generates tracking number
6. Provider returns shipping label PDF/image
7. System stores:
   - TrackingNumber
   - LabelUrl
   - Carrier
   - EstimatedDelivery
8. System updates shipment status = LABEL_GENERATED
9. System publishes ShippingLabelGenerated event
10. System returns label URL

**Alternative Flow**:
- 4a. Invalid address → Return validation error
- 5a. Provider API fails → Retry with backoff
- 5b. Provider timeout → Use circuit breaker, try backup

**Postcondition**: Shipping label generated with tracking number

---

### UC-SHIP-003: Book Pickup
**Primary Actor**: Seller, System  
**Precondition**: Shipping label generated  
**Main Flow**:
1. Seller/System requests carrier pickup
2. System retrieves shipment details
3. System calls provider pickup API with:
   - Pickup address
   - Pickup date/time window
   - Number of packages
   - Special instructions
4. Provider schedules pickup
5. Provider returns pickup confirmation
6. System stores pickup details
7. System updates shipment status = PICKUP_SCHEDULED
8. System publishes PickupScheduled event
9. System notifies seller of pickup time

**Alternative Flow**:
- 4a. No pickup slots available → Offer alternative dates
- 4b. Pickup booking fails → Allow manual dropoff

**Postcondition**: Pickup scheduled with carrier

---

### UC-SHIP-004: Mark Shipment as Picked Up
**Primary Actor**: Shipping Provider, System  
**Precondition**: Carrier collects package  
**Main Flow**:
1. Carrier scans package at pickup
2. Provider sends webhook notification
3. System receives pickup event
4. System validates webhook signature
5. System validates event idempotency
6. System updates shipment status = IN_TRANSIT
7. System stores pickup timestamp
8. System publishes ShipmentPickedUp event
9. System notifies customer shipment is on the way

**Alternative Flow**:
- 5a. Duplicate event → Return 200 (idempotent)

**Postcondition**: Shipment marked as in transit

---

### UC-SHIP-005: Track Shipment
**Primary Actor**: Customer  
**Precondition**: Shipment has tracking number  
**Main Flow**:
1. Customer enters tracking number or OrderId
2. System retrieves shipment by tracking number
3. System calls provider tracking API
4. Provider returns tracking events:
   - Picked up
   - In transit
   - At sorting facility
   - Out for delivery
   - Delivered
5. System enriches tracking data with:
   - Current location
   - Estimated delivery
   - Delivery exceptions (if any)
6. System caches tracking data (5 min TTL)
7. System returns tracking timeline to customer

**Alternative Flow**:
- 2a. Tracking number not found → Return 404
- 3a. Provider API unavailable → Return cached data

**Postcondition**: Tracking information displayed

---

### UC-SHIP-006: Handle Tracking Update Webhook
**Primary Actor**: Shipping Provider  
**Precondition**: Shipment status changes  
**Main Flow**:
1. Provider sends tracking webhook with:
   - TrackingNumber
   - Status
   - Location
   - Timestamp
   - Event description
2. System receives webhook
3. System validates signature
4. System validates idempotency
5. System retrieves shipment
6. System creates tracking event record
7. System updates shipment status based on event:
   - in_transit → IN_TRANSIT
   - out_for_delivery → OUT_FOR_DELIVERY
   - delivered → DELIVERED
8. System publishes appropriate event
9. System stores processed webhook ID
10. System returns 200 OK

**Alternative Flow**:
- 3a. Invalid signature → Return 401
- 4a. Duplicate webhook → Return 200
- 5a. Shipment not found → Log error, return 404

**Postcondition**: Tracking status updated

---

### UC-SHIP-007: Mark Shipment as Out for Delivery
**Primary Actor**: System (Shipping Provider)  
**Precondition**: Shipment at local hub  
**Main Flow**:
1. System receives out_for_delivery webhook
2. System validates event
3. System updates shipment status = OUT_FOR_DELIVERY
4. System publishes ShipmentOutForDelivery event
5. System sends notification to customer:
   - "Your order will be delivered today"
   - Delivery window
   - Driver contact (if available)

**Postcondition**: Customer notified of imminent delivery

---

### UC-SHIP-008: Mark Shipment as Delivered
**Primary Actor**: System (Shipping Provider)  
**Precondition**: Package delivered to customer  
**Main Flow**:
1. Carrier confirms delivery (signature/photo)
2. Provider sends delivered webhook with:
   - TrackingNumber
   - DeliveredAt timestamp
   - DeliveryProof (signature/photo URL)
   - ReceivedBy
3. System receives webhook
4. System validates event
5. System updates shipment status = DELIVERED
6. System stores delivery proof
7. System publishes ShipmentDelivered event
8. Order Service marks order as delivered
9. System sends delivery confirmation to customer

**Postcondition**: Shipment marked as delivered, order completed

---

### UC-SHIP-009: Handle Failed Delivery Attempt
**Primary Actor**: Shipping Provider  
**Precondition**: Delivery attempt unsuccessful  
**Main Flow**:
1. Carrier attempts delivery but customer unavailable
2. Provider sends delivery_failed webhook with reason:
   - Customer not available
   - Incorrect address
   - Access issues
3. System receives webhook
4. System validates event
5. System creates failed delivery record
6. System updates shipment status = DELIVERY_FAILED
7. System publishes DeliveryAttemptFailed event
8. System notifies customer with:
   - Failure reason
   - Next attempt date
   - Options to reschedule or pick up
9. System increments delivery attempt count

**Alternative Flow**:
- 9a. Max attempts reached → Mark as return to sender

**Postcondition**: Failed delivery recorded, customer notified

---

### UC-SHIP-010: Reschedule Delivery
**Primary Actor**: Customer  
**Precondition**: Delivery attempt failed or scheduled  
**Main Flow**:
1. Customer requests delivery reschedule
2. System retrieves shipment
3. System validates shipment allows rescheduling
4. System calls provider API to reschedule with:
   - New delivery date
   - Time window preference
   - Special instructions
5. Provider confirms reschedule
6. System updates shipment with new delivery date
7. System publishes DeliveryRescheduled event
8. System returns confirmation

**Alternative Flow**:
- 3a. Shipment already delivered → Return error
- 5a. Reschedule not allowed by carrier → Return error

**Postcondition**: Delivery rescheduled

---

### UC-SHIP-011: Change Delivery Address
**Primary Actor**: Customer  
**Precondition**: Shipment not yet out for delivery  
**Main Flow**:
1. Customer requests address change
2. System retrieves shipment
3. System validates status allows change (not out_for_delivery)
4. System validates new address with provider
5. System calls provider API to update address
6. Provider confirms address change (may charge fee)
7. System updates shipment address
8. System publishes AddressChanged event
9. System returns confirmation with any fees

**Alternative Flow**:
- 3a. Too late to change → Return "Cannot change address"
- 4a. Invalid address → Return validation error
- 6a. Provider rejects → Return error

**Postcondition**: Delivery address updated

---

### UC-SHIP-012: Cancel Shipment
**Primary Actor**: Seller, System  
**Precondition**: Order cancelled before shipment  
**Main Flow**:
1. System receives OrderCancelled event
2. System retrieves shipment
3. System validates shipment not yet picked up
4. System calls provider API to cancel shipment
5. Provider cancels and voids label
6. System updates shipment status = CANCELLED
7. System publishes ShipmentCancelled event
8. System returns cancellation confirmation

**Alternative Flow**:
- 3a. Already picked up → Cannot cancel, initiate return
- 5a. Provider cancellation fails → Manual intervention

**Postcondition**: Shipment cancelled, label voided

---

### UC-SHIP-013: Initiate Return Shipment
**Primary Actor**: Customer  
**Precondition**: Order delivered, within return window  
**Main Flow**:
1. Customer requests return
2. System validates return eligibility
3. System generates return shipping label with:
   - Original shipment reference
   - Return tracking number
   - Prepaid (if free returns)
   - Return address (warehouse/seller)
4. System creates return shipment record
5. System publishes ReturnShipmentCreated event
6. System sends return label to customer
7. System provides return instructions

**Alternative Flow**:
- 2a. Outside return window → Return error
- 2b. Item not returnable → Return error

**Postcondition**: Return shipment created, label sent

---

### UC-SHIP-014: Track Return Shipment
**Primary Actor**: System  
**Precondition**: Customer ships return  
**Main Flow**:
1. Customer drops off return package
2. Carrier scans return label
3. System receives tracking updates
4. System monitors return progress
5. When delivered to warehouse:
   - System publishes ReturnReceived event
   - Inventory Service restocks item
   - Refund process initiated
6. System notifies customer of return receipt

**Postcondition**: Return tracked and processed

---

### UC-SHIP-015: Calculate Shipping Cost
**Primary Actor**: Customer, System  
**Precondition**: Order items and address provided  
**Main Flow**:
1. System receives shipping calculation request with:
   - Origin address
   - Destination address
   - Package weight and dimensions
   - Shipping method preference
2. System queries available providers
3. For each provider:
   - System calls rate API
   - Provider returns rates for service levels
4. System compares rates and delivery times
5. System applies any shipping discounts/rules
6. System returns shipping options with:
   - Carrier
   - Service level
   - Cost
   - Estimated delivery
   - Transit time

**Alternative Flow**:
- 3a. Provider API unavailable → Use cached rates
- 4a. No service available → Return error

**Postcondition**: Shipping cost calculated and displayed

---

### UC-SHIP-016: Handle Shipment Exception
**Primary Actor**: Shipping Provider  
**Precondition**: Shipment encounters issue  
**Main Flow**:
1. Provider detects exception (delay, damage, lost)
2. Provider sends exception webhook with:
   - TrackingNumber
   - ExceptionType
   - Reason
   - ExpectedResolution
3. System receives webhook
4. System creates exception record
5. System updates shipment status = EXCEPTION
6. System publishes ShipmentException event
7. System notifies customer and seller
8. System escalates based on exception type:
   - Delay → Monitor and update ETA
   - Damage → Initiate claim process
   - Lost → Initiate insurance claim

**Alternative Flow**:
- 8a. Critical exception → Immediate escalation

**Postcondition**: Exception recorded and handled

---

### UC-SHIP-017: File Insurance Claim
**Primary Actor**: Admin, System  
**Precondition**: Shipment lost or damaged  
**Main Flow**:
1. System/Admin initiates insurance claim
2. System retrieves shipment and order details
3. System gathers evidence:
   - Delivery photos
   - Customer complaint
   - Item value
4. System calls provider claims API
5. Provider creates claim case
6. System tracks claim status
7. When approved:
   - System publishes ClaimApproved event
   - System processes refund or replacement
8. System notifies customer of resolution

**Alternative Flow**:
- 7a. Claim denied → Manual review and appeal

**Postcondition**: Insurance claim filed and processed

---

### UC-SHIP-018: Get Delivery Proof
**Primary Actor**: Customer, Seller  
**Precondition**: Shipment delivered  
**Main Flow**:
1. User requests delivery proof
2. System retrieves shipment
3. System validates shipment status = DELIVERED
4. System returns proof of delivery:
   - Signature image
   - Delivery photo
   - GPS coordinates
   - Recipient name
   - Timestamp
5. User can download proof

**Alternative Flow**:
- 3a. Not delivered yet → Return "Not available"

**Postcondition**: Delivery proof provided

---

### UC-SHIP-019: Batch Create Shipments
**Primary Actor**: System  
**Precondition**: Multiple orders confirmed  
**Main Flow**:
1. System receives batch of confirmed orders
2. System groups orders by:
   - Shipping provider
   - Origin warehouse
   - Service level
3. System calls provider batch API
4. Provider creates multiple shipments
5. System stores all shipment records
6. System publishes events for each shipment
7. System generates manifest document
8. System returns batch creation summary

**Alternative Flow**:
- 4a. Partial failures → Retry failed items individually

**Postcondition**: Multiple shipments created efficiently

---

### UC-SHIP-020: Generate Shipping Manifest
**Primary Actor**: Seller, System  
**Precondition**: Multiple shipments ready for pickup  
**Main Flow**:
1. System retrieves all shipments for pickup date
2. System groups by carrier
3. System generates manifest with:
   - Shipment count
   - Tracking numbers
   - Package weights
   - Destination summary
   - Pickup location
4. System calls provider to close manifest
5. Provider confirms manifest
6. System generates manifest PDF
7. System provides to warehouse for carrier handoff

**Postcondition**: Shipping manifest generated for pickup

