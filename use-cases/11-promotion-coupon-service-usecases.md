# Promotion & Coupon Service - Use Cases

## Actors
- **Customer**: End user applying coupons
- **Seller**: Vendor creating promotions
- **Admin**: System administrator managing campaigns
- **System**: Other microservices (Cart, Order)

## Use Cases

### UC-PROMO-001: Create Coupon
**Primary Actor**: Admin, Seller  
**Precondition**: User has permission to create coupons  
**Main Flow**:
1. User creates coupon with:
   - Code (e.g., "SAVE10")
   - Type (percentage, fixed amount, free shipping)
   - Value (e.g., 10% or $10)
   - ValidFrom date
   - ValidTo date
   - UsageLimit (per coupon, per customer)
   - MinimumOrderAmount
   - ApplicableProducts/Categories (optional)
2. System validates coupon code unique
3. System validates dates (ValidFrom < ValidTo)
4. System validates value > 0
5. System validates minimum order amount >= 0
6. System creates coupon with status = ACTIVE
7. System publishes CouponCreated event
8. System returns coupon details

**Alternative Flow**:
- 2a. Code already exists → Return "Coupon code already exists"
- 3a. Invalid dates → Return validation error
- 4a. Invalid value → Return validation error

**Postcondition**: Coupon created and active

---

### UC-PROMO-002: Validate Coupon
**Primary Actor**: System (Cart/Order Service)  
**Precondition**: Customer applies coupon code  
**Main Flow**:
1. System receives coupon validation request with:
   - CouponCode
   - CustomerId
   - CartTotal
   - CartItems
2. System retrieves coupon by code
3. System validates coupon exists
4. System validates coupon status = ACTIVE
5. System validates current date within valid range
6. System validates cart total >= minimum order amount
7. System checks total usage count < usage limit
8. System checks customer usage < per-customer limit
9. System validates applicable products (if restricted)
10. System calculates discount amount
11. System returns validation result:
    - Valid: true/false
    - DiscountAmount
    - Message

**Alternative Flow**:
- 2a. Coupon not found → Return "Invalid coupon code"
- 4a. Coupon expired/inactive → Return "Coupon no longer valid"
- 5a. Outside date range → Return "Coupon not valid yet" or "Coupon expired"
- 6a. Below minimum → Return "Minimum order: $X"
- 7a. Usage limit reached → Return "Coupon no longer available"
- 8a. Customer limit reached → Return "You've already used this coupon"
- 9a. Products not applicable → Return "Coupon not valid for items in cart"

**Postcondition**: Coupon validation result returned

---

### UC-PROMO-003: Apply Coupon to Cart
**Primary Actor**: Customer  
**Precondition**: Cart has items, valid coupon code  
**Main Flow**:
1. Customer enters coupon code in cart
2. System calls Promotion Service to validate
3. System receives validation result
4. If valid:
   - System applies discount to cart
   - System stores coupon in cart session
   - System recalculates cart total
   - System displays discount breakdown
5. System returns updated cart with discount

**Alternative Flow**:
- 3a. Invalid coupon → Display error message, no discount

**Postcondition**: Coupon applied, cart total updated

---

### UC-PROMO-004: Redeem Coupon
**Primary Actor**: System (Order Service)  
**Precondition**: Order created with coupon applied  
**Main Flow**:
1. System receives OrderCreated event with CouponCode
2. System validates event idempotency
3. System retrieves coupon
4. System creates coupon usage record with:
   - CouponId
   - CustomerId
   - OrderId
   - DiscountAmount
   - RedeemedAt
5. System increments coupon usage counters:
   - TotalUsageCount += 1
   - Customer-specific usage += 1
6. System stores processed event ID
7. System publishes CouponRedeemed event
8. If usage limit reached:
   - System updates coupon status = DEPLETED
   - System publishes CouponDepleted event

**Alternative Flow**:
- 2a. Duplicate event → Skip processing (idempotent)

**Postcondition**: Coupon redeemed, usage recorded

---

### UC-PROMO-005: Release Coupon (Order Cancelled)
**Primary Actor**: System (Order Service)  
**Precondition**: Order with coupon cancelled  
**Main Flow**:
1. System receives OrderCancelled event with CouponCode
2. System validates event idempotency
3. System retrieves coupon usage record
4. System validates usage exists
5. System marks usage as released
6. System decrements usage counters:
   - TotalUsageCount -= 1
   - Customer-specific usage -= 1
