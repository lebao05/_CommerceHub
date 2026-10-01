# Go Microservices Database Schema

## Overview
Go services are designed for high-performance, real-time operations. This document covers database schemas for all Go-based microservices.

---

## 1. API Gateway Database: `gateway_db`

### Tables

#### `api_routes`
API route configurations (Level 1).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Route identifier |
| route_name | VARCHAR(100) | NOT NULL, UNIQUE | Route name |
| path_pattern | VARCHAR(255) | NOT NULL | URL path pattern |
| http_method | VARCHAR(10) | NOT NULL | HTTP method |
| service_name | VARCHAR(100) | NOT NULL | Target service |
| upstream_url | VARCHAR(500) | NOT NULL | Upstream URL |
| timeout_ms | INTEGER | DEFAULT 30000 | Request timeout |
| retry_count | INTEGER | DEFAULT 0 | Retry attempts |
| is_public | BOOLEAN | DEFAULT false | Public access flag |
| requires_auth | BOOLEAN | DEFAULT true | Authentication required |
| rate_limit_group | VARCHAR(50) | NULL | Rate limit group |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_api_routes_path` on `path_pattern`
- `idx_api_routes_service` on `service_name`
- `idx_api_routes_active` on `is_active`

---

#### `route_middlewares`
Middleware configurations for routes (Level 2).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Middleware identifier |
| route_id | BIGINT | NOT NULL, FK(api_routes.id) | Parent route |
| middleware_name | VARCHAR(50) | NOT NULL | Middleware name |
| execution_order | INTEGER | DEFAULT 0 | Execution order |
| config | JSONB | NULL | Middleware configuration |
| is_enabled | BOOLEAN | DEFAULT true | Enabled status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Constraints:**
- UNIQUE: `(route_id, middleware_name)`

**Indexes:**
- `idx_route_middlewares_route` on `route_id`
- `idx_route_middlewares_order` on `(route_id, execution_order)`

**Foreign Keys:**
- `route_id` REFERENCES `api_routes(id)` ON DELETE CASCADE

**Example JSONB config:**
```json
{
  "rate_limit": 100,
  "rate_window": "1m",
  "headers": {
    "X-Custom-Header": "value"
  }
}
```

---

#### `rate_limit_rules`
Rate limiting rules (Level 1).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Rule identifier |
| rule_name | VARCHAR(100) | NOT NULL, UNIQUE | Rule name |
| limit_type | VARCHAR(20) | NOT NULL | Type (IP, USER, API_KEY, GLOBAL) |
| requests_per_window | INTEGER | NOT NULL | Max requests |
| window_seconds | INTEGER | NOT NULL | Time window in seconds |
| burst_size | INTEGER | DEFAULT 0 | Burst allowance |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_rate_limit_rules_type` on `limit_type`

---

#### `rate_limit_overrides`
User/IP specific rate limit overrides (Level 2).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Override identifier |
| rule_id | BIGINT | NOT NULL, FK(rate_limit_rules.id) | Parent rule |
| identifier | VARCHAR(255) | NOT NULL | User ID, IP, or API key |
| identifier_type | VARCHAR(20) | NOT NULL | Type (IP, USER, API_KEY) |
| custom_limit | INTEGER | NOT NULL | Custom request limit |
| reason | TEXT | NULL | Override reason |
| expires_at | TIMESTAMP | NULL | Override expiry |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Constraints:**
- UNIQUE: `(rule_id, identifier)`

**Indexes:**
- `idx_rate_limit_overrides_rule` on `rule_id`
- `idx_rate_limit_overrides_identifier` on `identifier`
- `idx_rate_limit_overrides_expiry` on `expires_at`

**Foreign Keys:**
- `rule_id` REFERENCES `rate_limit_rules(id)` ON DELETE CASCADE

---

