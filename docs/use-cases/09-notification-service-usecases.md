# Notification Service - Use Cases

## Actors
- **Customer**: End user receiving notifications
- **Seller**: Vendor receiving order/business notifications
- **Admin**: System administrator receiving alerts
- **System**: Other microservices publishing events

## Use Cases

### UC-NOTIF-001: Send Order Confirmation Email
**Primary Actor**: System (Order Service)  
**Precondition**: OrderCreated event received  
**Main Flow**:
1. System receives OrderCreated event with:
   - OrderId
   - CustomerId
   - CustomerEmail
   - OrderDetails
2. System validates event idempotency (check EventId)
3. System retrieves customer preferences
4. System validates customer opted-in for order emails
5. System selects email template: "order_confirmation"
6. System populates template with:
   - Order number
   - Items ordered
   - Total amount
   - Estimated delivery
   - Tracking link
7. System selects email provider (SendGrid, SES)
8. System calls provider API with IdempotencyKey
9. Provider sends email
10. System stores notification record with status = SENT
11. System stores processed event ID
12. System returns success

**Alternative Flow**:
- 2a. Duplicate event → Skip processing
- 4a. Customer opted-out → Skip email, log
- 9a. Provider fails → Retry with backoff, use backup provider

**Postcondition**: Order confirmation email sent

---

### UC-NOTIF-002: Send Payment Confirmation Email
**Primary Actor**: System (Payment Service)  
**Precondition**: PaymentCompleted event received  
**Main Flow**:
1. System receives PaymentCompleted event
2. System validates event idempotency
3. System retrieves order and customer details
4. System selects template: "payment_confirmation"
5. System populates template with:
   - Payment amount
   - Payment method
   - Transaction ID
   - Receipt link
6. System sends email via provider
7. System stores notification record
8. System stores processed event ID

**Alternative Flow**:
- 2a. Duplicate event → Skip processing

**Postcondition**: Payment confirmation sent

---

### UC-NOTIF-003: Send Shipment Notification
**Primary Actor**: System (Shipping Service)  
**Precondition**: ShipmentCreated or ShipmentShipped event received  
**Main Flow**:
1. System receives shipping event with:
   - OrderId
   - TrackingNumber
   - Carrier
   - EstimatedDelivery
2. System validates event idempotency
3. System retrieves customer contact info
4. System selects template: "shipment_update"
5. System populates template with:
   - Tracking number
   - Carrier name
   - Tracking link
   - Expected delivery date
6. System sends email
7. System optionally sends SMS if express shipping
8. System stores notification records
9. System stores processed event ID

**Alternative Flow**:
- 2a. Duplicate event → Skip processing
- 7a. Customer has no phone → Skip SMS

**Postcondition**: Shipment notification sent

---

### UC-NOTIF-004: Send Order Delivered Notification
**Primary Actor**: System (Shipping Service)  
**Precondition**: OrderDelivered event received  
**Main Flow**:
1. System receives OrderDelivered event
2. System validates event idempotency
3. System retrieves customer info
4. System selects template: "order_delivered"
5. System populates template with:
   - Order number
   - Delivered date/time
   - Delivery photo link
   - Review request CTA
6. System sends email
7. System sends push notification (if app installed)
8. System schedules review reminder (after 2 days)
9. System stores notification records

**Postcondition**: Delivery confirmation sent, review requested

---

### UC-NOTIF-005: Send Payment Failed Notification
**Primary Actor**: System (Payment Service)  
**Precondition**: PaymentFailed event received  
**Main Flow**:
1. System receives PaymentFailed event with:
   - OrderId
   - FailureReason
2. System validates event idempotency
3. System retrieves customer info
4. System selects template: "payment_failed"
5. System populates template with:
   - Order number
   - Failure reason (user-friendly)
   - Retry payment link
   - Alternative payment methods
6. System sends email with high priority
7. System sends SMS if configured
8. System stores notification record
9. System stores processed event ID

**Alternative Flow**:
- 2a. Duplicate event → Skip processing

**Postcondition**: Payment failure notification sent

---

### UC-NOTIF-006: Send Order Cancelled Notification
**Primary Actor**: System (Order Service)  
**Precondition**: OrderCancelled event received  
**Main Flow**:
1. System receives OrderCancelled event with:
   - OrderId
   - CancellationReason
   - RefundStatus
2. System validates event idempotency
3. System retrieves customer info
4. System selects template: "order_cancelled"
5. System populates template with:
   - Order number
   - Cancellation reason
   - Refund amount
   - Refund timeline
