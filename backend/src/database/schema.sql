-- AutoCareX PostgreSQL Schema
-- Run: psql -U postgres -d autocarex -f schema.sql

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- PostGIS is required in production (use postgis/postgis:15-alpine image)
-- CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE user_role AS ENUM ('consumer', 'partner', 'admin', 'staff', 'fleet_manager');
CREATE TYPE kyc_status_type AS ENUM ('not_submitted', 'pending', 'under_review', 'approved', 'rejected');
CREATE TYPE fuel_type AS ENUM ('petrol', 'diesel', 'cng', 'electric', 'hybrid');
CREATE TYPE vehicle_type AS ENUM ('hatchback', 'sedan', 'suv', 'luxury', 'commercial');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled', 'refunded');
CREATE TYPE plan_type AS ENUM ('basic', 'premium', 'fleet');
CREATE TYPE plan_interval AS ENUM ('monthly', 'quarterly', 'yearly');
CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired');
CREATE TYPE payment_method AS ENUM ('razorpay', 'wallet', 'cash', 'upi');
CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'refunded');
CREATE TYPE wallet_transaction_type AS ENUM ('credit', 'debit');
CREATE TYPE franchise_kyc_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');
CREATE TYPE staff_role AS ENUM ('technician', 'supervisor', 'driver');
CREATE TYPE listing_condition AS ENUM ('excellent', 'good', 'fair', 'poor');
CREATE TYPE listing_status AS ENUM ('draft', 'listed', 'under_review', 'sold', 'removed');
CREATE TYPE inquiry_status AS ENUM ('open', 'responded', 'closed');
CREATE TYPE insurance_type AS ENUM ('third_party', 'comprehensive', 'zero_dep');
CREATE TYPE insurance_status AS ENUM ('active', 'expired', 'claimed');
CREATE TYPE coupon_type AS ENUM ('percent', 'flat', 'free_service');
CREATE TYPE user_restriction AS ENUM ('all', 'new', 'premium');
CREATE TYPE referral_status AS ENUM ('pending', 'rewarded');
CREATE TYPE reviewee_type AS ENUM ('partner', 'consumer', 'staff');
CREATE TYPE message_type AS ENUM ('text', 'image', 'location');

-- =============================================
-- USERS
-- =============================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone           VARCHAR(15) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE,
    name            VARCHAR(255),
    avatar_url      TEXT,
    role            user_role NOT NULL DEFAULT 'consumer',
    kyc_status      kyc_status_type NOT NULL DEFAULT 'not_submitted',
    wallet_balance  NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    referral_code   VARCHAR(12) UNIQUE NOT NULL,
    referred_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    fcm_token       TEXT,
    language        VARCHAR(10) NOT NULL DEFAULT 'en',
    password_hash   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_role ON users(role);

-- =============================================
-- USER ADDRESSES
-- =============================================

CREATE TABLE user_addresses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label           VARCHAR(50) NOT NULL DEFAULT 'Home',
    address_line1   VARCHAR(255) NOT NULL,
    address_line2   VARCHAR(255),
    city            VARCHAR(100) NOT NULL,
    state           VARCHAR(100) NOT NULL,
    pincode         VARCHAR(10) NOT NULL,
    lat             NUMERIC(10, 7),
    lng             NUMERIC(10, 7),
    is_default      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON user_addresses(user_id);
CREATE INDEX idx_addresses_pincode ON user_addresses(pincode);

-- =============================================
-- VEHICLES
-- =============================================