#### `api_requests_log`
API request logs for analytics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Log identifier |
| request_id | UUID | NOT NULL, UNIQUE | Request UUID |
| route_id | BIGINT | NULL, FK(api_routes.id) | Route reference |
| client_ip | INET | NOT NULL | Client IP address |
| user_id | BIGINT | NULL | User identifier |
| http_method | VARCHAR(10) | NOT NULL | HTTP method |
| path | VARCHAR(500) | NOT NULL | Request path |
| status_code | INTEGER | NOT NULL | Response status |
| response_time_ms | INTEGER | NOT NULL | Response time |
| request_size_bytes | INTEGER | NULL | Request size |
| response_size_bytes | INTEGER | NULL | Response size |
| user_agent | TEXT | NULL | User agent |
| error_message | TEXT | NULL | Error message if any |
| created_at | TIMESTAMP | DEFAULT NOW() | Request timestamp |

**Indexes:**
- `idx_api_requests_route` on `route_id`
- `idx_api_requests_ip` on `client_ip`
- `idx_api_requests_user` on `user_id`
- `idx_api_requests_status` on `status_code`
- `idx_api_requests_time` on `created_at`
- `idx_api_requests_response_time` on `response_time_ms`

**Foreign Keys:**
- `route_id` REFERENCES `api_routes(id)` ON DELETE SET NULL

---

## 2. Rate Limiter Service Database: `ratelimiter_db`

### Tables

#### `bucket_groups`
Rate limit bucket groups (Level 1).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Group identifier |
| group_name | VARCHAR(100) | NOT NULL, UNIQUE | Group name |
| algorithm | VARCHAR(20) | DEFAULT 'TOKEN_BUCKET' | Algorithm (TOKEN_BUCKET, LEAKY_BUCKET, FIXED_WINDOW) |
| capacity | INTEGER | NOT NULL | Bucket capacity |
| refill_rate | INTEGER | NOT NULL | Refill rate per second |
| description | TEXT | NULL | Group description |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_bucket_groups_name` on `group_name`

---

#### `bucket_instances`
Individual rate limit bucket instances (Level 2).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Instance identifier |
| group_id | BIGINT | NOT NULL, FK(bucket_groups.id) | Parent group |
| key | VARCHAR(255) | NOT NULL | Unique bucket key |
| current_tokens | INTEGER | NOT NULL | Current token count |
| last_refill_time | TIMESTAMP | NOT NULL | Last refill timestamp |
| expires_at | TIMESTAMP | NULL | Bucket expiry |
| metadata | JSONB | NULL | Additional metadata |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Constraints:**
- UNIQUE: `(group_id, key)`
- CHECK: `current_tokens >= 0`

**Indexes:**
- `idx_bucket_instances_group` on `group_id`
- `idx_bucket_instances_key` on `key`
- `idx_bucket_instances_expiry` on `expires_at`

**Foreign Keys:**
- `group_id` REFERENCES `bucket_groups(id)` ON DELETE CASCADE

---

#### `rate_limit_events`
Rate limit violation events.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Event identifier |
| bucket_key | VARCHAR(255) | NOT NULL | Bucket key |
| client_ip | INET | NOT NULL | Client IP |
| user_id | BIGINT | NULL | User identifier |
| endpoint | VARCHAR(255) | NOT NULL | API endpoint |
| event_type | VARCHAR(20) | NOT NULL | Type (ALLOWED, REJECTED, WARNING) |
| tokens_requested | INTEGER | NOT NULL | Tokens requested |
| tokens_available | INTEGER | NOT NULL | Tokens available |
| created_at | TIMESTAMP | DEFAULT NOW() | Event timestamp |

**Indexes:**
- `idx_rate_limit_events_key` on `bucket_key`
- `idx_rate_limit_events_ip` on `client_ip`
- `idx_rate_limit_events_type` on `event_type`
- `idx_rate_limit_events_time` on `created_at`

---

## 3. WebSocket Server Database: `websocket_db`

### Tables

#### `ws_namespaces`
WebSocket namespaces (Level 1).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Namespace identifier |
| namespace | VARCHAR(100) | NOT NULL, UNIQUE | Namespace path |
| description | TEXT | NULL | Namespace description |
| requires_auth | BOOLEAN | DEFAULT true | Authentication required |
| max_connections | INTEGER | DEFAULT 1000 | Max concurrent connections |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_ws_namespaces_namespace` on `namespace`

