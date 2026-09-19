# Review & Rating Service - Use Cases

## Actors
- **Customer**: End user submitting/viewing reviews
- **Seller**: Vendor responding to reviews
- **Admin**: System administrator moderating reviews
- **System**: Other microservices

## Use Cases

### UC-REV-001: Create Product Review
**Primary Actor**: Customer  
**Precondition**: Customer purchased and received product  
**Main Flow**:
1. Customer submits review with:
   - ProductId
   - OrderId
   - Rating (1-5 stars)
   - Title
   - Comment
   - Photos (optional)
2. System validates customer authentication
3. System validates customer purchased product
4. System validates order delivered
5. System validates no duplicate review for this order+product
6. System validates rating between 1-5
7. System validates comment length (max 5000 chars)
8. System uploads review photos (if provided)
9. System creates review with status = PENDING_MODERATION
10. System publishes ReviewCreated event
11. System returns review confirmation

**Alternative Flow**:
- 3a. Customer didn't purchase → Return "Must purchase to review"
- 4a. Order not delivered → Return "Cannot review undelivered order"
- 5a. Already reviewed → Return "Already reviewed this product"
- 6a. Invalid rating → Return validation error

**Postcondition**: Review created and pending moderation

---

### UC-REV-002: Moderate Review
**Primary Actor**: Admin, System  
**Precondition**: Review pending moderation  
**Main Flow**:
1. System/Admin retrieves pending reviews
2. System analyzes review content:
   - Profanity check
   - Spam detection
   - Relevance check
   - Sentiment analysis
3. If automated checks pass:
   - System auto-approves
   - Status = APPROVED
4. If suspicious:
   - System flags for manual review
   - Admin reviews content
   - Admin approves or rejects with reason
5. System updates review status
6. If approved:
   - System publishes ReviewApproved event
   - System updates product rating aggregate
7. If rejected:
   - System publishes ReviewRejected event
   - System notifies customer with reason

**Alternative Flow**:
- 2a. Contains profanity → Auto-reject
- 2b. Spam detected → Auto-reject

**Postcondition**: Review moderated and published or rejected

---

### UC-REV-003: Update Product Rating Aggregate
**Primary Actor**: System  
**Precondition**: ReviewApproved event received  
**Main Flow**:
1. System receives ReviewApproved event with:
   - ProductId
   - Rating
2. System validates event idempotency
3. System retrieves product rating aggregate
4. System recalculates:
   - TotalReviews += 1
   - RatingSum += rating
   - AverageRating = RatingSum / TotalReviews
   - RatingDistribution (1-star count, 2-star, etc.)
5. System updates product rating in database
6. System invalidates product cache
7. System publishes ProductRatingUpdated event
8. System stores processed event ID

**Alternative Flow**:
- 2a. Duplicate event → Skip processing

**Postcondition**: Product rating updated

---

### UC-REV-004: Get Product Reviews
**Primary Actor**: Customer  
**Precondition**: Product exists  
**Main Flow**:
1. Customer requests reviews for product
2. System validates product exists
3. System applies filters:
   - Rating (e.g., 5-star only)
   - Verified purchase only
   - With photos only
   - Sort by (newest, highest rated, most helpful)
4. System retrieves approved reviews with pagination
5. System includes for each review:
   - Rating
   - Title
   - Comment
   - Reviewer name (masked)
   - Verified badge
   - Photos
   - Helpful count
   - Date
   - Seller response (if any)
6. System returns paginated review list

**Alternative Flow**:
- 2a. Product not found → Return 404

**Postcondition**: Product reviews displayed

---

### UC-REV-005: Mark Review as Helpful
**Primary Actor**: Customer  
**Precondition**: Review exists  
**Main Flow**:
1. Customer clicks "Helpful" on review
2. System validates customer authentication
3. System checks if customer already marked helpful
4. If not marked:
   - System increments helpful count
   - System stores customer vote
5. If already marked:
   - System removes helpful mark
   - System decrements helpful count
6. System returns updated helpful count