7. If coupon was depleted:
   - System updates status back to ACTIVE
8. System stores processed event ID
9. System publishes CouponReleased event

**Alternative Flow**:
- 2a. Duplicate event → Skip processing
- 4a. Usage not found → Log warning, continue

**Postcondition**: Coupon usage released, available again

---

### UC-PROMO-006: Deactivate Coupon
**Primary Actor**: Admin, Seller  
**Precondition**: Coupon exists  
**Main Flow**:
1. User requests coupon deactivation
2. System validates user has permission
3. System retrieves coupon
4. System updates coupon status = INACTIVE
5. System publishes CouponDeactivated event
6. System returns success

**Alternative Flow**:
- 2a. Unauthorized → Return 403

**Postcondition**: Coupon deactivated, no longer usable

---

### UC-PROMO-007: List Available Coupons
**Primary Actor**: Customer  
**Precondition**: Customer authenticated  
**Main Flow**:
1. Customer requests available coupons
2. System retrieves active coupons where:
   - Status = ACTIVE
   - Current date within valid range
   - Usage limit not reached
   - Public or assigned to customer
3. System filters coupons customer is eligible for
4. System returns coupon list with:
   - Code
   - Description
   - Value
   - Expiration date
   - Minimum order amount
   - Terms

**Postcondition**: Available coupons displayed

---

### UC-PROMO-008: Create Flash Sale
**Primary Actor**: Admin  
**Precondition**: Admin has permission  
**Main Flow**:
1. Admin creates flash sale with:
   - Name (e.g., "Black Friday Sale")
   - Products or categories
   - Discount percentage
   - StartTime
   - EndTime
   - Stock limit (optional)
2. System validates dates
3. System validates discount 0-100%
4. System creates promotion
5. System schedules activation job
6. At StartTime:
   - System activates promotion
   - System updates product prices temporarily
   - System publishes FlashSaleStarted event
7. At EndTime:
   - System deactivates promotion
   - System restores original prices
   - System publishes FlashSaleEnded event

**Alternative Flow**:
- 2a. Invalid dates → Return error

**Postcondition**: Flash sale scheduled and activated

---

### UC-PROMO-009: Create Buy X Get Y Promotion
**Primary Actor**: Admin  
**Precondition**: Admin has permission  
**Main Flow**:
1. Admin creates BOGO promotion:
   - Type: BUY_X_GET_Y
   - BuyProductId (X)
   - BuyQuantity
   - GetProductId (Y)
   - GetQuantity
   - GetDiscount (e.g., 100% = free)
   - ValidFrom/ValidTo
2. System validates products exist
3. System creates promotion rule
4. System publishes PromotionCreated event
5. Cart/Order Service evaluates rules during checkout

**Postcondition**: BOGO promotion created

---

### UC-PROMO-010: Apply Automatic Discount
**Primary Actor**: System  
**Precondition**: Customer meets promotion criteria  
**Main Flow**:
1. Customer adds items to cart
2. System evaluates active promotions:
   - Product-specific discounts
   - Category discounts
   - Bundle deals
   - Tier pricing
3. System identifies applicable promotions
4. System applies best discount automatically
5. System displays "Promotion applied" message
6. System shows discount in cart breakdown

**Alternative Flow**:
- 3a. Multiple promotions → Apply highest discount (or stackable if allowed)

**Postcondition**: Best promotion automatically applied

---

### UC-PROMO-011: Create Referral Coupon
**Primary Actor**: System  
**Precondition**: Customer refers a friend  
**Main Flow**:
1. System receives referral event
2. System generates unique referral code for customer
3. System creates coupon with:
   - Type: REFERRAL
   - Value: $10 (or configured amount)
   - UsageLimit: 1 per referred customer
   - ValidFor: 30 days
4. System stores referral mapping
5. When referred friend uses code:
   - Both referrer and referee get discount
6. System publishes ReferralCouponCreated event
7. System sends coupon to customer

**Postcondition**: Referral coupon created and distributed

---

### UC-PROMO-012: Stack Coupons
**Primary Actor**: Customer  
**Precondition**: Multiple coupons available, stacking allowed  
**Main Flow**:
1. Customer applies multiple coupons
2. System validates each coupon individually
3. System checks if coupons are stackable
4. System determines stacking rules:
   - All percentage discounts combined
   - Fixed amount discounts summed
   - Free shipping overrides paid shipping
5. System calculates total discount
6. System validates final discount doesn't exceed cart total
7. System applies all coupons
8. System returns updated cart