---

#### `ws_rooms`
WebSocket rooms within namespaces (Level 2).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Room identifier |
| namespace_id | BIGINT | NOT NULL, FK(ws_namespaces.id) | Parent namespace |
| room_name | VARCHAR(100) | NOT NULL | Room name |
| room_type | VARCHAR(50) | NOT NULL | Type (PUBLIC, PRIVATE, SYSTEM) |
| max_participants | INTEGER | DEFAULT 100 | Max participants |
| is_persistent | BOOLEAN | DEFAULT false | Persistent room |
| metadata | JSONB | NULL | Room metadata |
| created_by | BIGINT | NULL | Creator user ID |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Constraints:**
- UNIQUE: `(namespace_id, room_name)`

**Indexes:**
- `idx_ws_rooms_namespace` on `namespace_id`
- `idx_ws_rooms_type` on `room_type`

**Foreign Keys:**
- `namespace_id` REFERENCES `ws_namespaces(id)` ON DELETE CASCADE

---

#### `ws_connections`
Active WebSocket connections.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Connection identifier |
| connection_id | UUID | NOT NULL, UNIQUE | Connection UUID |
| namespace_id | BIGINT | NOT NULL, FK(ws_namespaces.id) | Namespace |
| user_id | BIGINT | NULL | User identifier |
| client_ip | INET | NOT NULL | Client IP |
| user_agent | TEXT | NULL | User agent |
| server_node | VARCHAR(100) | NOT NULL | Server node identifier |
| connected_at | TIMESTAMP | DEFAULT NOW() | Connection timestamp |
| last_ping | TIMESTAMP | DEFAULT NOW() | Last ping timestamp |

**Indexes:**
- `idx_ws_connections_connection_id` on `connection_id`
- `idx_ws_connections_namespace` on `namespace_id`
- `idx_ws_connections_user` on `user_id`
- `idx_ws_connections_server` on `server_node`

**Foreign Keys:**
- `namespace_id` REFERENCES `ws_namespaces(id)` ON DELETE CASCADE

---

#### `ws_room_members`
Room membership tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| connection_id | UUID | NOT NULL, FK(ws_connections.connection_id) | Connection |
| room_id | BIGINT | NOT NULL, FK(ws_rooms.id) | Room |
| joined_at | TIMESTAMP | DEFAULT NOW() | Join timestamp |

**Constraints:**
- PRIMARY KEY: `(connection_id, room_id)`

**Indexes:**
- `idx_ws_room_members_connection` on `connection_id`
- `idx_ws_room_members_room` on `room_id`

**Foreign Keys:**
- `connection_id` REFERENCES `ws_connections(connection_id)` ON DELETE CASCADE
- `room_id` REFERENCES `ws_rooms(id)` ON DELETE CASCADE

---

#### `ws_messages`
WebSocket message history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Message identifier |
| room_id | BIGINT | NULL, FK(ws_rooms.id) | Target room |
| connection_id | UUID | NOT NULL | Sender connection |
| message_type | VARCHAR(50) | NOT NULL | Message type |
| payload | JSONB | NOT NULL | Message payload |
| created_at | TIMESTAMP | DEFAULT NOW() | Message timestamp |

**Indexes:**
- `idx_ws_messages_room` on `room_id`
- `idx_ws_messages_connection` on `connection_id`
- `idx_ws_messages_time` on `created_at`

**Foreign Keys:**
- `room_id` REFERENCES `ws_rooms(id)` ON DELETE CASCADE

---

## 4. Caching Proxy Database: `cache_db`

### Tables