6. System sends email
7. System sends push notification
8. System stores notification record

**Postcondition**: Cancellation notification sent

---

### UC-NOTIF-007: Send Low Stock Alert
**Primary Actor**: System (Inventory Service)  
**Precondition**: LowStockAlert event received  
**Main Flow**:
1. System receives LowStockAlert event with:
   - ProductId
   - ProductName
   - CurrentStock
   - Threshold
2. System validates event idempotency
3. System retrieves seller/admin contacts
4. System selects template: "low_stock_alert"
5. System populates template with:
   - Product details
   - Current stock level
   - Reorder recommendation
   - Link to inventory management
6. System sends email to seller/admin
7. System sends SMS if critical (stock = 0)
8. System stores notification record

**Alternative Flow**:
- 7a. Out of stock → Mark as urgent

**Postcondition**: Low stock alert sent to seller

---

### UC-NOTIF-008: Send Welcome Email
**Primary Actor**: System (Identity Service)  
**Precondition**: UserRegistered event received  
**Main Flow**:
1. System receives UserRegistered event with:
   - UserId
   - Email
   - Name
2. System validates event idempotency
3. System selects template: "welcome_email"
4. System populates template with:
   - User name
   - Welcome message
   - Getting started guide
   - Verification link (if needed)
   - Promotional offer
5. System sends email
6. System stores notification record
7. System schedules onboarding email series

**Postcondition**: Welcome email sent, onboarding initiated

---

### UC-NOTIF-009: Send Password Reset Email
**Primary Actor**: System (Identity Service)  
**Precondition**: PasswordResetRequested event received  
**Main Flow**:
1. System receives password reset event with:
   - UserId
   - Email
   - ResetToken
2. System validates event idempotency
3. System selects template: "password_reset"
4. System populates template with:
   - Reset link with token
   - Expiration time (30 minutes)
   - Security warning
5. System sends email with high priority
6. System stores notification record
7. System marks as security-sensitive

**Alternative Flow**:
- 5a. Send fails → Retry immediately (critical)

**Postcondition**: Password reset email sent

---

### UC-NOTIF-010: Send SMS Notification
**Primary Actor**: System  
**Precondition**: Event requires SMS notification  
**Main Flow**:
1. System receives event requiring SMS
2. System validates customer has phone number
3. System validates customer opted-in for SMS
4. System selects SMS provider (Twilio, SNS)
5. System formats SMS message (160 chars max)
6. System calls provider SMS API with IdempotencyKey
7. Provider sends SMS
8. System stores notification record with:
   - Type = SMS
   - Status = SENT
   - MessageId
9. System stores processed event ID

**Alternative Flow**:
- 2a. No phone number → Skip SMS
- 3a. Opted-out → Skip SMS
- 7a. Send fails → Retry once, then log failure

**Postcondition**: SMS sent to customer

---

### UC-NOTIF-011: Send Push Notification
**Primary Actor**: System  
**Precondition**: Customer has mobile app installed  
**Main Flow**:
1. System receives event requiring push notification
2. System retrieves customer device tokens (FCM/APNs)
3. System validates customer opted-in for push
4. System formats push notification with:
   - Title
   - Body
   - Data payload
   - Action deep link
5. System selects push provider (Firebase, OneSignal)
6. System calls provider API
7. Provider sends to device(s)
8. System stores notification record
9. System tracks delivery status

**Alternative Flow**:
- 2a. No device tokens → Skip push
- 3a. Push disabled → Skip
- 7a. Device token invalid → Remove from list

**Postcondition**: Push notification sent to device

---

### UC-NOTIF-012: Send Bulk Email (Marketing)
**Primary Actor**: Admin  
**Precondition**: Marketing campaign created  
**Main Flow**:
1. Admin creates email campaign with:
   - Subject
   - Template
   - Segment/audience
   - Schedule time
2. System validates campaign details
3. System retrieves target customer list
4. System filters opted-in users only
5. System queues emails in batches
6. System processes batches with rate limiting
7. For each recipient:
   - System personalizes email
   - System sends via provider
   - System tracks send status
8. System generates campaign report
9. System tracks open/click rates

**Alternative Flow**:
- 6a. Rate limit hit → Backoff and continue

**Postcondition**: Bulk email campaign sent

---

### UC-NOTIF-013: Handle Notification Preference Update
**Primary Actor**: Customer  
**Precondition**: Customer is authenticated  
**Main Flow**:
1. Customer updates notification preferences:
   - Email: order updates (yes/no)
   - Email: promotions (yes/no)
   - SMS: order updates (yes/no)
   - Push: all notifications (yes/no)