CREATE TABLE vehicles (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    make                    VARCHAR(100) NOT NULL,
    model                   VARCHAR(100) NOT NULL,
    year                    SMALLINT NOT NULL,
    registration_number     VARCHAR(20) UNIQUE NOT NULL,
    fuel_type               fuel_type NOT NULL,
    color                   VARCHAR(50),
    vehicle_type            vehicle_type NOT NULL,
    insurance_expiry        DATE,
    puc_expiry              DATE,
    images                  TEXT[] NOT NULL DEFAULT '{}',
    last_service_date       DATE,
    mileage                 INTEGER,
    vin                     VARCHAR(50),
    is_active               BOOLEAN NOT NULL DEFAULT true,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_registration ON vehicles(registration_number);

-- =============================================
-- SERVICE CATEGORIES
-- =============================================

CREATE TABLE service_categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) UNIQUE NOT NULL,
    icon_url    TEXT,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    sort_order  SMALLINT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_categories_slug ON service_categories(slug);
CREATE INDEX idx_service_categories_sort ON service_categories(sort_order) WHERE is_active = true;

-- =============================================
-- SERVICE PACKAGES
-- =============================================

CREATE TABLE service_packages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id     UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    duration_mins   SMALLINT NOT NULL,
    base_price      NUMERIC(10, 2) NOT NULL,
    discounted_price NUMERIC(10, 2),
    includes        TEXT[] NOT NULL DEFAULT '{}',
    excludes        TEXT[] NOT NULL DEFAULT '{}',
    images          TEXT[] NOT NULL DEFAULT '{}',
    is_popular      BOOLEAN NOT NULL DEFAULT false,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    vehicle_types   vehicle_type[] NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_packages_category_id ON service_packages(category_id);
CREATE INDEX idx_packages_is_active ON service_packages(is_active);

-- =============================================
-- FRANCHISE PARTNERS
-- =============================================