#### `cache_policies`
Cache policy definitions (Level 1).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Policy identifier |
| policy_name | VARCHAR(100) | NOT NULL, UNIQUE | Policy name |
| description | TEXT | NULL | Policy description |
| ttl_seconds | INTEGER | NOT NULL | Time to live |
| max_size_bytes | BIGINT | NULL | Max cache size |
| eviction_strategy | VARCHAR(20) | DEFAULT 'LRU' | Eviction (LRU, LFU, FIFO) |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_cache_policies_name` on `policy_name`

---

#### `cache_rules`
Cache rules for specific patterns (Level 2).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Rule identifier |
| policy_id | BIGINT | NOT NULL, FK(cache_policies.id) | Parent policy |
| pattern | VARCHAR(255) | NOT NULL | URL/Key pattern |
| http_methods | VARCHAR(100) | DEFAULT 'GET' | Cached HTTP methods |
| cache_key_template | VARCHAR(500) | NULL | Cache key template |
| headers_to_include | TEXT[] | NULL | Headers in cache key |
| query_params_to_include | TEXT[] | NULL | Query params in key |
| is_enabled | BOOLEAN | DEFAULT true | Enabled status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Constraints:**
- UNIQUE: `(policy_id, pattern)`

**Indexes:**
- `idx_cache_rules_policy` on `policy_id`
- `idx_cache_rules_pattern` on `pattern`

**Foreign Keys:**
- `policy_id` REFERENCES `cache_policies(id)` ON DELETE CASCADE

---

#### `cache_entries`
Cache entry metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Entry identifier |
| cache_key | VARCHAR(500) | NOT NULL, UNIQUE | Cache key |
| policy_id | BIGINT | NOT NULL, FK(cache_policies.id) | Applied policy |
| size_bytes | INTEGER | NOT NULL | Entry size |
| hit_count | INTEGER | DEFAULT 0 | Cache hits |
| last_accessed | TIMESTAMP | DEFAULT NOW() | Last access time |
| expires_at | TIMESTAMP | NOT NULL | Expiration time |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_cache_entries_key` on `cache_key`
- `idx_cache_entries_policy` on `policy_id`
- `idx_cache_entries_expiry` on `expires_at`
- `idx_cache_entries_accessed` on `last_accessed`

**Foreign Keys:**
- `policy_id` REFERENCES `cache_policies(id)` ON DELETE CASCADE

---

#### `cache_stats`
Cache statistics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Stats identifier |
| policy_id | BIGINT | NOT NULL, FK(cache_policies.id) | Policy reference |
| stats_date | DATE | NOT NULL | Stats date |
| total_requests | BIGINT | DEFAULT 0 | Total requests |
| cache_hits | BIGINT | DEFAULT 0 | Cache hits |
| cache_misses | BIGINT | DEFAULT 0 | Cache misses |
| bytes_served | BIGINT | DEFAULT 0 | Bytes served |
| avg_response_time_ms | INTEGER | DEFAULT 0 | Avg response time |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Constraints:**
- UNIQUE: `(policy_id, stats_date)`

**Indexes:**
- `idx_cache_stats_policy` on `policy_id`
- `idx_cache_stats_date` on `stats_date`

**Foreign Keys:**
- `policy_id` REFERENCES `cache_policies(id)` ON DELETE CASCADE

---

## 5. Metrics Collector Database: `metrics_db`

### Tables

