# Payment Service - Use Cases

## Actors
- **Customer**: End user making payment
- **Admin**: System administrator
- **System**: Other microservices (Order Service)
- **Payment Provider**: External payment gateway (Stripe, PayPal, VNPay, MoMo)

## Use Cases

### UC-PAY-001: Initiate Payment
**Primary Actor**: System (Order Service)  
**Precondition**: Order created, inventory reserved  
**Main Flow**:
1. System receives InitiatePayment event with:
   - OrderId
   - CustomerId
   - Amount
   - Currency
   - PaymentMethod
2. System validates event idempotency (check EventId)
3. System validates amount > 0
4. System generates unique PaymentId
5. System creates payment record with status = PENDING
6. System stores order reference
7. System stores processed event ID
8. System publishes PaymentInitiated event
9. System returns PaymentId and payment details

**Alternative Flow**:
- 2a. Duplicate event → Return existing PaymentId
- 3a. Invalid amount → Publish PaymentFailed event

**Postcondition**: Payment initiated, ready for processing

---

### UC-PAY-002: Process Payment (Credit Card)
**Primary Actor**: Customer  
**Precondition**: Payment initiated  
**Main Flow**:
1. Customer provides credit card details:
   - Card number
   - Expiry date
   - CVV
   - Billing address
2. System validates card details format
3. System selects payment provider (Stripe)
4. System calls provider API with:
   - Amount
   - Currency
   - Card token
   - IdempotencyKey
5. Provider validates card and charges amount
6. Provider returns transaction result
7. System updates payment status = COMPLETED
8. System stores transaction details:
   - TransactionId
   - Provider
   - ProcessedAt
9. System commits transaction with Outbox
10. System publishes PaymentCompleted event
11. System returns payment confirmation

**Alternative Flow**:
- 2a. Invalid card details → Return validation error
- 5a. Card declined → Update status = FAILED, publish PaymentFailed
- 5b. Insufficient funds → Update status = FAILED, publish PaymentFailed
- 5c. Provider timeout → Retry with backoff, then fail

**Postcondition**: Payment completed, funds charged, order confirmed

---

### UC-PAY-003: Process Payment (E-Wallet)
**Primary Actor**: Customer  
**Precondition**: Payment initiated  
**Main Flow**:
1. Customer selects e-wallet (PayPal, MoMo, VNPay)
2. System selects appropriate provider adapter
3. System generates payment URL/QR code
4. System redirects customer to provider
5. Customer authenticates with e-wallet
6. Customer authorizes payment
7. Provider redirects back with status
8. System validates callback signature
9. System updates payment status = COMPLETED
10. System publishes PaymentCompleted event
11. System displays confirmation to customer

**Alternative Flow**:
- 6a. Customer cancels → Update status = CANCELLED
- 8a. Invalid signature → Log security alert, return error
- 7a. Payment rejected → Update status = FAILED, publish event

**Postcondition**: Payment completed via e-wallet

---

### UC-PAY-004: Handle Payment Timeout
**Primary Actor**: System  
**Precondition**: Payment pending too long  
**Main Flow**:
1. Background job checks payments with status = PENDING
2. System identifies payments older than 30 minutes
3. For each timed-out payment:
   a. System queries provider for actual status
   b. If no charge → Update status = TIMEOUT
   c. If charge exists → Update status = COMPLETED
   d. System publishes appropriate event
4. System logs timeout incidents

**Alternative Flow**:
- 3b. Provider unreachable → Mark for manual review

**Postcondition**: Stale payments resolved

---

### UC-PAY-005: Process Refund
**Primary Actor**: Admin, System  
**Precondition**: Payment completed, refund requested  
**Main Flow**:
1. System receives RefundRequested event with:
   - PaymentId
   - OrderId
   - Amount (full or partial)
   - Reason
2. System validates event idempotency
3. System retrieves original payment
4. System validates payment status = COMPLETED
5. System validates refund amount <= paid amount
6. System generates RefundId
7. System selects original payment provider
8. System calls provider refund API with IdempotencyKey
9. Provider processes refund
10. System creates refund record with status = COMPLETED
11. System updates payment:
    - RefundedAmount += amount
    - Status = REFUNDED (if fully refunded)
    - Status = PARTIALLY_REFUNDED (if partial)
