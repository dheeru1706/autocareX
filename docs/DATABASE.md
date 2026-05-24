# AutoCareX — Database Design

## ER Diagram (Text-Based)

```
USERS
├── id (PK, uuid)
├── phone (UNIQUE, NOT NULL)
├── name
├── email
├── city
├── profile_photo_url
├── wallet_balance (DECIMAL 10,2, DEFAULT 0)
├── fcm_token (Firebase push)
├── is_active (BOOLEAN)
├── created_at
└── updated_at

VEHICLES
├── id (PK, uuid)
├── user_id (FK → USERS)
├── registration_number (UNIQUE)
├── make
├── model
├── year (INTEGER)
├── fuel_type (ENUM: petrol, diesel, cng, electric, hybrid)
├── color
├── vin_number
├── insurance_expiry (DATE)
├── puc_expiry (DATE)
├── service_due_date (DATE)
├── created_at
└── updated_at

FRANCHISE_PARTNERS
├── id (PK, uuid)
├── business_name (NOT NULL)
├── owner_name (NOT NULL)
├── phone (UNIQUE)
├── email (UNIQUE)
├── city (NOT NULL)
├── territory
├── address (TEXT)
├── lat (DECIMAL 10,8)
├── lng (DECIMAL 11,8)
├── kyc_status (ENUM: pending, approved, rejected)
├── kyc_notes (TEXT)
├── kyc_approved_at (TIMESTAMP)
├── status (ENUM: active, suspended, inactive)
├── commission_rate (DECIMAL 5,2)
├── rating (DECIMAL 3,2, DEFAULT 0)
├── total_bookings (INTEGER, DEFAULT 0)
├── created_at
└── updated_at

FRANCHISE_STAFF
├── id (PK, uuid)
├── franchise_id (FK → FRANCHISE_PARTNERS)
├── name (NOT NULL)
├── phone
├── role (ENUM: technician, lead_technician, support)
├── is_active (BOOLEAN)
├── rating (DECIMAL 3,2)
└── created_at

KYC_DOCUMENTS
├── id (PK, uuid)
├── franchise_id (FK → FRANCHISE_PARTNERS)
├── document_type (ENUM: gst_cert, shop_license, aadhaar, bank_statement, police_clearance)
├── file_url (NOT NULL)
├── status (ENUM: pending, verified, rejected)
├── notes (TEXT)
├── uploaded_at (TIMESTAMP)
└── verified_at (TIMESTAMP)

SERVICES
├── id (PK, uuid)
├── name (NOT NULL)
├── category (ENUM: service_repair, tyre_wheel, detailing, electrical, inspection)
├── description (TEXT)
├── base_price (DECIMAL 10,2)
├── duration_minutes (INTEGER)
├── is_active (BOOLEAN)
└── created_at

SERVICE_PRICING
├── id (PK, uuid)
├── service_id (FK → SERVICES)
├── city (NOT NULL)
├── price (DECIMAL 10,2)
├── effective_from (DATE)
└── effective_to (DATE, NULLABLE)

BOOKINGS
├── id (PK, uuid, BK{year}{sequence})
├── user_id (FK → USERS)
├── vehicle_id (FK → VEHICLES)
├── franchise_id (FK → FRANCHISE_PARTNERS)
├── staff_id (FK → FRANCHISE_STAFF, NULLABLE)
├── service_id (FK → SERVICES)
├── status (ENUM: pending_payment, confirmed, assigned, en_route, in_progress, completed, cancelled)
├── scheduled_at (TIMESTAMP, NOT NULL)
├── started_at (TIMESTAMP)
├── completed_at (TIMESTAMP)
├── address_line1 (TEXT)
├── address_city (VARCHAR 100)
├── address_pincode (VARCHAR 10)
├── lat (DECIMAL 10,8)
├── lng (DECIMAL 11,8)
├── base_amount (DECIMAL 10,2)
├── discount_amount (DECIMAL 10,2, DEFAULT 0)
├── gst_amount (DECIMAL 10,2)
├── total_amount (DECIMAL 10,2)
├── coupon_code (VARCHAR 50, NULLABLE)
├── payment_status (ENUM: pending, paid, refunded, failed)
├── notes (TEXT)
├── cancellation_reason (TEXT)
├── rating (INTEGER 1-5, NULLABLE)
├── review_text (TEXT)
├── created_at
└── updated_at
[PARTITIONED BY RANGE on scheduled_at — monthly partitions]

PAYMENTS
├── id (PK, uuid)
├── booking_id (FK → BOOKINGS)
├── user_id (FK → USERS)
├── razorpay_order_id (UNIQUE)
├── razorpay_payment_id (UNIQUE, NULLABLE)
├── amount (DECIMAL 10,2)
├── currency (DEFAULT 'INR')
├── method (ENUM: upi, card, netbanking, wallet, emi, cash)
├── status (ENUM: created, authorized, captured, failed, refunded)
├── failure_reason (TEXT)
├── refund_id (VARCHAR 100)
├── refund_amount (DECIMAL 10,2)
├── created_at
└── updated_at
[PARTITIONED BY RANGE on created_at — monthly partitions]

SUBSCRIPTION_PLANS
├── id (PK, uuid)
├── name (UNIQUE, e.g. 'Basic', 'Pro', 'Elite')
├── price_monthly (DECIMAL 10,2)
├── price_yearly (DECIMAL 10,2)
├── vehicles_limit (INTEGER)
├── features (JSONB)
├── is_active (BOOLEAN)
└── created_at

USER_SUBSCRIPTIONS
├── id (PK, uuid)
├── user_id (FK → USERS)
├── plan_id (FK → SUBSCRIPTION_PLANS)
├── status (ENUM: active, paused, cancelled, expired)
├── billing_cycle (ENUM: monthly, yearly)
├── starts_at (TIMESTAMP)
├── renews_at (TIMESTAMP)
├── cancelled_at (TIMESTAMP)
├── cancel_at_period_end (BOOLEAN)
├── razorpay_subscription_id (VARCHAR)
└── created_at

SUBSCRIPTION_VEHICLES
├── id (PK, uuid)
├── subscription_id (FK → USER_SUBSCRIPTIONS)
└── vehicle_id (FK → VEHICLES)

MARKETPLACE_LISTINGS
├── id (PK, uuid)
├── seller_id (FK → USERS, NULLABLE)
├── dealer_id (FK → FRANCHISE_PARTNERS, NULLABLE)
├── title (NOT NULL)
├── make (NOT NULL)
├── model (NOT NULL)
├── year (INTEGER)
├── fuel_type (ENUM)
├── km_driven (INTEGER)
├── price (DECIMAL 12,2)
├── ai_estimated_price (DECIMAL 12,2)
├── inspection_score (INTEGER 0-100)
├── photos (TEXT[] — S3 URLs)
├── city (NOT NULL)
├── status (ENUM: draft, pending_review, approved, sold, rejected)
├── rejection_reason (TEXT)
├── features (JSONB)
├── created_at
└── updated_at

INSURANCE_POLICIES
├── id (PK, uuid)
├── user_id (FK → USERS)
├── vehicle_id (FK → VEHICLES)
├── provider (VARCHAR 100)
├── policy_number (UNIQUE)
├── type (ENUM: third_party, comprehensive)
├── idv (DECIMAL 12,2)
├── premium (DECIMAL 10,2)
├── start_date (DATE)
├── end_date (DATE)
├── status (ENUM: active, expired, cancelled)
└── created_at

COUPONS
├── id (PK, VARCHAR — the coupon code)
├── type (ENUM: percent, flat)
├── value (DECIMAL 10,2)
├── min_order_amount (DECIMAL 10,2, DEFAULT 0)
├── max_discount_amount (DECIMAL 10,2)
├── usage_count (INTEGER, DEFAULT 0)
├── usage_limit (INTEGER, 0 = unlimited)
├── applicable_to (VARCHAR 100, 'all' or service category)
├── target_audience (ENUM: all, basic, pro, elite, new_user)
├── valid_from (TIMESTAMP)
├── valid_until (TIMESTAMP)
├── is_active (BOOLEAN)
└── created_at

COUPON_USAGE
├── id (PK, uuid)
├── coupon_id (FK → COUPONS)
├── user_id (FK → USERS)
├── booking_id (FK → BOOKINGS)
├── discount_given (DECIMAL 10,2)
└── used_at (TIMESTAMP)

ADMIN_USERS
├── id (PK, uuid)
├── email (UNIQUE)
├── password_hash (NOT NULL)
├── name (NOT NULL)
├── role (ENUM: super_admin, operations_admin, marketing_admin, finance_admin)
├── is_active (BOOLEAN)
├── last_login_at (TIMESTAMP)
└── created_at

AUDIT_LOGS
├── id (PK, uuid)
├── admin_id (FK → ADMIN_USERS)
├── action (VARCHAR 255)
├── resource_type (VARCHAR 100)
├── resource_id (VARCHAR 100)
├── old_value (JSONB)
├── new_value (JSONB)
├── ip_address (INET)
└── created_at

NOTIFICATIONS
├── id (PK, uuid)
├── user_id (FK → USERS, NULLABLE — null = broadcast)
├── title (NOT NULL)
├── body (NOT NULL)
├── image_url
├── action_url
├── is_read (BOOLEAN, DEFAULT false)
├── sent_at (TIMESTAMP)
└── created_at
```