CREATE TABLE franchise_partners (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name       VARCHAR(255) NOT NULL,
    gst_number          VARCHAR(20),
    pan_number          VARCHAR(15),
    logo_url            TEXT,
    city                VARCHAR(100) NOT NULL,
    state               VARCHAR(100) NOT NULL,
    territory_polygon   JSONB,
    kyc_status          franchise_kyc_status NOT NULL DEFAULT 'pending',
    approval_notes      TEXT,
    commission_rate     NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    bank_account        VARCHAR(20),
    ifsc                VARCHAR(15),
    joined_at           TIMESTAMPTZ,
    is_active           BOOLEAN NOT NULL DEFAULT false,
    rating              NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
    total_earnings      NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_partners_user_id ON franchise_partners(user_id);
CREATE INDEX idx_partners_city ON franchise_partners(city);
CREATE INDEX idx_partners_kyc_status ON franchise_partners(kyc_status);

-- =============================================
-- STAFF
-- =============================================

CREATE TABLE staff (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id      UUID NOT NULL REFERENCES franchise_partners(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    name            VARCHAR(255) NOT NULL,
    phone           VARCHAR(15) NOT NULL,
    role            staff_role NOT NULL DEFAULT 'technician',
    skills          TEXT[] NOT NULL DEFAULT '{}',
    current_lat     NUMERIC(10, 7),
    current_lng     NUMERIC(10, 7),
    is_available    BOOLEAN NOT NULL DEFAULT false,
    rating          NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
    jobs_completed  INTEGER NOT NULL DEFAULT 0,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active       BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_staff_partner_id ON staff(partner_id);
CREATE INDEX idx_staff_available ON staff(is_available, is_active);

-- =============================================
-- ZONES
-- =============================================

CREATE TABLE zones (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city        VARCHAR(100) NOT NULL,
    state       VARCHAR(100) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    polygon     JSONB NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    partner_id  UUID REFERENCES franchise_partners(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zones_city ON zones(city);
CREATE INDEX idx_zones_partner_id ON zones(partner_id);

-- =============================================
-- BOOKINGS
-- =============================================

CREATE TABLE bookings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number      VARCHAR(20) UNIQUE NOT NULL,
    consumer_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    partner_id          UUID REFERENCES franchise_partners(id) ON DELETE SET NULL,
    vehicle_id          UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    address_id          UUID REFERENCES user_addresses(id) ON DELETE SET NULL,
    service_package_id  UUID NOT NULL REFERENCES service_packages(id) ON DELETE RESTRICT,
    scheduled_at        TIMESTAMPTZ NOT NULL,
    status              booking_status NOT NULL DEFAULT 'pending',
    otp                 VARCHAR(10),
    staff_id            UUID REFERENCES staff(id) ON DELETE SET NULL,
    slot_start          TIMESTAMPTZ,
    slot_end            TIMESTAMPTZ,
    notes               TEXT,
    cancellation_reason TEXT,
    rating              SMALLINT CHECK (rating BETWEEN 1 AND 5),
    review              TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_consumer_id ON bookings(consumer_id);
CREATE INDEX idx_bookings_partner_id ON bookings(partner_id);
CREATE INDEX idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX idx_bookings_booking_number ON bookings(booking_number);

-- =============================================
-- BOOKING TIMELINE
-- =============================================

CREATE TABLE booking_timeline (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    status      booking_status NOT NULL,
    note        TEXT,
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    lat         NUMERIC(10, 7),
    lng         NUMERIC(10, 7),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_timeline_booking_id ON booking_timeline(booking_id);

-- =============================================
-- SUBSCRIPTION PLANS
-- =============================================

CREATE TABLE subscription_plans (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(200) NOT NULL,
    description         TEXT,
    plan_type           plan_type NOT NULL,
    interval            plan_interval NOT NULL,
    price               NUMERIC(10, 2) NOT NULL,
    services_per_month  SMALLINT NOT NULL,
    includes            TEXT[] NOT NULL DEFAULT '{}',
    vehicle_types       vehicle_type[] NOT NULL DEFAULT '{}',
    is_active           BOOLEAN NOT NULL DEFAULT true,
    razorpay_plan_id    VARCHAR(100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plans_type ON subscription_plans(plan_type);
CREATE INDEX idx_plans_is_active ON subscription_plans(is_active);

-- =============================================
-- SUBSCRIPTIONS
-- =============================================

CREATE TABLE subscriptions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id                 UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    vehicle_id              UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    status                  subscription_status NOT NULL DEFAULT 'active',
    start_date              DATE NOT NULL,
    end_date                DATE NOT NULL,
    next_billing_date       DATE,
    razorpay_subscription_id VARCHAR(100),
    services_used           SMALLINT NOT NULL DEFAULT 0,
    services_remaining      SMALLINT NOT NULL DEFAULT 0,
    auto_renew              BOOLEAN NOT NULL DEFAULT true,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date) WHERE status = 'active';

-- =============================================
-- PAYMENTS
-- =============================================

CREATE TABLE payments (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id              UUID REFERENCES bookings(id) ON DELETE SET NULL,
    subscription_id         UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount                  NUMERIC(12, 2) NOT NULL,
    gst_amount              NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount         NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    final_amount            NUMERIC(12, 2) NOT NULL,
    method                  payment_method,
    status                  payment_status NOT NULL DEFAULT 'pending',
    razorpay_order_id       VARCHAR(100),
    razorpay_payment_id     VARCHAR(100),
    razorpay_signature      TEXT,
    metadata                JSONB NOT NULL DEFAULT '{}',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_razorpay_order ON payments(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;

-- =============================================
-- WALLET TRANSACTIONS
-- =============================================

CREATE TABLE wallet_transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            wallet_transaction_type NOT NULL,
    amount          NUMERIC(12, 2) NOT NULL,
    balance_after   NUMERIC(12, 2) NOT NULL,
    reference_type  VARCHAR(50),
    reference_id    UUID,
    description     TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallet_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_created_at ON wallet_transactions(created_at DESC);

-- =============================================
-- MARKETPLACE LISTINGS
-- =============================================

CREATE TABLE marketplace_listings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id          UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    title               VARCHAR(300) NOT NULL,
    description         TEXT,
    asking_price        NUMERIC(12, 2) NOT NULL,
    ai_estimated_price  NUMERIC(12, 2),
    year                SMALLINT NOT NULL,
    mileage             INTEGER,
    condition           listing_condition NOT NULL,
    inspection_score    NUMERIC(5, 2),
    images              TEXT[] NOT NULL DEFAULT '{}',
    status              listing_status NOT NULL DEFAULT 'draft',
    views               INTEGER NOT NULL DEFAULT 0,
    inquiries           INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listings_seller_id ON marketplace_listings(seller_id);
CREATE INDEX idx_listings_status ON marketplace_listings(status);
CREATE INDEX idx_listings_asking_price ON marketplace_listings(asking_price);

-- =============================================
-- MARKETPLACE INQUIRIES
-- =============================================

CREATE TABLE marketplace_inquiries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id      UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    buyer_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message         TEXT NOT NULL,
    contact_phone   VARCHAR(15),
    status          inquiry_status NOT NULL DEFAULT 'open',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inquiries_listing_id ON marketplace_inquiries(listing_id);
CREATE INDEX idx_inquiries_buyer_id ON marketplace_inquiries(buyer_id);

-- =============================================
-- INSURANCE POLICIES
-- =============================================

CREATE TABLE insurance_policies (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id          UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    provider_name       VARCHAR(200) NOT NULL,
    policy_number       VARCHAR(100) NOT NULL,
    type                insurance_type NOT NULL,
    premium             NUMERIC(12, 2) NOT NULL,
    sum_insured         NUMERIC(14, 2) NOT NULL,
    expiry_date         DATE NOT NULL,
    document_url        TEXT,
    status              insurance_status NOT NULL DEFAULT 'active',
    reminder_sent_at    TIMESTAMPTZ,
    commission_earned   NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_insurance_user_id ON insurance_policies(user_id);
CREATE INDEX idx_insurance_vehicle_id ON insurance_policies(vehicle_id);
CREATE INDEX idx_insurance_expiry ON insurance_policies(expiry_date) WHERE status = 'active';

-- =============================================
-- COUPONS
-- =============================================

CREATE TABLE coupons (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(50) UNIQUE NOT NULL,
    name                VARCHAR(200) NOT NULL,
    type                coupon_type NOT NULL,
    value               NUMERIC(10, 2) NOT NULL,
    min_order_value     NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    max_discount        NUMERIC(10, 2),
    usage_limit         INTEGER,
    used_count          INTEGER NOT NULL DEFAULT 0,
    valid_from          TIMESTAMPTZ NOT NULL,
    valid_until         TIMESTAMPTZ NOT NULL,
    applicable_services UUID[] NOT NULL DEFAULT '{}',
    user_restriction    user_restriction NOT NULL DEFAULT 'all',
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_valid ON coupons(valid_from, valid_until) WHERE is_active = true;

-- =============================================
-- COUPON USAGES
-- =============================================

CREATE TABLE coupon_usages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id       UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id      UUID REFERENCES bookings(id) ON DELETE SET NULL,
    discount_applied NUMERIC(10, 2) NOT NULL,
    used_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(coupon_id, user_id, booking_id)
);

CREATE INDEX idx_coupon_usages_user_id ON coupon_usages(user_id);
CREATE INDEX idx_coupon_usages_coupon_id ON coupon_usages(coupon_id);

-- =============================================
-- REFERRALS
-- =============================================

CREATE TABLE referrals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referee_id      UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    referrer_reward NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    referee_reward  NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status          referral_status NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_status ON referrals(status);

-- =============================================
-- NOTIFICATIONS
-- =============================================

CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    body        TEXT NOT NULL,
    type        VARCHAR(50) NOT NULL DEFAULT 'general',
    data        JSONB NOT NULL DEFAULT '{}',
    is_read     BOOLEAN NOT NULL DEFAULT false,
    sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at     TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read) WHERE is_read = false;

-- =============================================
-- REVIEWS
-- =============================================

CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    reviewer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id     UUID NOT NULL,
    reviewee_type   reviewee_type NOT NULL,
    rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    images          TEXT[] NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(booking_id, reviewer_id, reviewee_type)
);

CREATE INDEX idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id, reviewee_type);

-- =============================================
-- AUDIT LOGS
-- =============================================

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(100) NOT NULL,
    entity_id       UUID,
    old_data        JSONB,
    new_data        JSONB,
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);

-- =============================================
-- FLEET ACCOUNTS
-- =============================================

CREATE TABLE fleet_accounts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name    VARCHAR(255) NOT NULL,
    contact_person  VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    phone           VARCHAR(15) NOT NULL,
    gst_number      VARCHAR(20),
    credit_limit    NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    payment_terms   SMALLINT NOT NULL DEFAULT 30,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fleet_email ON fleet_accounts(email);

-- =============================================
-- FLEET VEHICLES
-- =============================================

CREATE TABLE fleet_vehicles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fleet_id        UUID NOT NULL REFERENCES fleet_accounts(id) ON DELETE CASCADE,
    vehicle_id      UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_name     VARCHAR(255),
    driver_phone    VARCHAR(15),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(fleet_id, vehicle_id)
);

CREATE INDEX idx_fleet_vehicles_fleet_id ON fleet_vehicles(fleet_id);
CREATE INDEX idx_fleet_vehicles_vehicle_id ON fleet_vehicles(vehicle_id);

-- =============================================
-- CHAT CONVERSATIONS
-- =============================================

CREATE TABLE chat_conversations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id      UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    consumer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_id      UUID NOT NULL REFERENCES franchise_partners(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_booking_id ON chat_conversations(booking_id);
CREATE INDEX idx_conversations_consumer_id ON chat_conversations(consumer_id);

-- =============================================
-- CHAT MESSAGES
-- =============================================

CREATE TABLE chat_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message         TEXT,
    message_type    message_type NOT NULL DEFAULT 'text',
    is_read         BOOLEAN NOT NULL DEFAULT false,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_messages_sent_at ON chat_messages(conversation_id, sent_at DESC);

-- =============================================
-- OTP SESSIONS
-- =============================================

CREATE TABLE otp_sessions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone       VARCHAR(15) NOT NULL,
    otp_hash    VARCHAR(255) NOT NULL,
    attempts    SMALLINT NOT NULL DEFAULT 0,
    expires_at  TIMESTAMPTZ NOT NULL,
    is_used     BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_phone ON otp_sessions(phone);
CREATE INDEX idx_otp_expires_at ON otp_sessions(expires_at);

-- =============================================
-- TRIGGERS — updated_at auto-update
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_partners_updated_at BEFORE UPDATE ON franchise_partners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_packages_updated_at BEFORE UPDATE ON service_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_insurance_updated_at BEFORE UPDATE ON insurance_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_listings_updated_at BEFORE UPDATE ON marketplace_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- SEED DATA — Service Categories
-- =============================================

INSERT INTO service_categories (name, slug, description, sort_order) VALUES
('Car Wash', 'car-wash', 'Professional interior and exterior car cleaning', 1),
('Oil Change', 'oil-change', 'Engine oil and filter replacement service', 2),
('Tyre Services', 'tyre-services', 'Tyre rotation, balancing, and alignment', 3),
('Battery Services', 'battery-services', 'Battery check, replacement, and jump start', 4),
('AC Services', 'ac-services', 'Air conditioning service and repair', 5),
('Brake Services', 'brake-services', 'Brake pad replacement and brake fluid flush', 6),
('General Service', 'general-service', 'Comprehensive vehicle service package', 7),
('Denting & Painting', 'denting-painting', 'Body repair and paint restoration', 8),
('Roadside Assistance', 'roadside-assistance', '24/7 emergency roadside help', 9),
('Inspection', 'inspection', 'Pre-purchase vehicle inspection', 10);