12. System publishes RefundCompleted event
13. System stores processed event ID

**Alternative Flow**:
- 2a. Duplicate event → Return existing refund
- 4a. Payment not completed → Return error
- 5a. Amount exceeds paid → Return error
- 9a. Provider refund fails → Retry, then manual review

**Postcondition**: Refund processed, funds returned to customer

---

### UC-PAY-006: Handle Payment Webhook (Provider Callback)
**Primary Actor**: Payment Provider  
**Precondition**: Provider sends async notification  
**Main Flow**:
1. Provider sends webhook to callback URL
2. System receives webhook payload with:
   - Event type (payment.success, payment.failed)
   - TransactionId
   - Status
   - Signature
3. System validates webhook signature
4. System validates webhook is not duplicate (idempotency)
5. System retrieves payment by TransactionId
6. System updates payment status from webhook
7. System stores processed webhook ID
8. System publishes appropriate event
9. System returns 200 OK to provider

**Alternative Flow**:
- 3a. Invalid signature → Log security alert, return 401
- 4a. Duplicate webhook → Return 200 (idempotent)
- 5a. Payment not found → Log error, return 404

**Postcondition**: Payment status synced with provider

---

### UC-PAY-007: Get Payment Status
**Primary Actor**: Customer, System  
**Precondition**: Payment exists  
**Main Flow**:
1. User requests payment status by PaymentId
2. System validates user authorization
3. System retrieves payment record
4. System returns payment details:
   - PaymentId
   - OrderId
   - Status
   - Amount
   - PaymentMethod
   - ProcessedAt
   - TransactionId

**Alternative Flow**:
- 2a. Unauthorized → Return 403
- 3a. Payment not found → Return 404

**Postcondition**: Payment status returned

---

### UC-PAY-008: List Payment Methods
**Primary Actor**: Customer  
**Precondition**: Customer authenticated  
**Main Flow**:
1. Customer requests available payment methods
2. System retrieves enabled payment providers
3. System returns list with:
   - Method type (card, e-wallet, bank_transfer)
   - Provider name
   - Display name
   - Logo URL
   - Supported currencies

**Postcondition**: Payment methods listed

---

### UC-PAY-009: Save Payment Method (Tokenization)
**Primary Actor**: Customer  
**Precondition**: Customer wants to save card  
**Main Flow**:
1. Customer opts to save payment method
2. System calls provider tokenization API
3. Provider returns secure token (no raw card data)
4. System stores token with:
   - CustomerId
   - TokenId
   - Last4Digits
   - ExpiryMonth/Year
   - CardBrand
   - IsDefault
5. System returns success

**Alternative Flow**:
- 2a. Tokenization fails → Return error

**Postcondition**: Payment method saved securely

---

### UC-PAY-010: Delete Saved Payment Method
**Primary Actor**: Customer  
**Precondition**: Saved payment method exists  
**Main Flow**:
1. Customer requests deletion
2. System validates customer owns payment method
3. System calls provider to delete token
4. System soft deletes payment method record
5. System returns success

**Alternative Flow**:
- 2a. Unauthorized → Return 403

**Postcondition**: Payment method deleted

---

### UC-PAY-011: Process Payment with Saved Method
**Primary Actor**: Customer  
**Precondition**: Customer has saved payment method  
**Main Flow**:
1. Customer selects saved payment method
2. System retrieves payment token
3. System validates token not expired
4. System calls provider with token
5. Provider charges using saved method
6. System completes payment flow
7. System publishes PaymentCompleted event

**Alternative Flow**:
- 3a. Token expired → Request new card details
- 5a. Charge fails → Notify customer to update method

**Postcondition**: Payment processed with saved method

---

### UC-PAY-012: Handle Payment Fraud Check
**Primary Actor**: System  
**Precondition**: Payment initiated  
**Main Flow**:
1. System analyzes payment for fraud signals:
   - Unusual amount
   - Mismatched billing address
   - High-risk country
   - Velocity checks (multiple attempts)
2. System calculates fraud score
3. If score < threshold → Process normally
4. If score >= threshold → Flag for review
5. System updates payment with fraud score
6. If flagged → Notify admin for manual review