---

## Index Strategy

```sql
-- BOOKINGS (high-frequency queries)
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_franchise_id ON bookings(franchise_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX idx_bookings_city_status ON bookings(address_city, status);
-- Composite for dashboard queries
CREATE INDEX idx_bookings_franchise_date ON bookings(franchise_id, scheduled_at DESC);

-- USERS
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_city ON users(city);

-- VEHICLES
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_reg_number ON vehicles(registration_number);

-- MARKETPLACE_LISTINGS
CREATE INDEX idx_listings_city_status ON marketplace_listings(city, status);
CREATE INDEX idx_listings_make_model ON marketplace_listings(make, model);
CREATE INDEX idx_listings_price ON marketplace_listings(price);

-- PAYMENTS
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_razorpay_order ON payments(razorpay_order_id);
CREATE INDEX idx_payments_status ON payments(status);

-- SUBSCRIPTION LOOKUP
CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id, status);
```

---

## Partitioning Strategy

### Bookings Table (Range partitioning by month)
```sql
CREATE TABLE bookings (
  ...
  scheduled_at TIMESTAMP NOT NULL
) PARTITION BY RANGE (scheduled_at);

CREATE TABLE bookings_2024_01 PARTITION OF bookings
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE bookings_2024_02 PARTITION OF bookings
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- New partitions created automatically via cron job
```

