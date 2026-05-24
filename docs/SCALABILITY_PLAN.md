# AutoCareX Scalability & Performance Plan

## Current Architecture Capacity

| Component | Current Setup | Max Capacity |
|-----------|--------------|--------------|
| Backend | 2x EC2 t3.large (ASG) | Auto-scale to 10 |
| Database | RDS PostgreSQL db.r6g.large | Vertical + read replicas |
| Cache | ElastiCache r6g.large | Cluster mode |
| Storage | S3 (unlimited) | Unlimited |
| CDN | CloudFront | Global edge |

---

## Phase 1: 0 → 10,000 Users (Launch)

**Architecture:** Monolith on EC2 with managed services

```
                    ┌─────────────────────────────────────┐
                    │         Route53 (DNS)               │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │     Application Load Balancer        │
                    │     (SSL Termination + WAF)          │
                    └───────┬─────────────┬───────────────┘
                            │             │
               ┌────────────▼──┐    ┌─────▼─────────────┐
               │  Backend EC2  │    │  Backend EC2       │
               │  (Node.js)    │    │  (Node.js)         │
               │  t3.large     │    │  t3.large          │
               └──────┬────────┘    └────────┬───────────┘
                      │                      │
         ┌────────────▼──────────────────────▼───────┐
         │                Redis Cluster               │
         │         (Session, Cache, Pub/Sub)          │
         └────────────────────┬───────────────────────┘
                              │
         ┌────────────────────▼───────────────────────┐
         │              PostgreSQL RDS                 │
         │         (Primary + 1 Read Replica)          │
         └────────────────────────────────────────────┘
```

**Key optimizations at this phase:**
- Redis caching for: service packages, partner listings, user sessions
- Database indexes on: bookings (consumer_id, status, created_at), vehicles (user_id), payments (user_id, status)
- CDN for all static assets + user uploaded images
- Connection pooling: PgBouncer (transaction mode, pool_size=20)

---

## Phase 2: 10,000 → 100,000 Users (Growth)

**Triggers:** Booking volume > 5,000/day, API latency p99 > 500ms

**Changes:**
1. Separate read/write database connections (route analytics to read replica)
2. Introduce BullMQ (Redis-backed) for async jobs:
   - Email/SMS notifications
   - Subscription renewal processing
   - Invoice generation
   - AI price estimation
3. Add CDN caching for API responses (catalog, service packages, 5-min TTL)
4. Add ElasticSearch for marketplace search (autocomplete, fuzzy)
5. Add dedicated Socket.io cluster (socket.io-redis adapter)
6. Introduce Razorpay webhook retry queue

```
                         [API Gateway / ALB]
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
    [API Servers]       [Socket.io Servers]  [Worker Servers]
    (EC2 Auto ASG)       (EC2 ASG)            (BullMQ workers)
           │                   │                   │
           └───────────────────┼───────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Redis Cluster      │
                    │ (cache + queue +     │
                    │  socket adapter)     │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
          [PG Primary]   [PG Read Replica]  [PG Analytics]
          (writes)        (reads)           (reporting)
```

---

## Phase 3: 100,000 → 1,000,000 Users (Scale)

**Triggers:** 50k+ DAU, multi-city with >20 franchise partners, revenue > ₹1Cr/month

**Changes:**
1. **Microservices extraction** (highest priority first):
   - `booking-service` (most write-heavy)
   - `notification-service` (high volume, decoupled)
   - `payment-service` (PCI compliance isolation)
   - `marketplace-service` (separate traffic pattern)

2. **Event-driven architecture** with Apache Kafka:
   - Events: BookingCreated, PaymentCompleted, ServiceCompleted, UserRegistered
   - Services consume relevant events
   - Enables real-time analytics pipeline (Kafka → ClickHouse)

3. **Database sharding** for bookings table:
   - Shard by city_id (geographic locality)
   - Bookings schema: partition by created_at (monthly)

4. **Dedicated analytics database** (ClickHouse or Redshift):
   - Offload all reporting queries
   - Real-time KPI dashboard
   - Partner earnings reports

5. **Multi-region deployment**:
   - Primary: Mumbai (ap-south-1)
   - Secondary: Delhi/Bangalore if needed
   - Route53 latency-based routing

```
                    [CloudFront CDN]
                          │
              ┌───────────▼────────────┐
              │    API Gateway          │
              │   (Kong/AWS APIG)       │
              └─────────┬──────────────┘
                        │
    ┌───────────────────┼───────────────────────┐
    │                   │                       │
[Booking           [Notification           [Payment
 Service]           Service]                Service]
(ECS Fargate)      (ECS Fargate)           (ECS Fargate)
    │                   │                       │
    └───────────────────┼───────────────────────┘
                        │
              ┌─────────▼──────────┐
              │    Apache Kafka     │
              │  (Event Streaming)  │
              └─────────┬──────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
   [Postgres]    [ClickHouse]    [ElasticSearch]
   (per service)  (analytics)    (search)
```

---

## Caching Strategy

### Cache Layers

| Data | Cache Type | TTL | Invalidation |
|------|-----------|-----|--------------|
| Service packages | Redis hash | 1 hour | On admin update |
| User session | Redis string | JWT expiry | On logout |
| Partner listings by city | Redis sorted set | 5 min | On booking create |
| Booking status | Redis hash | 5 min | On status change |
| Marketplace listings | Redis hash | 15 min | On listing update |
| Dashboard KPIs | Redis hash | 5 min | Cron refresh |
| Coupon validity | Redis set | 1 min | On coupon use |
| Staff location | Redis geo | 30 sec | GPS update |
| OTP sessions | Redis | 10 min | On verify |