#### `metric_sources`
Metric source systems (Level 1).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Source identifier |
| source_name | VARCHAR(100) | NOT NULL, UNIQUE | Source name |
| source_type | VARCHAR(50) | NOT NULL | Type (SERVICE, DATABASE, EXTERNAL) |
| endpoint | VARCHAR(255) | NULL | Metric endpoint |
| collection_interval | INTEGER | DEFAULT 60 | Interval in seconds |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_metric_sources_name` on `source_name`
- `idx_metric_sources_type` on `source_type`

---

#### `metric_definitions`
Metric definitions within sources (Level 2).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Definition identifier |
| source_id | BIGINT | NOT NULL, FK(metric_sources.id) | Parent source |
| metric_name | VARCHAR(100) | NOT NULL | Metric name |
| metric_type | VARCHAR(20) | NOT NULL | Type (COUNTER, GAUGE, HISTOGRAM) |
| unit | VARCHAR(20) | NULL | Unit of measurement |
| description | TEXT | NULL | Metric description |
| aggregation_method | VARCHAR(20) | DEFAULT 'AVG' | Aggregation (AVG, SUM, MIN, MAX) |
| retention_days | INTEGER | DEFAULT 90 | Data retention |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Constraints:**
- UNIQUE: `(source_id, metric_name)`

**Indexes:**
- `idx_metric_definitions_source` on `source_id`
- `idx_metric_definitions_name` on `metric_name`
- `idx_metric_definitions_type` on `metric_type`

**Foreign Keys:**
- `source_id` REFERENCES `metric_sources(id)` ON DELETE CASCADE

---

#### `metric_data_points`
Time-series metric data points.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Data point identifier |
| metric_id | BIGINT | NOT NULL, FK(metric_definitions.id) | Metric reference |
| timestamp | TIMESTAMP | NOT NULL | Data point timestamp |
| value | DOUBLE PRECISION | NOT NULL | Metric value |
| tags | JSONB | NULL | Additional tags |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_metric_data_points_metric` on `metric_id`
- `idx_metric_data_points_timestamp` on `timestamp`
- `idx_metric_data_points_metric_time` on `(metric_id, timestamp DESC)`

**Foreign Keys:**
- `metric_id` REFERENCES `metric_definitions(id)` ON DELETE CASCADE

---

#### `metric_alerts`
Metric alert definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Alert identifier |
| metric_id | BIGINT | NOT NULL, FK(metric_definitions.id) | Metric reference |
| alert_name | VARCHAR(100) | NOT NULL | Alert name |
| condition | VARCHAR(20) | NOT NULL | Condition (GT, LT, EQ) |
| threshold | DOUBLE PRECISION | NOT NULL | Alert threshold |
| duration_seconds | INTEGER | DEFAULT 60 | Duration before alert |
| severity | VARCHAR(20) | DEFAULT 'WARNING' | Severity (INFO, WARNING, CRITICAL) |
| notification_channels | TEXT[] | NULL | Notification channels |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_metric_alerts_metric` on `metric_id`
- `idx_metric_alerts_active` on `is_active`

**Foreign Keys:**
- `metric_id` REFERENCES `metric_definitions(id)` ON DELETE CASCADE

---

#### `alert_incidents`
Alert incident records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Incident identifier |
| alert_id | BIGINT | NOT NULL, FK(metric_alerts.id) | Alert reference |
| triggered_at | TIMESTAMP | NOT NULL | Trigger timestamp |
| resolved_at | TIMESTAMP | NULL | Resolution timestamp |
| max_value | DOUBLE PRECISION | NOT NULL | Max value during incident |
| status | VARCHAR(20) | DEFAULT 'OPEN' | Status (OPEN, ACKNOWLEDGED, RESOLVED) |
| acknowledged_by | VARCHAR(100) | NULL | User who acknowledged |
| resolution_notes | TEXT | NULL | Resolution notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_alert_incidents_alert` on `alert_id`
- `idx_alert_incidents_status` on `status`
- `idx_alert_incidents_triggered` on `triggered_at`

**Foreign Keys:**
- `alert_id` REFERENCES `metric_alerts(id)` ON DELETE CASCADE

---

## Structure Examples

### API Gateway Route Structure
```
Route: /api/v1/products (Level 1)
├── Middleware: Authentication (execution_order: 1)
├── Middleware: Rate Limiter (execution_order: 2)
└── Middleware: Logger (execution_order: 3)

Route: /api/v1/orders (Level 1)
├── Middleware: Authentication (execution_order: 1)
└── Middleware: Authorization (execution_order: 2)
```