**Rationale:** Bookings grow at ~50k/month. Partitioning keeps each partition <2GB for fast queries.

### Payments Table (Same range partitioning)

Old partitions (>12 months) are archived to cold storage (S3 via pg_dump) and dropped.

---

## Read Replica Setup

```
                 Application
                      │
            ┌─────────┴──────────┐
            │ Prisma connection  │
            │   routing:         │
            │                    │
            │  WRITE ──────────► Primary (RDS)
            │                    │
            │  READ  ──────────► Replica (RDS Read Replica)
            └────────────────────┘

# Prisma config (schema.prisma)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")          # Primary — writes
  directUrl = env("DATABASE_READ_URL")   # Replica — reads
}
```

**Replica lag monitoring:** CloudWatch `ReplicaLag` metric, alert threshold: 2 seconds.

**Failover:** In case of primary failure, RDS automatically promotes replica (Multi-AZ enabled).

---

## Table Sizes & Estimates

| Table | Rows (Year 1) | Estimated Size |
|-------|-------------|---------------|
| users | 500k | ~200 MB |
| vehicles | 800k | ~320 MB |
| bookings | 2.5M | ~2.5 GB |
| payments | 2.5M | ~1.5 GB |
| marketplace_listings | 50k | ~100 MB |
| audit_logs | 5M | ~3 GB |
| notifications | 10M | ~2 GB |
