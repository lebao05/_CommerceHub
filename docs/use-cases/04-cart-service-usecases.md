# Cart Service - Use Cases

## Actors
- **Customer**: End user managing shopping cart
- **System**: Other microservices

## Use Cases

### UC-CART-001: Add Item to Cart
**Primary Actor**: Customer  
**Precondition**: Customer is authenticated, product exists  
**Main Flow**:
1. Customer selects product and quantity
2. System validates customer authentication
3. System validates product exists (call Product Service)
4. System validates product is available
5. System checks if item already in cart
6. If exists → update quantity
7. If new → create cart item
8. System captures price snapshot from Product Service
9. System stores in Redis with TTL (30 days)
10. System publishes CartItemAdded event
11. System returns updated cart

**Alternative Flow**:
- 3a. Product not found → Return "Product not available"
- 4a. Product out of stock → Return "Product out of stock"
- 8a. Price unavailable → Return error

**Postcondition**: Item added to cart

---

### UC-CART-002: Update Cart Item Quantity
**Primary Actor**: Customer  
**Precondition**: Cart item exists  
**Main Flow**:
1. Customer changes quantity (increase/decrease)
2. System validates quantity > 0
3. System retrieves cart from Redis
4. System validates item exists in cart
5. System checks stock availability
6. System updates quantity
7. System recalculates cart total
8. System updates Redis
9. System publishes CartItemUpdated event
10. System returns updated cart

**Alternative Flow**:
- 2a. Quantity = 0 → Remove item from cart
- 5a. Requested quantity exceeds stock → Return "Only X items available"

**Postcondition**: Cart item quantity updated

---

### UC-CART-003: Remove Item from Cart
**Primary Actor**: Customer  
**Precondition**: Cart item exists  
**Main Flow**:
1. Customer clicks remove item
2. System retrieves cart from Redis
3. System validates item exists
4. System removes item from cart
5. System recalculates cart total
6. System updates Redis
7. System publishes CartItemRemoved event
8. System returns updated cart

**Alternative Flow**:
- 3a. Item not in cart → Return success (idempotent)

**Postcondition**: Item removed from cart

---

### UC-CART-004: Get Cart
**Primary Actor**: Customer  
**Precondition**: Customer is authenticated  
**Main Flow**:
1. Customer requests cart
2. System retrieves cart from Redis by customer ID
3. System validates each cart item:
   - Product still exists
   - Product still available
   - Price changes (optional notification)
4. System calculates cart summary:
   - Subtotal
   - Item count
   - Estimated tax
   - Estimated shipping
5. System returns cart with items and summary

**Alternative Flow**:
- 2a. Cart not found → Return empty cart
- 3a. Product deleted → Mark item as unavailable

**Postcondition**: Cart details returned

---

### UC-CART-005: Clear Cart
**Primary Actor**: Customer, System  
**Precondition**: Cart exists  
**Main Flow**:
1. Customer clicks clear cart OR order completed
2. System retrieves cart
3. System removes all items
4. System deletes cart from Redis
5. System publishes CartCleared event
6. System returns success

**Postcondition**: Cart emptied

---

### UC-CART-006: Merge Cart (Guest to Logged In)
**Primary Actor**: Customer  
**Precondition**: Customer logs in with items in guest cart  
**Main Flow**:
1. Customer logs in
2. System retrieves guest cart (by session ID)
3. System retrieves user cart (by user ID)
4. System merges carts:
   - For duplicate items → sum quantities
   - For new items → add to user cart
5. System validates merged cart against stock
6. System saves merged cart to user's Redis key
7. System deletes guest cart
8. System returns merged cart

**Alternative Flow**:
- 5a. Merged quantity exceeds stock → Cap at available stock

**Postcondition**: Guest cart merged with user cart

---

### UC-CART-007: Validate Cart Before Checkout
**Primary Actor**: System (Order Service)  
**Precondition**: Customer initiates checkout  
**Main Flow**:
1. Order Service requests cart validation
2. Cart Service retrieves cart
3. System validates each item:
   - Product exists and active
   - Product in stock
   - Price matches or calculate new total