### Rate Limiter Bucket Structure
```
Bucket Group: API Endpoints (Level 1)
├── Bucket Instance: user:12345 (key)
├── Bucket Instance: ip:192.168.1.1 (key)
└── Bucket Instance: api_key:abc123 (key)

Bucket Group: Admin Endpoints (Level 1)
├── Bucket Instance: user:admin:1 (key)
└── Bucket Instance: user:admin:2 (key)
```

### WebSocket Namespace Structure
```
Namespace: /notifications (Level 1)
├── Room: user:12345 (private)
├── Room: order:updates (public)
└── Room: system:alerts (system)

Namespace: /chat (Level 1)
├── Room: support:ticket:123 (private)
└── Room: general (public)
```

### Cache Policy Structure
```
Cache Policy: Product Catalog (Level 1, TTL: 3600s)
├── Rule: /api/products/* (pattern)
├── Rule: /api/categories/* (pattern)
└── Rule: /api/brands/* (pattern)

Cache Policy: User Sessions (Level 1, TTL: 1800s)
├── Rule: /api/user/profile/* (pattern)
└── Rule: /api/user/preferences/* (pattern)
```

### Metrics Collection Structure
```
Source: Product Service (Level 1)
├── Metric: http_requests_total (counter)
├── Metric: response_time_ms (histogram)
└── Metric: active_connections (gauge)

Source: Order Service (Level 1)
├── Metric: orders_created (counter)
├── Metric: order_processing_time (histogram)
└── Metric: failed_orders (counter)
```

---

## Sample Queries

### Get active routes with middlewares
```sql
SELECT 
  ar.route_name,
  ar.path_pattern,
  ar.http_method,
  rm.middleware_name,
  rm.execution_order
FROM api_routes ar
LEFT JOIN route_middlewares rm ON ar.id = rm.route_id
WHERE ar.is_active = true AND rm.is_enabled = true
ORDER BY ar.route_name, rm.execution_order;
```

### Check rate limit for user
```sql
SELECT 
  bi.current_tokens,
  bg.capacity,
  bi.last_refill_time
FROM bucket_instances bi
JOIN bucket_groups bg ON bi.group_id = bg.id
WHERE bi.key = $1
  AND bg.is_active = true;
```

### Get WebSocket room participants
```sql
SELECT 
  wc.connection_id,
  wc.user_id,
  wc.client_ip,
  wrm.joined_at
FROM ws_room_members wrm
JOIN ws_connections wc ON wrm.connection_id = wc.connection_id
WHERE wrm.room_id = $1
ORDER BY wrm.joined_at;
```

### Calculate cache hit rate
```sql
SELECT 
  cp.policy_name,
  SUM(cs.cache_hits) as total_hits,
  SUM(cs.cache_misses) as total_misses,
  ROUND(100.0 * SUM(cs.cache_hits) / NULLIF(SUM(cs.cache_hits + cs.cache_misses), 0), 2) as hit_rate_percent
FROM cache_stats cs
JOIN cache_policies cp ON cs.policy_id = cp.id
WHERE cs.stats_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY cp.policy_name;
```

### Get metric trends
```sql
SELECT 
  md.metric_name,
  DATE_TRUNC('hour', mdp.timestamp) as hour,
  AVG(mdp.value) as avg_value,
  MAX(mdp.value) as max_value,
  MIN(mdp.value) as min_value
FROM metric_data_points mdp
JOIN metric_definitions md ON mdp.metric_id = md.id
WHERE md.metric_name = $1
  AND mdp.timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY md.metric_name, hour
ORDER BY hour DESC;
```

---

## Performance Optimization

### Partitioning Strategy
- `api_requests_log`: Partition by month on `created_at`
- `metric_data_points`: Partition by week on `timestamp`
- `ws_messages`: Partition by month on `created_at`

### Index Strategy
- Use partial indexes for active/enabled records
- B-tree indexes for exact lookups
- GIN indexes for JSONB columns
- Time-based indexes for range queries

### Data Retention
- API logs: 90 days
- Metric data: Based on `retention_days` in definition
- WebSocket messages: 30 days
- Cache entries: Automatic expiry based on TTL
