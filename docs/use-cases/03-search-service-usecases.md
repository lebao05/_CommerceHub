# Search Service - Use Cases

## Actors
- **Customer**: End user searching for products
- **System**: Product Service publishing events

## Use Cases

### UC-SEARCH-001: Index Product
**Primary Actor**: System (Product Service)  
**Precondition**: ProductCreated or ProductUpdated event received  
**Main Flow**:
1. System receives ProductCreated/Updated event from message broker
2. System validates event data
3. System transforms product data for search index
4. System indexes product in Elasticsearch/OpenSearch
5. System stores event ID for idempotency
6. System returns success

**Alternative Flow**:
- 2a. Duplicate event → Check idempotency, skip processing
- 4a. Elasticsearch error → Retry with backoff, send to DLQ if failed

**Postcondition**: Product indexed and searchable

---

### UC-SEARCH-002: Search Products
**Primary Actor**: Customer  
**Precondition**: None  
**Main Flow**:
1. Customer enters search query (e.g., "gaming laptop")
2. System validates query parameters
3. System builds Elasticsearch query with:
   - Full-text search on name, description
   - Filters (category, brand, price range)
   - Sorting (relevance, price, newest)
4. System executes search
5. System returns paginated results with highlights
6. System logs search query for analytics

**Alternative Flow**:
- 2a. Empty query → Return validation error or all products

**Postcondition**: Search results returned

---

### UC-SEARCH-003: Autocomplete Search
**Primary Actor**: Customer  
**Precondition**: Customer typing in search box  
**Main Flow**:
1. Customer types partial query (e.g., "gam")
2. System receives autocomplete request
3. System queries completion suggester in Elasticsearch
4. System returns top 10 suggestions ordered by relevance
5. System includes popular searches and product matches

**Alternative Flow**:
- 3a. Query too short (< 2 chars) → Return empty or trending searches

**Postcondition**: Autocomplete suggestions displayed

---

### UC-SEARCH-004: Filter Products
**Primary Actor**: Customer  
**Precondition**: Customer on search/browse page  
**Main Flow**:
1. Customer applies filters:
   - Category
   - Price range (min, max)
   - Rating (min stars)
   - Availability (in stock)
2. System builds filtered query
3. System retrieves aggregations for filter counts
4. System executes search with filters
5. System returns filtered results with facet counts

**Postcondition**: Filtered results displayed

---

### UC-SEARCH-005: Sort Products
**Primary Actor**: Customer  
**Precondition**: Customer viewing search results  
**Main Flow**:
1. Customer selects sort option:
   - Relevance (default)
   - Price: Low to High
   - Price: High to Low
   - Newest First
   - Best Rating
2. System applies sort to query
3. System executes search
4. System returns sorted results

**Postcondition**: Results sorted as requested

---

### UC-SEARCH-006: Remove Deleted Product from Index
**Primary Actor**: System (Product Service)  
**Precondition**: ProductDeleted event received  
**Main Flow**:
1. System receives ProductDeleted event
2. System validates event
3. System removes product from Elasticsearch index
4. System stores event ID for idempotency
5. System returns success

**Alternative Flow**:
- 3a. Product not found in index → Log warning, continue

**Postcondition**: Product removed from search

---

### UC-SEARCH-007: Reindex All Products
**Primary Actor**: Admin  
**Precondition**: Admin has permission, initiated manually  
**Main Flow**:
1. Admin triggers full reindex
2. System creates new index with timestamp
3. System retrieves all active products from Product Service
4. System bulk indexes products in batches
5. System validates index completion
6. System switches alias to new index
7. System deletes old index
8. System returns reindex report

**Alternative Flow**:
- 4a. Indexing error → Retry batch, continue
- 6a. Validation fails → Keep old index, report error

**Postcondition**: Search index fully refreshed

---

### UC-SEARCH-008: Search by Category
**Primary Actor**: Customer  
**Precondition**: Customer browses category  
**Main Flow**:
1. Customer clicks category (e.g., "Electronics")
2. System retrieves category and subcategories
3. System queries products in category hierarchy
4. System applies default sorting (featured/popular)
5. System returns category products with filters

**Postcondition**: Category products displayed

---

### UC-SEARCH-009: Get Search Suggestions
**Primary Actor**: Customer  
**Precondition**: None  
**Main Flow**:
1. Customer views search box
2. System returns trending searches
3. System returns personalized suggestions (if logged in)
4. System returns category suggestions

**Postcondition**: Search suggestions displayed

---

### UC-SEARCH-010: Fuzzy Search
**Primary Actor**: Customer  
**Precondition**: Customer makes typo in search  
**Main Flow**:
1. Customer searches with typo (e.g., "iPhne")
2. System applies fuzzy matching (edit distance = 2)
3. System finds similar terms (e.g., "iPhone")
4. System shows "Did you mean: iPhone?"
5. System returns results for corrected query

**Postcondition**: Results shown despite typo

---

### UC-SEARCH-011: Search Analytics
**Primary Actor**: System  
**Precondition**: Search queries logged  
**Main Flow**:
1. System collects search query data:
   - Query text
   - Results count
   - Click-through rate
   - Zero-result searches
2. System aggregates analytics
3. System identifies popular searches
4. System identifies failed searches (zero results)
5. System publishes analytics for business intelligence

**Postcondition**: Search analytics available

---

### UC-SEARCH-012: Handle Price Update in Index
**Primary Actor**: System (Product Service)  
**Precondition**: ProductPriceUpdated event received  
**Main Flow**:
1. System receives ProductPriceUpdated event
2. System validates event and extracts price
3. System partially updates product document (price field only)
4. System invalidates cached search results containing product
5. System stores event ID for idempotency

**Postcondition**: Product price updated in search index

---

### UC-SEARCH-013: Boost Product Ranking
**Primary Actor**: Admin, System  
**Precondition**: Product exists in index  
**Main Flow**:
1. Admin sets boost score for product/category
2. System updates product document with boost factor
3. Search queries apply boost in scoring
4. Boosted products rank higher in results

**Alternative Flow**:
- Featured products get 2x boost
- Promoted products get 1.5x boost
- New products get 1.2x boost

**Postcondition**: Product ranking adjusted