2. System validates preferences
3. System updates customer preference record
4. System publishes NotificationPreferencesUpdated event
5. System returns success

**Postcondition**: Notification preferences updated

---

### UC-NOTIF-014: Track Email Open
**Primary Actor**: Customer  
**Precondition**: Email sent with tracking pixel  
**Main Flow**:
1. Customer opens email
2. Email client loads tracking pixel
3. System receives pixel request with NotificationId
4. System retrieves notification record
5. System updates:
   - OpenedAt timestamp
   - OpenCount += 1
6. System stores analytics data
7. System returns 1x1 transparent pixel

**Alternative Flow**:
- 4a. Notification not found → Log and return pixel

**Postcondition**: Email open tracked

---

### UC-NOTIF-015: Track Email Click
**Primary Actor**: Customer  
**Precondition**: Email sent with tracked links  
**Main Flow**:
1. Customer clicks link in email
2. Link redirects through tracking URL
3. System receives click event with:
   - NotificationId
   - LinkId
4. System retrieves notification record
5. System creates click record with:
   - ClickedAt timestamp
   - LinkUrl
   - UserAgent
6. System redirects to actual destination URL
7. System stores analytics data

**Postcondition**: Email click tracked and redirected

---

### UC-NOTIF-016: Handle Notification Failure
**Primary Actor**: System  
**Precondition**: Notification send failed  
**Main Flow**:
1. Provider returns failure response
2. System logs failure with reason:
   - Invalid email/phone
   - Bounce
   - Provider error
   - Rate limit
3. System updates notification status = FAILED
4. System increments retry count
5. If retry count < max (3):
   - System queues for retry with backoff
6. If max retries reached:
   - System marks as permanent failure
   - System publishes NotificationFailed event
7. System updates customer contact validity

**Alternative Flow**:
- 2a. Hard bounce → Mark email invalid, don't retry

**Postcondition**: Failed notification handled

---

### UC-NOTIF-017: Process Bounce Notification (Webhook)
**Primary Actor**: Email Provider  
**Precondition**: Email bounced  
**Main Flow**:
1. Provider sends bounce webhook with:
   - Email address
   - Bounce type (hard/soft)
   - Reason
2. System receives webhook
3. System validates signature
4. System retrieves notification by email
5. If hard bounce:
   - System marks email as invalid
   - System publishes EmailInvalidated event
   - Identity Service updates customer record
6. If soft bounce:
   - System schedules retry
7. System stores bounce record
8. System returns 200 OK

**Alternative Flow**:
- 3a. Invalid signature → Return 401

**Postcondition**: Bounce processed, email marked if needed

---

### UC-NOTIF-018: Process Unsubscribe Request
**Primary Actor**: Customer  
**Precondition**: Customer clicks unsubscribe link  
**Main Flow**:
1. Customer clicks unsubscribe in email
2. System receives request with:
   - CustomerId or Email
   - NotificationType
3. System loads unsubscribe page
4. Customer confirms unsubscribe
5. System updates preferences:
   - Marketing emails = false (or specific type)
6. System publishes CustomerUnsubscribed event
7. System displays confirmation message
8. System honors immediately for future sends

**Alternative Flow**:
- 4a. Customer cancels → Return to original page

**Postcondition**: Customer unsubscribed from notifications

---

### UC-NOTIF-019: Send Review Request Email
**Primary Actor**: System  
**Precondition**: Order delivered, review window open  
**Main Flow**:
1. System triggered 2 days after delivery
2. System retrieves order details
3. System checks if review already submitted
4. If not reviewed:
   - System selects template: "review_request"
   - System populates with order items
   - System generates review link with token
   - System sends email
5. System stores notification record
6. System schedules reminder (after 7 days)

**Alternative Flow**:
- 3a. Already reviewed → Cancel notification

**Postcondition**: Review request sent

---

### UC-NOTIF-020: Generate Notification Report
**Primary Actor**: Admin  
**Precondition**: Admin requests report  
**Main Flow**:
1. Admin specifies report criteria:
   - Date range
   - Notification type
   - Status (sent, failed, opened, clicked)
2. System queries notification records
3. System aggregates metrics:
   - Total sent
   - Delivery rate
   - Open rate
   - Click rate
   - Bounce rate
   - Unsubscribe rate
4. System generates report with visualizations
5. System exports to CSV/PDF
6. System returns report

**Postcondition**: Notification report generated

