# AutoCareX — System Architecture

## Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [Component Interactions](#component-interactions)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Microservices Boundaries](#microservices-boundaries)
5. [Caching Strategy](#caching-strategy)
6. [Database Replication](#database-replication)
7. [Scalability Approach](#scalability-approach)

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                    │
└───────────┬─────────────────────────────────────┬────────────────────────┘
            │                                     │
            ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐
│   Route 53 (DNS)       │             │   CloudFront (CDN)    │
│   api.autocareX.in    │             │   cdn.autocareX.in    │
│   admin.autocareX.in  │             │   (S3 static assets)  │
└───────────┬───────────┘             └───────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────────┐
│                 AWS Application Load Balancer                  │
│                     (HTTPS, WAF enabled)                       │
└───────────────────────────────────────────────────────────────┘
            │
     ┌──────┴──────┐
     ▼             ▼
┌─────────┐   ┌─────────┐
│  EC2 #1  │   │  EC2 #2  │   ◄── Auto Scaling Group (2-6 instances)
│  Nginx   │   │  Nginx   │
│  Backend │   │  Backend │
│  Admin   │   │  Admin   │
└─────────┘   └─────────┘
     │               │
     └───────┬───────┘
             │
    ┌────────┴──────────┐
    ▼                   ▼
┌──────────┐     ┌──────────────┐
│  RDS     │     │  ElastiCache │
│PostgreSQL│     │   Redis 7    │
│ Primary  │     │  Cluster     │
│          │     └──────────────┘
│ Read     │
│ Replica  │
└──────────┘
    │
    ▼
┌──────────────────────────────┐
│      AWS S3 (storage)         │
│   autocareX-uploads bucket   │
│   autocareX-backups bucket   │
└──────────────────────────────┘
```

---

## Component Interactions

```
Flutter Mobile App
       │
       │ HTTPS REST API + WebSocket (Socket.io)
       │
       ▼
   [Nginx]
       │
       ├── /api/v1/* ──────────────► [Node.js API Server]
       │                                     │
       │                            ┌────────┼────────┐
       │                            ▼        ▼        ▼
       │                         [Postgres] [Redis] [Bull Queue]
       │                            │                  │
       │                            ▼                  ▼
       │                      [Read Replica]      [Workers]
       │                                               │
       │                                    ┌──────────┼──────────┐
       │                                    ▼          ▼          ▼
       │                              [Firebase]  [Twilio]  [SendGrid]
       │                              (Push)      (SMS)     (Email)
       │
       └── /socket.io/* ──────────► [Socket.io Server]
                                          │
                                          └── Real-time events:
                                              • Booking status updates
                                              • Driver location tracking
                                              • Chat messages
                                              • Admin notifications
```

---

## Data Flow Diagrams

### Booking Creation Flow

```
User App                Backend                  Franchise App
   │                       │                          │
   │  POST /bookings        │                          │
   │──────────────────────►│                          │
   │                       │ 1. Validate user & vehicle│
   │                       │ 2. Check slot availability │
   │                       │ 3. Calculate pricing      │
   │                       │ 4. Create booking (DB)    │
   │                       │ 5. Initiate Razorpay order│
   │                       │                          │
   │  { booking_id, order } │                          │
   │◄──────────────────────│                          │
   │                       │                          │
   │  Complete payment      │                          │
   │──────────────────────►│                          │
   │                       │ 6. Verify payment         │
   │                       │ 7. Update booking status  │
   │                       │ 8. Emit socket event ────►│ NEW_BOOKING
   │                       │ 9. Send push notification │
   │                       │ 10. Add to job queue      │
   │  Booking confirmed     │                          │
   │◄──────────────────────│                          │
   │                       │                          │
```

### OTP Authentication Flow

```
App                     Backend                  Twilio
 │                          │                      │
 │  POST /auth/send-otp     │                      │
 │─────────────────────────►│                      │
 │                          │ Rate limit check      │
 │                          │ Generate OTP (6-digit)│
 │                          │ Store in Redis (5min) │
 │                          │──────────────────────►│ Send SMS
 │  { message: "OTP sent" } │                      │
 │◄─────────────────────────│                      │
 │                          │                      │
 │  POST /auth/verify-otp   │                      │
 │─────────────────────────►│                      │
 │                          │ Verify from Redis     │
 │                          │ Create/update user    │
 │                          │ Issue JWT + refresh   │
 │  { token, user }         │                      │
 │◄─────────────────────────│                      │
```

---

## Microservices Boundaries

Currently a modular monolith. Designed for future service extraction:

```
autocareX-api (monolith)
├── auth/           → Future: auth-service
├── users/          → Future: user-service
├── bookings/       → Future: booking-service
├── payments/       → Future: payment-service
├── notifications/  → Future: notification-service
├── marketplace/    → Future: marketplace-service
├── insurance/      → Future: insurance-service
└── franchise/      → Future: franchise-service

Shared libraries (would become shared packages):
├── lib/database    → DB connection & query helpers
├── lib/redis       → Redis client & helpers
├── lib/auth        → JWT validation middleware
└── lib/events      → Internal event bus (Redis pub/sub)
```

**Extraction trigger criteria:**
- Service handles >1000 req/s independently
- Team > 6 engineers working on that domain
- Distinct scaling requirements from other services

---

## Caching Strategy

```
Request ──► [Nginx]
               │
               ▼
           [Node.js]
               │
        ┌──────┴──────────────────┐
        │                         │
  Cache HIT?                   Cache MISS
        │                         │
        ▼                         ▼
  [Redis] ◄──────────────── [PostgreSQL]
  Return cached               Store in Redis
                              with TTL
```

### What is cached (Redis):

| Data | TTL | Key Pattern |
|------|-----|-------------|
| User session / JWT blocklist | 7 days | `session:{userId}` |
| OTP codes | 5 minutes | `otp:{phone}` |
| Service pricing catalog | 1 hour | `pricing:{city}:{service}` |
| Franchise list by city | 15 minutes | `franchises:{city}` |
| Dashboard stats (admin) | 5 minutes | `admin:stats:{date}` |
| Rate limit counters | 1 minute | `ratelimit:{ip}:{endpoint}` |
| User vehicle list | 10 minutes | `vehicles:{userId}` |
| Subscription status | 30 minutes | `subscription:{userId}` |
| Active booking count | 1 minute | `bookings:active:count` |

### Cache Invalidation:
- Write-through: Update DB then delete cache key
- Event-driven: Bull job invalidates related keys on booking state changes
- TTL-based expiry as safety net

---

## Database Replication

```
Application
    │
    ├── WRITE queries ─────────────► PostgreSQL Primary (RDS)
    │                                        │
    └── READ queries  ─────────────► PostgreSQL Read Replica
                                     (async replication, ~50ms lag)

Read replica used for:
• Analytics queries
• Report generation
• Admin dashboard stats
• Marketplace listing queries
• Booking history reads

Primary used for:
• All INSERT/UPDATE/DELETE
• Real-time booking status
• Payment processing
• Auth operations
```

**Replication lag monitoring:** CloudWatch metric `ReplicaLag` with alert at >2s

---

## Scalability Approach

### Horizontal Scaling

```
                    ALB (Auto Scaling)
                    /              \
            EC2 t3.medium    EC2 t3.medium
            (baseline: 2)    (scale: up to 6)

Scale-out trigger: CPU > 70% for 3 minutes
Scale-in  trigger: CPU < 30% for 10 minutes
```

### Database Scaling

| Scale Level | Approach |
|-------------|----------|
| 0-100k users | Single RDS db.t3.large |
| 100k-1M users | RDS db.r6g.xlarge + 1 read replica |
| 1M-10M users | RDS db.r6g.4xlarge + 2 read replicas + connection pooling (PgBouncer) |
| 10M+ users | Horizontal sharding by city/region |

### Queue-based Workload Distribution

```
API Server ──► Redis Bull Queue ──► Worker Pool
                                       │
                      ┌────────────────┼────────────────┐
                      ▼                ▼                 ▼
              [Push Notifications] [Email/SMS]    [Analytics Jobs]
              [Invoice Generation] [Image Proc.] [Report Generation]
```

### CDN for Static Assets

```
Flutter App ──► CloudFront ──► S3
(images, docs)   (edge cache)  (origin)

Cache-Control: public, max-age=31536000, immutable
```
