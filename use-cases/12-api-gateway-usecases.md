# API Gateway - Use Cases

## Actors
- **Customer**: End user accessing the platform
- **Seller**: Vendor accessing seller portal
- **Admin**: System administrator
- **External Service**: Third-party integrations
- **Backend Services**: Microservices behind gateway

## Use Cases

### UC-GW-001: Route Request to Service
**Primary Actor**: Customer  
**Precondition**: Customer makes API request  
**Main Flow**:
1. Client sends HTTP request to gateway endpoint:
   - GET /api/products/123
2. Gateway receives request
3. Gateway parses request path and method
4. Gateway matches route to target service:
   - /api/products/* → Product Service
   - /api/orders/* → Order Service
   - /api/cart/* → Cart Service
5. Gateway forwards request to target service
6. Service processes and returns response
7. Gateway returns response to client

**Alternative Flow**:
- 4a. No matching route → Return 404 Not Found
- 5a. Service unreachable → Return 503 Service Unavailable

**Postcondition**: Request routed to correct service

---

### UC-GW-002: Authenticate Request
**Primary Actor**: Customer  
**Precondition**: Protected endpoint requires authentication  
**Main Flow**:
1. Client sends request with Authorization header:
   - Bearer {JWT_TOKEN}
2. Gateway extracts token from header
3. Gateway validates token:
   - Signature valid
   - Not expired
   - Not blacklisted
4. Gateway calls Identity Service to validate (or validates locally)
5. Identity Service returns user claims
6. Gateway adds user context to request headers:
   - X-User-Id
   - X-User-Email
   - X-User-Roles
7. Gateway forwards authenticated request to service
8. Service processes with user context

**Alternative Flow**:
- 2a. No token → Return 401 Unauthorized
- 3a. Invalid token → Return 401 Unauthorized
- 3b. Expired token → Return 401 with refresh instruction
- 3c. Blacklisted → Return 401 Unauthorized

**Postcondition**: Request authenticated and forwarded

---

### UC-GW-003: Authorize Request
**Primary Actor**: Customer  
**Precondition**: Request authenticated  
**Main Flow**:
1. Gateway has authenticated user with roles
2. Gateway checks route authorization rules:
   - /api/admin/* → Requires Admin role
   - /api/seller/* → Requires Seller role
   - /api/orders/* → Requires authenticated user
3. Gateway validates user has required role
4. If authorized:
   - Gateway forwards request
5. If not authorized:
   - Gateway returns 403 Forbidden

**Alternative Flow**:
- 3a. Missing required role → Return 403 Forbidden
- 3b. Resource-level check needed → Forward to service for fine-grained authz

**Postcondition**: Request authorized or rejected

---

### UC-GW-004: Rate Limiting
**Primary Actor**: Customer  
**Precondition**: Client making API requests  
**Main Flow**:
1. Client sends request
2. Gateway identifies client by:
   - User ID (if authenticated)
   - IP address (if anonymous)
   - API key (if provided)
3. Gateway checks rate limit from Redis:
   - Authenticated: 1000 requests/hour
   - Anonymous: 100 requests/hour
4. Gateway increments request counter
5. If under limit:
   - Gateway processes request
   - Gateway adds rate limit headers:
     * X-RateLimit-Limit
     * X-RateLimit-Remaining
     * X-RateLimit-Reset
6. If limit exceeded:
   - Gateway returns 429 Too Many Requests
   - Gateway includes Retry-After header

**Alternative Flow**:
- 6a. Premium user → Higher rate limits

**Postcondition**: Request rate limited appropriately

---

### UC-GW-005: Generate Correlation ID
**Primary Actor**: System  
**Precondition**: Request received  
**Main Flow**:
1. Gateway receives incoming request
2. Gateway checks for existing correlation ID:
   - X-Correlation-Id header
3. If not present:
   - Gateway generates unique correlation ID (UUID)
4. Gateway adds to request headers:
   - X-Correlation-Id
   - X-Request-Id (unique per request)
5. Gateway logs request with correlation ID
6. Gateway forwards request with IDs
7. All downstream services use same correlation ID
8. Gateway includes correlation ID in response headers

**Alternative Flow**:
- 2a. Correlation ID exists → Use existing

**Postcondition**: Request tracked with correlation ID

---

### UC-GW-006: Request Logging
**Primary Actor**: System  
**Precondition**: Request received  
**Main Flow**:
1. Gateway receives request
2. Gateway logs request details:
   - Timestamp
   - Correlation ID
   - Method
   - Path
   - Client IP
   - User ID (if authenticated)
   - User agent
   - Request size
3. Gateway forwards request
4. Gateway receives response from service
5. Gateway logs response details:
   - Status code
   - Response size
   - Latency
6. Gateway sends logs to centralized logging (ELK/OpenSearch)

**Postcondition**: Request/response logged for observability

---

### UC-GW-007: Response Caching
**Primary Actor**: Customer  
**Precondition**: Request to cacheable endpoint  
**Main Flow**:
1. Client requests cacheable resource:
   - GET /api/products/123
2. Gateway checks cache key in Redis
3. If cache hit:
   - Gateway returns cached response
   - Gateway adds X-Cache: HIT header
4. If cache miss:
   - Gateway forwards to service
   - Service returns response
   - Gateway caches response with TTL
   - Gateway returns response with X-Cache: MISS
5. Gateway includes cache headers:
   - Cache-Control
   - ETag

**Alternative Flow**:
- 2a. Cache expired → Treat as miss
- 4a. Response indicates no-cache → Don't cache

**Postcondition**: Response cached for future requests

---

### UC-GW-008: Request Transformation
**Primary Actor**: Customer  
**Precondition**: Request needs transformation  
**Main Flow**:
1. Client sends request in external format
2. Gateway applies transformations:
   - Header mapping (external → internal)
   - Query parameter conversion
   - Path parameter extraction
   - Body transformation (if needed)
3. Gateway forwards transformed request to service
4. Service processes request
5. Gateway receives response
6. Gateway transforms response:
   - Header mapping (internal → external)
   - Body transformation
   - Error code mapping
7. Gateway returns transformed response

**Postcondition**: Request/response transformed appropriately

---

### UC-GW-009: Load Balancing
**Primary Actor**: System  
**Precondition**: Multiple service instances available  
**Main Flow**:
1. Gateway receives request for service
2. Gateway retrieves available service instances:
   - Order Service: [instance-1, instance-2, instance-3]
3. Gateway selects instance using algorithm:
   - Round-robin
   - Least connections
   - Weighted round-robin
4. Gateway forwards request to selected instance
5. Gateway tracks instance health
6. If instance fails:
   - Gateway marks unhealthy
   - Gateway routes to healthy instance

**Alternative Flow**:
- 6a. All instances unhealthy → Return 503 Service Unavailable

**Postcondition**: Request load balanced across instances

---

### UC-GW-010: Circuit Breaker
**Primary Actor**: System  
**Precondition**: Service experiencing issues  
**Main Flow**:
1. Gateway tracks service health metrics:
   - Error rate
   - Response time
   - Timeout rate
2. If error rate > threshold (e.g., 50% in 1 min):
   - Gateway opens circuit breaker
   - Gateway state = OPEN
3. While circuit OPEN:
   - Gateway immediately returns 503
   - Gateway does not call service
4. After timeout (e.g., 30 seconds):
   - Gateway state = HALF_OPEN
5. In HALF_OPEN state:
   - Gateway allows limited requests through
   - If requests succeed → Close circuit
   - If requests fail → Reopen circuit

**Alternative Flow**:
- 5a. Service recovered → Circuit CLOSED, normal operation

**Postcondition**: Circuit breaker prevents cascading failures

---

### UC-GW-011: Request Timeout
**Primary Actor**: System  
**Precondition**: Request to backend service  
**Main Flow**:
1. Gateway forwards request to service
2. Gateway sets timeout (e.g., 30 seconds)
3. Gateway waits for response
4. If response within timeout:
   - Gateway forwards response
5. If timeout exceeded:
   - Gateway cancels request
   - Gateway returns 504 Gateway Timeout
   - Gateway logs timeout event
   - Gateway updates circuit breaker metrics

**Alternative Flow**:
- 5a. Retry-able request → Retry once before timeout

**Postcondition**: Request timeout handled gracefully

---

### UC-GW-012: CORS Handling
**Primary Actor**: Browser Client  
**Precondition**: Cross-origin request from web app  
**Main Flow**:
1. Browser sends preflight OPTIONS request
2. Gateway validates origin against allowed list:
   - https://example.com
   - https://app.example.com
3. If origin allowed:
   - Gateway returns CORS headers:
     * Access-Control-Allow-Origin
     * Access-Control-Allow-Methods
     * Access-Control-Allow-Headers
     * Access-Control-Max-Age
4. Browser sends actual request
5. Gateway includes CORS headers in response

**Alternative Flow**:
- 3a. Origin not allowed → Return 403 Forbidden

**Postcondition**: CORS configured for cross-origin requests

---

### UC-GW-013: Request Aggregation
**Primary Actor**: Customer  
**Precondition**: Client needs data from multiple services  
**Main Flow**:
1. Client requests aggregated endpoint:
   - GET /api/dashboard
2. Gateway makes parallel requests to:
   - Product Service (recent products)
   - Order Service (order summary)
   - Cart Service (cart count)
   - Notification Service (unread count)
3. Gateway waits for all responses (with timeout)
4. Gateway aggregates responses into single payload
5. Gateway returns combined response

**Alternative Flow**:
- 3a. One service times out → Return partial data with error indicator
- 3b. Critical service fails → Return error

**Postcondition**: Aggregated response returned to client

---

### UC-GW-014: API Versioning
**Primary Actor**: Customer  
**Precondition**: Multiple API versions exist  
**Main Flow**:
1. Client specifies API version:
   - /api/v1/products (legacy)
   - /api/v2/products (current)
   - Header: Accept: application/vnd.api.v2+json
2. Gateway routes to correct service version:
   - v1 → Product Service v1
   - v2 → Product Service v2
3. Gateway applies version-specific transformations
4. Gateway forwards request
5. Gateway returns response with version header

**Alternative Flow**:
- 2a. Unsupported version → Return 400 Bad Request

**Postcondition**: Request routed to correct API version

---

### UC-GW-015: Request Validation
**Primary Actor**: Customer  
**Precondition**: Request received  
**Main Flow**:
1. Gateway receives request
2. Gateway validates request:
   - Content-Type header present
   - Required headers present
   - Request body schema valid (if applicable)
   - Query parameters valid
3. If valid:
   - Gateway forwards request
4. If invalid:
   - Gateway returns 400 Bad Request with:
     * Validation errors
     * Field-level error messages

**Alternative Flow**:
- 3a. Schema validation fails → Return detailed errors

**Postcondition**: Invalid requests rejected early

---

### UC-GW-016: Response Compression
**Primary Actor**: System  
**Precondition**: Client supports compression  
**Main Flow**:
1. Client sends Accept-Encoding: gzip, deflate
2. Gateway receives response from service
3. Gateway checks response size (> 1KB)
4. Gateway compresses response using gzip
5. Gateway adds Content-Encoding: gzip header
6. Gateway returns compressed response
7. Client decompresses response

**Alternative Flow**:
- 3a. Response too small → Don't compress (overhead)

**Postcondition**: Response compressed to reduce bandwidth

---

### UC-GW-017: API Key Authentication
**Primary Actor**: External Service  
**Precondition**: Third-party integration  
**Main Flow**:
1. External service sends request with API key:
   - Header: X-API-Key: {key}
2. Gateway extracts API key
3. Gateway validates key with Identity Service
4. Identity Service returns:
   - Valid/Invalid
   - Associated client ID
   - Rate limits
   - Scopes/permissions
5. If valid:
   - Gateway applies client-specific rate limits
   - Gateway forwards request with client context
6. If invalid:
   - Gateway returns 401 Unauthorized

**Alternative Flow**:
- 5a. Key expired → Return 401 with renewal instruction
- 5b. Key revoked → Return 403 Forbidden

**Postcondition**: API key authenticated

---

### UC-GW-018: Health Check Endpoint
**Primary Actor**: Load Balancer, Monitoring System  
**Precondition**: Health check requested  
**Main Flow**:
1. System sends GET /health
2. Gateway checks own health:
   - Application running
   - Redis connection
   - Memory usage < threshold
3. Gateway optionally checks backend services:
   - Ping critical services
4. Gateway returns health status:
   - 200 OK if healthy
   - 503 Service Unavailable if unhealthy
5. Gateway includes health details:
   - Status: UP/DOWN
   - Version
   - Uptime
   - Checks: [redis: UP, services: UP]

**Alternative Flow**:
- 3a. Critical dependency down → Return 503

**Postcondition**: Health status reported

---

### UC-GW-019: SSL/TLS Termination
**Primary Actor**: Customer  
**Precondition**: HTTPS request  
**Main Flow**:
1. Client initiates HTTPS connection
2. Gateway performs TLS handshake
3. Gateway terminates SSL at gateway
4. Gateway decrypts request
5. Gateway forwards plain HTTP to backend services
6. Backend service returns response
7. Gateway encrypts response
8. Gateway returns HTTPS response to client

**Postcondition**: SSL terminated at gateway

---

### UC-GW-020: Metrics Collection
**Primary Actor**: System  
**Precondition**: Request processed  
**Main Flow**:
1. Gateway processes request
2. Gateway collects metrics:
   - Request count (by endpoint, method, status)
   - Response time (p50, p95, p99)
   - Error rate
   - Active connections
   - Cache hit rate
   - Circuit breaker state
3. Gateway exports metrics to Prometheus
4. Gateway updates metrics every 10 seconds
5. Grafana queries metrics for dashboards

**Postcondition**: Metrics available for monitoring