**Alternative Flow**:
- 3a. Already marked → Toggle off

**Postcondition**: Helpful vote recorded

---

### UC-REV-006: Report Review
**Primary Actor**: Customer  
**Precondition**: Review exists  
**Main Flow**:
1. Customer reports review with reason:
   - Inappropriate content
   - Spam
   - Fake review
   - Off-topic
   - Other (with description)
2. System validates customer authentication
3. System creates report record
4. System increments review report count
5. If report count > threshold (e.g., 5):
   - System auto-hides review
   - System notifies moderator
6. System returns confirmation

**Postcondition**: Review reported, flagged if needed

---

### UC-REV-007: Seller Response to Review
**Primary Actor**: Seller  
**Precondition**: Review approved, seller owns product  
**Main Flow**:
1. Seller submits response to review:
   - ResponseText
   - ReviewId
2. System validates seller authentication
3. System validates seller owns product
4. System validates no existing response
5. System validates response length (max 2000 chars)
6. System creates seller response with status = PENDING
7. System moderates response
8. If approved:
   - System links response to review
   - System publishes SellerResponseCreated event
   - System notifies customer
9. System returns response confirmation

**Alternative Flow**:
- 3a. Seller doesn't own product → Return 403
- 4a. Already responded → Return "Already responded"

**Postcondition**: Seller response added to review

---

### UC-REV-008: Update Review
**Primary Actor**: Customer  
**Precondition**: Customer owns review, within edit window  
**Main Flow**:
1. Customer updates review with:
   - New rating (optional)
   - New comment (optional)
   - New photos (optional)
2. System validates customer owns review
3. System validates within edit window (7 days)
4. System validates new content
5. System updates review
6. If rating changed:
   - System recalculates product rating
7. System updates review status = PENDING_MODERATION
8. System publishes ReviewUpdated event
9. System returns success

**Alternative Flow**:
- 2a. Not review owner → Return 403
- 3a. Edit window expired → Return "Cannot edit after 7 days"

**Postcondition**: Review updated and re-moderated

---

### UC-REV-009: Delete Review
**Primary Actor**: Customer, Admin  
**Precondition**: Review exists  
**Main Flow**:
1. User requests review deletion
2. System validates authorization:
   - Customer owns review OR Admin
3. System soft deletes review
4. System publishes ReviewDeleted event
5. System recalculates product rating (excluding this review)
6. System returns success

**Alternative Flow**:
- 2a. Unauthorized → Return 403

**Postcondition**: Review deleted, rating recalculated

---

### UC-REV-010: Get Review Summary
**Primary Actor**: Customer  
**Precondition**: Product has reviews  
**Main Flow**:
1. Customer views product page
2. System retrieves review summary for product:
   - Average rating (e.g., 4.3)
   - Total review count
   - Rating distribution:
     * 5 stars: 120 (60%)
     * 4 stars: 50 (25%)
     * 3 stars: 20 (10%)
     * 2 stars: 5 (2.5%)
     * 1 star: 5 (2.5%)
   - Verified purchase percentage
   - Recent reviews preview
3. System caches summary (1 hour TTL)
4. System returns summary

**Postcondition**: Review summary displayed

---

### UC-REV-011: Filter Reviews by Rating
**Primary Actor**: Customer  
**Precondition**: Product has reviews  
**Main Flow**:
1. Customer selects rating filter (e.g., 5 stars only)
2. System retrieves reviews matching filter
3. System applies sorting (newest first by default)
4. System returns filtered reviews with pagination

**Postcondition**: Filtered reviews displayed

---

### UC-REV-012: Sort Reviews
**Primary Actor**: Customer  
**Precondition**: Viewing product reviews  
**Main Flow**:
1. Customer selects sort option:
   - Most recent
   - Highest rating
   - Lowest rating
   - Most helpful
   - Verified purchases first
2. System applies sorting
3. System retrieves reviews with pagination
4. System returns sorted reviews

**Postcondition**: Reviews sorted as requested

---