### Cache Keys Convention
```
autocareX:{entity}:{id}:{field}
autocareX:user:123:profile
autocareX:city:mumbai:partners
autocareX:package:456:details
autocareX:booking:789:status
```

---

## Database Optimization

### Critical Indexes
```sql
-- Booking queries (most frequent)
CREATE INDEX idx_bookings_consumer_status ON bookings(consumer_id, status, scheduled_at DESC);
CREATE INDEX idx_bookings_partner_date ON bookings(partner_id, scheduled_at);
CREATE INDEX idx_bookings_status_city ON bookings(status) WHERE status IN ('pending','assigned','in_progress');

-- Vehicle lookup
CREATE INDEX idx_vehicles_user ON vehicles(user_id) WHERE is_active = true;

-- Payment audit
CREATE INDEX idx_payments_user_date ON payments(user_id, created_at DESC);
CREATE INDEX idx_payments_razorpay ON payments(razorpay_order_id);

-- Marketplace search
CREATE INDEX idx_listings_city_status ON marketplace_listings(city, status, created_at DESC);
CREATE INDEX idx_listings_price ON marketplace_listings(asking_price) WHERE status = 'listed';

-- Full-text search on marketplace
CREATE INDEX idx_listings_fts ON marketplace_listings USING gin(to_tsvector('english', title || ' ' || description));

-- Notification delivery
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, sent_at DESC);

-- Partner performance
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id, reviewee_type, rating);
```

### Partitioning (Phase 2+)
```sql
-- Partition bookings by month
CREATE TABLE bookings (...)
PARTITION BY RANGE (created_at);

CREATE TABLE bookings_2025_01 PARTITION OF bookings
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
-- Auto-create monthly partitions via pg_partman
```

### Query Patterns
- **Always** use parameterized queries (no string interpolation)
- **Pagination** with cursor-based (not OFFSET) for large tables
- **Analytics queries** go to read replica
- **Transactions** kept short (< 100ms)
- **Batch inserts** for audit logs (buffer 100 records, flush every 5s)

---

## Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API latency p50 | < 100ms | > 200ms |
| API latency p95 | < 300ms | > 500ms |
| API latency p99 | < 800ms | > 1500ms |
| Booking creation | < 500ms | > 1s |
| Error rate | < 0.1% | > 1% |
| Cache hit rate | > 85% | < 70% |
| DB query time p95 | < 50ms | > 100ms |
| Push notification delivery | < 5s | > 30s |
| OTP delivery | < 10s | > 30s |
| App cold start (Flutter) | < 2s | > 4s |
| Image load time | < 1s | > 3s |

---

## Offline-First Architecture (Flutter)

### Hive Local Cache
```
Cached locally (always available offline):
- User profile + vehicles
- Last 20 bookings
- Service packages + pricing
- Active subscription details
- Wallet balance (may be stale)

Requires connectivity:
- Booking creation
- Payment
- Real-time tracking
- OTP login
- Marketplace listings (fresh)
```

### Sync Strategy
1. On app open: check connectivity
2. If offline: serve from Hive cache with "Offline - showing cached data" banner
3. Queue write operations (booking draft, profile edits) in pending queue
4. On reconnect: flush pending queue, refresh cache
5. Conflict resolution: server wins (last-write-wins with timestamp)

---

## Multi-Language Support

### Flutter Localization
```yaml
# pubspec.yaml
flutter_localizations:
  sdk: flutter
intl: ^0.19.0
```

### Supported Languages (Phase 1)
- English (en)
- Hindi (hi)
- Tamil (ta)
- Telugu (te)
- Kannada (kn)
- Marathi (mr)

### Implementation
- `.arb` files per language
- User preference stored in SharedPreferences
- Number formatting: Indian system (lakhs, crores)
- Currency: ₹ (INR) always
- Date format: DD/MM/YYYY (Indian standard)
- Right-to-left: Not required (no RTL languages in scope)

---

## Security Architecture

### Authentication Flow
```
1. User enters phone → POST /auth/send-otp
2. Server: generate 6-digit OTP, hash with bcrypt, store in Redis (10min TTL)
3. Twilio sends SMS
4. User enters OTP → POST /auth/verify-otp  
5. Server: compare hash, check expiry, check attempts (max 3)
6. If valid: issue access token (JWT, 15min) + refresh token (UUID, 7d stored in Redis)
7. Client stores: access token in memory, refresh token in secure storage
8. On 401: use refresh token → POST /auth/refresh → new token pair
9. On logout: delete refresh token from Redis
```

### API Security
- Helmet.js (X-Frame-Options, CSP, HSTS, etc.)
- CORS: whitelist mobile app origins
- Rate limiting: Redis-backed per IP + per user
- Input validation: Joi schemas on all endpoints
- SQL: parameterized queries only (no raw interpolation)
- File uploads: whitelist MIME types, max 10MB, scan for malware (ClamAV optional)
- Audit log: every state change recorded with user + IP + before/after

### PCI DSS (Razorpay)
- **Never** store card details (delegated to Razorpay)
- HTTPS only
- Webhook signature verification on every Razorpay webhook
- Payment amounts verified server-side (never trust client-sent amount)

---

*AutoCareX Engineering | v1.0 | 2026*