4. System checks minimum order amount
5. System returns validation result with:
   - Valid items
   - Invalid items with reasons
   - Updated prices
   - Cart total

**Alternative Flow**:
- 3a. Item out of stock → Mark as invalid
- 3b. Item deleted → Mark as invalid
- 4a. Below minimum → Return "Minimum order: $X"

**Postcondition**: Cart validation result returned

---

### UC-CART-008: Apply Coupon to Cart
**Primary Actor**: Customer  
**Precondition**: Cart has items, coupon code provided  
**Main Flow**:
1. Customer enters coupon code
2. System validates coupon with Promotion Service
3. System checks coupon eligibility:
   - Valid date range
   - Minimum cart amount
   - Product/category restrictions
   - Usage limit
4. System calculates discount
5. System applies coupon to cart
6. System updates cart total
7. System stores coupon in Redis cart
8. System returns updated cart with discount

**Alternative Flow**:
- 2a. Invalid coupon → Return "Invalid coupon code"
- 3a. Coupon expired → Return "Coupon expired"
- 3b. Below minimum → Return "Minimum cart amount: $X"
- 3c. Already used → Return "Coupon already used"

**Postcondition**: Coupon applied to cart

---

### UC-CART-009: Remove Coupon from Cart
**Primary Actor**: Customer  
**Precondition**: Coupon applied to cart  
**Main Flow**:
1. Customer removes coupon
2. System removes coupon from cart
3. System recalculates cart total without discount
4. System updates Redis
5. System returns updated cart

**Postcondition**: Coupon removed

---

### UC-CART-010: Check Cart Item Availability
**Primary Actor**: Customer  
**Precondition**: Cart has items  
**Main Flow**:
1. Customer views cart
2. System checks each item with Inventory Service
3. System identifies unavailable items
4. System marks items as:
   - Available
   - Low stock (< 5)
   - Out of stock
5. System notifies customer of stock issues
6. System returns cart with availability status

**Alternative Flow**:
- 3a. Item out of stock → Suggest similar products

**Postcondition**: Stock availability displayed

---

### UC-CART-011: Save Cart for Later
**Primary Actor**: Customer  
**Precondition**: Customer is authenticated  
**Main Flow**:
1. Customer selects "Save for later"
2. System moves item from active cart to saved list
3. System updates Redis with saved items
4. System recalculates active cart
5. System returns updated cart and saved items

**Postcondition**: Item saved for later

---

### UC-CART-012: Move Saved Item to Cart
**Primary Actor**: Customer  
**Precondition**: Item in saved list  
**Main Flow**:
1. Customer clicks "Move to cart"
2. System validates product still available
3. System moves item from saved list to active cart
4. System updates Redis
5. System recalculates cart
6. System returns updated cart

**Alternative Flow**:
- 2a. Product unavailable → Notify customer, keep in saved

**Postcondition**: Item moved to active cart

---

### UC-CART-013: Handle Cart Expiration
**Primary Actor**: System  
**Precondition**: Cart TTL expired in Redis  
**Main Flow**:
1. Redis expires cart after 30 days inactivity
2. Cart data automatically removed
3. Customer returns → sees empty cart
4. System logs cart expiration for analytics

**Postcondition**: Expired cart removed

---

### UC-CART-014: Recalculate Cart Totals
**Primary Actor**: System  
**Precondition**: Cart modified  
**Main Flow**:
1. System sums item prices × quantities
2. System calculates subtotal
3. System applies coupon discount (if any)
4. System estimates tax (if applicable)
5. System estimates shipping (if applicable)
6. System calculates grand total
7. System updates cart in Redis

**Postcondition**: Cart totals recalculated

---

### UC-CART-015: Sync Cart Price Updates
**Primary Actor**: System (Product Service)  
**Precondition**: ProductPriceUpdated event received  
**Main Flow**:
1. System receives ProductPriceUpdated event
2. System searches Redis for carts containing product
3. System updates price snapshot in affected carts
4. System recalculates totals
5. System flags price change for customer notification
6. System stores updated carts

**Alternative Flow**:
- 2a. No carts found → Skip processing

**Postcondition**: Cart prices synced with product updates