### UC-REV-013: Search Reviews
**Primary Actor**: Customer  
**Precondition**: Product has reviews  
**Main Flow**:
1. Customer enters search query (e.g., "battery life")
2. System searches review content:
   - Title
   - Comment text
3. System ranks by relevance
4. System highlights matching terms
5. System returns matching reviews

**Alternative Flow**:
- 3a. No matches → Return empty result

**Postcondition**: Matching reviews displayed

---

### UC-REV-014: Upload Review Photos
**Primary Actor**: Customer  
**Precondition**: Creating or updating review  
**Main Flow**:
1. Customer uploads photos (max 5)
2. System validates file types (jpg, png, webp)
3. System validates file sizes (< 5MB each)
4. System validates image content (no inappropriate)
5. System resizes images for display
6. System uploads to storage (S3, CDN)
7. System generates URLs
8. System links photos to review
9. System returns photo URLs

**Alternative Flow**:
- 2a. Invalid file type → Return error
- 3a. File too large → Return "Max 5MB per photo"
- 4a. Inappropriate content detected → Reject

**Postcondition**: Review photos uploaded

---

### UC-REV-015: Get Verified Purchase Badge
**Primary Actor**: System  
**Precondition**: Review being displayed  
**Main Flow**:
1. System checks if review linked to order
2. System validates order delivered
3. If valid order:
   - System displays "Verified Purchase" badge
4. If no order link:
   - System displays review without badge

**Postcondition**: Verified badge displayed if applicable

---

### UC-REV-016: Prompt Customer for Review
**Primary Actor**: System  
**Precondition**: Order delivered 2 days ago  
**Main Flow**:
1. System identifies delivered orders without reviews
2. System filters orders older than 2 days
3. System checks if review already requested
4. System publishes ReviewReminderRequested event
5. Notification Service sends review request email
6. System marks review requested
7. System schedules follow-up (after 7 days)

**Alternative Flow**:
- 3a. Already requested → Skip
- 4a. Customer opted-out → Skip

**Postcondition**: Review request sent to customer

---

### UC-REV-017: Generate Review Analytics
**Primary Actor**: Seller, Admin  
**Precondition**: Product has reviews  
**Main Flow**:
1. User requests review analytics for product
2. System aggregates data:
   - Total reviews over time
   - Average rating trend
   - Sentiment analysis (positive/negative/neutral)
   - Common keywords/themes
   - Response rate
   - Most helpful reviews
3. System generates visualizations
4. System returns analytics dashboard

**Postcondition**: Review analytics displayed

---

### UC-REV-018: Detect Fake Reviews
**Primary Actor**: System  
**Precondition**: Review submitted  
**Main Flow**:
1. System analyzes review for fraud signals:
   - Multiple reviews from same IP
   - Generic/template language
   - Overly positive without specifics
   - Review velocity (too many too fast)
   - Reviewer has no order history
2. System calculates fraud score
3. If score > threshold:
   - System flags for manual review
   - System may auto-reject
4. System logs fraud analysis
5. System updates review status

**Alternative Flow**:
- 3a. Clear fraud → Auto-reject and blacklist

**Postcondition**: Fake review detected and handled

---

### UC-REV-019: Export Product Reviews
**Primary Actor**: Seller, Admin  
**Precondition**: User has permission  
**Main Flow**:
1. User requests review export for product
2. System validates authorization
3. System retrieves all reviews (approved only)
4. System generates export file:
   - Format: CSV or JSON
   - Includes: rating, comment, date, verified status
5. System returns download link

**Postcondition**: Reviews exported

---

### UC-REV-020: Handle Review Incentive Compliance
**Primary Actor**: System  
**Precondition**: Review submitted with incentive disclosure  
**Main Flow**:
1. Customer indicates received incentive for review
2. System requires disclosure statement
3. System validates disclosure included
4. System adds "Incentivized Review" badge
5. System stores incentive type
6. System publishes review with disclosure
7. System maintains compliance records

**Alternative Flow**:
- 3a. No disclosure → Require before publishing

**Postcondition**: Incentivized review properly disclosed