**Alternative Flow**:
- 3a. Coupons not stackable → Apply only one (best discount)
- 6a. Discount > cart total → Cap at cart total

**Postcondition**: Multiple coupons applied if stackable

---

### UC-PROMO-013: Create Loyalty Reward Coupon
**Primary Actor**: System  
**Precondition**: Customer reaches loyalty milestone  
**Main Flow**:
1. System detects customer loyalty achievement
2. System generates reward coupon:
   - Code: AUTO-GENERATED
   - Type: LOYALTY_REWARD
   - Value: Based on tier
   - AssignedTo: CustomerId
   - ValidFor: 60 days
3. System creates coupon
4. System publishes LoyaltyRewardIssued event
5. System notifies customer of reward
6. System stores in customer's coupon wallet

**Postcondition**: Loyalty reward coupon issued

---

### UC-PROMO-014: Get Coupon Usage History
**Primary Actor**: Admin, Seller  
**Precondition**: User has permission  
**Main Flow**:
1. User requests coupon usage report
2. System retrieves usage records with filters:
   - Date range
   - Coupon code
   - Customer
3. System aggregates data:
   - Total redemptions
   - Total discount given
   - Revenue impact
   - Top customers
4. System returns usage report

**Postcondition**: Coupon usage history displayed

---

### UC-PROMO-015: Expire Coupons
**Primary Actor**: System (Background Job)  
**Precondition**: Daily expiration check scheduled  
**Main Flow**:
1. Background job runs daily
2. System queries coupons where:
   - Status = ACTIVE
   - ValidTo < NOW
3. For each expired coupon:
   - System updates status = EXPIRED
   - System publishes CouponExpired event
4. System logs expiration summary
5. System optionally notifies affected customers

**Postcondition**: Expired coupons deactivated

---

### UC-PROMO-016: Clone Coupon
**Primary Actor**: Admin, Seller  
**Precondition**: Source coupon exists  
**Main Flow**:
1. User requests to clone existing coupon
2. System retrieves source coupon
3. System creates new coupon with:
   - Same settings as source
   - New unique code
   - Updated dates
   - Reset usage counters
4. System returns new coupon

**Postcondition**: Coupon cloned successfully

---

### UC-PROMO-017: Create Minimum Spend Promotion
**Primary Actor**: Admin  
**Precondition**: Admin has permission  
**Main Flow**:
1. Admin creates tiered promotion:
   - Spend $50 → Get $5 off
   - Spend $100 → Get $15 off
   - Spend $200 → Get $40 off
2. System creates promotion tiers
3. During checkout:
   - System evaluates cart total
   - System applies highest applicable tier
   - System displays next tier incentive

**Postcondition**: Tiered promotion created

---

### UC-PROMO-018: Create First Order Coupon
**Primary Actor**: System  
**Precondition**: New customer registered  
**Main Flow**:
1. System receives UserRegistered event
2. System checks if first-order promotion enabled
3. System generates welcome coupon:
   - Code: WELCOME10 or unique
   - Value: 10% or $10
   - FirstOrderOnly: true
   - ValidFor: 30 days
4. System creates coupon
5. System publishes WelcomeCouponIssued event
6. System sends welcome email with coupon

**Postcondition**: First order coupon issued to new customer

---

### UC-PROMO-019: Calculate Promotion Impact
**Primary Actor**: Admin  
**Precondition**: Promotions active  
**Main Flow**:
1. Admin requests promotion analytics
2. System aggregates metrics:
   - Total discount given
   - Orders influenced
   - Revenue with promotion
   - Conversion rate impact
   - Customer acquisition cost
   - ROI of promotion
3. System compares to baseline (no promotion)
4. System generates impact report with visualizations
5. System returns analytics dashboard

**Postcondition**: Promotion impact analyzed

---

### UC-PROMO-020: Prevent Coupon Abuse
**Primary Actor**: System  
**Precondition**: Coupon validation requested  
**Main Flow**:
1. System detects potential abuse patterns:
   - Same customer, different accounts
   - Rapid repeated usage attempts
   - Multiple failed attempts
   - Unusual IP patterns
2. System calculates fraud score
3. If score > threshold:
   - System blocks coupon for IP/account
   - System flags for review
   - System logs security event
4. System publishes CouponAbuseDetected event
5. System notifies admin

**Alternative Flow**:
- 3a. Clear abuse → Permanently block

**Postcondition**: Coupon abuse prevented