**Alternative Flow**:
- 4a. High risk → Decline payment immediately

**Postcondition**: Payment fraud checked

---

### UC-PAY-013: Retry Failed Payment
**Primary Actor**: Customer, System  
**Precondition**: Payment failed  
**Main Flow**:
1. Customer/System initiates payment retry
2. System retrieves original payment
3. System validates retry count < max (3)
4. System creates new payment attempt
5. System processes payment with backoff
6. System updates payment status
7. System publishes result event

**Alternative Flow**:
- 3a. Max retries exceeded → Return error
- 5a. Still fails → Increment retry count

**Postcondition**: Payment retried

---

### UC-PAY-014: Process Partial Payment
**Primary Actor**: Customer  
**Precondition**: Order allows partial payment  
**Main Flow**:
1. Customer pays partial amount
2. System validates partial payment allowed
3. System processes payment for partial amount
4. System updates order with:
   - PaidAmount
   - RemainingAmount
   - Status = PARTIALLY_PAID
5. System publishes PartialPaymentReceived event
6. System sends reminder for remaining amount

**Postcondition**: Partial payment recorded

---

### UC-PAY-015: Generate Payment Receipt
**Primary Actor**: Customer  
**Precondition**: Payment completed  
**Main Flow**:
1. Customer requests payment receipt
2. System retrieves payment and order details
3. System generates receipt PDF with:
   - Payment ID
   - Transaction ID
   - Amount
   - Payment method
   - Date/time
   - Order details
4. System stores receipt URL
5. System returns receipt for download

**Postcondition**: Receipt generated

---

### UC-PAY-016: Handle 3D Secure Authentication
**Primary Actor**: Customer  
**Precondition**: Card requires 3DS verification  
**Main Flow**:
1. Customer initiates payment
2. Provider detects 3DS requirement
3. System redirects to 3DS challenge
4. Customer completes authentication with bank
5. Bank returns authentication result
6. System continues payment with auth token
7. System completes or fails based on result

**Alternative Flow**:
- 4a. Customer fails authentication → Payment failed
- 5a. Authentication timeout → Payment failed

**Postcondition**: 3DS authentication completed

---

### UC-PAY-017: Process Chargeback
**Primary Actor**: Payment Provider  
**Precondition**: Customer disputes payment  
**Main Flow**:
1. Provider notifies chargeback via webhook
2. System receives chargeback notification
3. System creates chargeback record
4. System updates payment status = DISPUTED
5. System publishes ChargebackReceived event
6. System notifies admin for review
7. Admin gathers evidence and responds

**Postcondition**: Chargeback recorded and under review

---

### UC-PAY-018: Reconcile Payments
**Primary Actor**: System (Background Job)  
**Precondition**: Daily reconciliation scheduled  
**Main Flow**:
1. System retrieves all payments from last 24 hours
2. For each payment provider:
   a. System fetches provider transaction report
   b. System matches internal records with provider
   c. System identifies discrepancies
   d. System logs mismatches for investigation
3. System generates reconciliation report
4. System notifies finance team of issues

**Alternative Flow**:
- 2c. Discrepancy found → Flag for manual review

**Postcondition**: Payments reconciled with providers

---

### UC-PAY-019: Calculate Payment Fees
**Primary Actor**: System  
**Precondition**: Payment being processed  
**Main Flow**:
1. System retrieves provider fee structure:
   - Card: 2.9% + $0.30
   - E-wallet: 3.5%
   - Bank transfer: $0.50 flat
2. System calculates provider fee
3. System calculates platform fee (if applicable)
4. System stores fee breakdown in payment record
5. System includes fees in financial reporting

**Postcondition**: Payment fees calculated and recorded

---

### UC-PAY-020: Handle Payment Provider Failover
**Primary Actor**: System  
**Precondition**: Primary provider unavailable  
**Main Flow**:
1. System attempts payment with primary provider
2. Provider returns error or timeout
3. System detects provider failure
4. System checks circuit breaker state
5. If open → Switch to backup provider
6. System retries payment with backup
7. System logs provider failover
8. System monitors primary provider recovery

**Alternative Flow**:
- 5a. No backup available → Return payment failed

**Postcondition**: Payment processed via failover provider

