# AutoCareX Entity Relationship Diagram

## Core ER Diagram (Text)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AUTOCAREХ DATABASE ER DIAGRAM                         │
└─────────────────────────────────────────────────────────────────────────────┘

╔══════════════╗     ╔═══════════════════╗     ╔══════════════════╗
║    USERS     ║     ║  USER_ADDRESSES   ║     ║    VEHICLES      ║
╠══════════════╣     ╠═══════════════════╣     ╠══════════════════╣
║ id (PK)      ║──┐  ║ id (PK)           ║  ┌──║ id (PK)          ║
║ phone        ║  ├──║ user_id (FK)      ║  │  ║ user_id (FK)     ║──→ USERS
║ email        ║  │  ║ label             ║  │  ║ make             ║
║ name         ║  │  ║ address_line1     ║  │  ║ model            ║
║ avatar_url   ║  │  ║ city              ║  │  ║ year             ║
║ role (ENUM)  ║  │  ║ state             ║  │  ║ registration_no  ║
║ kyc_status   ║  │  ║ pincode           ║  │  ║ fuel_type (ENUM) ║
║ wallet_bal   ║  │  ║ lat               ║  │  ║ vehicle_type     ║
║ referral_code║  │  ║ lng               ║  │  ║ insurance_expiry ║
║ referred_by  ║──┘  ║ is_default        ║  │  ║ images[]         ║
║ fcm_token    ║     ╚═══════════════════╝  │  ╚══════════════════╝
║ is_active    ║                            │
║ created_at   ║──┐                         │
╚══════════════╝  │                         │
                  │                         │
    ┌─────────────┼─────────────────────────┘
    │             │
    ▼             ▼
╔══════════════════════╗          ╔═══════════════════════╗
║     BOOKINGS         ║          ║   BOOKING_TIMELINE    ║
╠══════════════════════╣          ╠═══════════════════════╣
║ id (PK)              ║──────────║ id (PK)               ║
║ booking_number       ║          ║ booking_id (FK)       ║
║ consumer_id (FK)─────║──→USERS  ║ status                ║
║ partner_id (FK)──────║──→FP     ║ note                  ║
║ vehicle_id (FK)──────║──→VEH    ║ created_by (FK)──→USR ║
║ address_id (FK)──────║──→ADDR   ║ lat                   ║
║ service_pkg_id (FK)  ║──→PKG    ║ lng                   ║
║ scheduled_at         ║          ║ created_at            ║
║ status (ENUM)        ║          ╚═══════════════════════╝
║ otp                  ║
║ staff_id (FK)────────║──→STAFF
║ slot_start           ║
║ slot_end             ║
║ cancellation_reason  ║
║ rating               ║
║ review               ║
║ created_at           ║
╚══════════════════════╝
         │
         │
    ┌────▼──────────────────────────────────────────┐
    │                                               │
    ▼                                               ▼
╔══════════════════╗                    ╔═══════════════════╗
║    PAYMENTS      ║                    ║     REVIEWS       ║
╠══════════════════╣                    ╠═══════════════════╣
║ id (PK)          ║                    ║ id (PK)           ║
║ booking_id (FK)  ║                    ║ booking_id (FK)   ║
║ subscription_id  ║                    ║ reviewer_id (FK)  ║
║ user_id (FK)     ║                    ║ reviewee_id (FK)  ║
║ amount           ║                    ║ reviewee_type     ║
║ gst_amount       ║                    ║ rating (1-5)      ║
║ discount_amount  ║                    ║ comment           ║
║ final_amount     ║                    ║ images[]          ║
║ method (ENUM)    ║                    ║ created_at        ║
║ status (ENUM)    ║                    ╚═══════════════════╝
║ razorpay_order_id║
║ razorpay_pmt_id  ║
║ razorpay_sig     ║
║ created_at       ║
╚══════════════════╝


╔════════════════════════╗     ╔═══════════════════════╗
║  SERVICE_CATEGORIES    ║     ║   SERVICE_PACKAGES    ║
╠════════════════════════╣     ╠═══════════════════════╣
║ id (PK)                ║──┐  ║ id (PK)               ║
║ name                   ║  └──║ category_id (FK)      ║
║ slug                   ║     ║ name                  ║
║ icon_url               ║     ║ description           ║
║ description            ║     ║ duration_mins         ║
║ is_active              ║     ║ base_price            ║
║ sort_order             ║     ║ discounted_price      ║
╚════════════════════════╝     ║ includes[]            ║
                               ║ excludes[]            ║
                               ║ images[]              ║
                               ║ is_popular            ║
                               ║ is_active             ║
                               ║ vehicle_types[]       ║
                               ╚═══════════════════════╝


╔══════════════════════╗     ╔═══════════════════════╗
║  SUBSCRIPTION_PLANS  ║     ║    SUBSCRIPTIONS      ║
╠══════════════════════╣     ╠═══════════════════════╣
║ id (PK)              ║──┐  ║ id (PK)               ║
║ name                 ║  └──║ plan_id (FK)          ║
║ description          ║     ║ user_id (FK)──→USERS  ║
║ plan_type (ENUM)     ║     ║ vehicle_id (FK)       ║
║ interval (ENUM)      ║     ║ status (ENUM)         ║
║ price                ║     ║ start_date            ║
║ services_per_month   ║     ║ end_date              ║
║ includes[]           ║     ║ next_billing_date     ║
║ vehicle_types[]      ║     ║ razorpay_sub_id       ║
║ is_active            ║     ║ services_used         ║
║ razorpay_plan_id     ║     ║ services_remaining    ║
╚══════════════════════╝     ║ auto_renew            ║
                             ╚═══════════════════════╝


╔═══════════════════════╗     ╔═══════════════════════╗
║  FRANCHISE_PARTNERS   ║     ║       STAFF           ║
╠═══════════════════════╣     ╠═══════════════════════╣
║ id (PK)               ║──┐  ║ id (PK)               ║
║ user_id (FK)──→USERS  ║  └──║ partner_id (FK)       ║
║ business_name         ║     ║ user_id (FK)──→USERS  ║
║ gst_number            ║     ║ name                  ║
║ pan_number            ║     ║ phone                 ║
║ logo_url              ║     ║ role (ENUM)           ║
║ city                  ║     ║ skills[]              ║
║ state                 ║     ║ current_lat           ║
║ territory_polygon     ║     ║ current_lng           ║
║ kyc_status (ENUM)     ║     ║ is_available          ║
║ commission_rate       ║     ║ rating                ║
║ bank_account          ║     ║ jobs_completed        ║
║ ifsc                  ║     ║ is_active             ║
║ joined_at             ║     ╚═══════════════════════╝
║ is_active             ║
║ rating                ║
║ total_earnings        ║
╚═══════════════════════╝


╔══════════════════════╗     ╔═══════════════════════════╗
║  MARKETPLACE_LISTINGS║     ║  MARKETPLACE_INQUIRIES    ║
╠══════════════════════╣     ╠═══════════════════════════╣
║ id (PK)              ║──┐  ║ id (PK)                   ║
║ seller_id (FK)───────║  └──║ listing_id (FK)           ║
║ vehicle_id (FK)      ║     ║ buyer_id (FK)──→USERS     ║
║ title                ║     ║ message                   ║
║ description          ║     ║ contact_phone             ║
║ asking_price         ║     ║ status (ENUM)             ║
║ ai_estimated_price   ║     ║ created_at                ║
║ year                 ║     ╚═══════════════════════════╝
║ mileage              ║
║ condition (ENUM)     ║
║ inspection_score     ║
║ images[]             ║
║ status (ENUM)        ║
║ views                ║
║ inquiries            ║
║ created_at           ║
╚══════════════════════╝


╔══════════════════════╗     ╔═══════════════════════╗
║  INSURANCE_POLICIES  ║     ║      COUPONS          ║
╠══════════════════════╣     ╠═══════════════════════╣
║ id (PK)              ║     ║ id (PK)               ║
║ user_id (FK)─────────║     ║ code (UNIQUE)         ║
║ vehicle_id (FK)      ║     ║ name                  ║
║ provider_name        ║     ║ type (ENUM)           ║
║ policy_number        ║     ║ value                 ║
║ type (ENUM)          ║     ║ min_order_value       ║
║ premium              ║     ║ max_discount          ║
║ sum_insured          ║     ║ usage_limit           ║
║ expiry_date          ║     ║ used_count            ║
║ document_url         ║     ║ valid_from            ║
║ status (ENUM)        ║     ║ valid_until           ║
║ reminder_sent_at     ║     ║ applicable_services[] ║
║ commission_earned    ║     ║ user_restriction      ║
╚══════════════════════╝     ║ is_active             ║
                             ╚═══════════════════════╝
                                       │
                                       │
                             ╔═════════▼═══════════╗
                             ║   COUPON_USAGES      ║
                             ╠═══════════════════════╣
                             ║ id (PK)               ║
                             ║ coupon_id (FK)        ║
                             ║ user_id (FK)─→USERS   ║
                             ║ booking_id (FK)       ║
                             ║ discount_applied      ║
                             ║ used_at               ║
                             ╚═══════════════════════╝


╔══════════════════════╗     ╔═══════════════════════╗
║  WALLET_TRANSACTIONS ║     ║    NOTIFICATIONS      ║
╠══════════════════════╣     ╠═══════════════════════╣
║ id (PK)              ║     ║ id (PK)               ║
║ user_id (FK)─────────║     ║ user_id (FK)──→USERS  ║
║ type (credit/debit)  ║     ║ title                 ║
║ amount               ║     ║ body                  ║
║ balance_after        ║     ║ type                  ║
║ reference_type       ║     ║ data (JSONB)           ║
║ reference_id         ║     ║ is_read               ║
║ description          ║     ║ sent_at               ║
║ created_at           ║     ║ read_at               ║
╚══════════════════════╝     ╚═══════════════════════╝


╔══════════════════════╗     ╔═══════════════════════╗
║   FLEET_ACCOUNTS     ║     ║   FLEET_VEHICLES      ║
╠══════════════════════╣     ╠═══════════════════════╣
║ id (PK)              ║──┐  ║ id (PK)               ║
║ company_name         ║  └──║ fleet_id (FK)         ║
║ contact_person       ║     ║ vehicle_id (FK)       ║
║ email                ║     ║ driver_name           ║
║ phone                ║     ║ driver_phone          ║
║ gst_number           ║     ║ is_active             ║
║ credit_limit         ║     ╚═══════════════════════╝
║ payment_terms        ║
║ is_active            ║
╚══════════════════════╝


╔════════════════════════╗    ╔══════════════════════╗
║  CHAT_CONVERSATIONS    ║    ║    CHAT_MESSAGES     ║
╠════════════════════════╣    ╠══════════════════════╣
║ id (PK)                ║─┐  ║ id (PK)              ║
║ booking_id (FK)        ║ └──║ conversation_id (FK) ║
║ consumer_id (FK)─→USR  ║    ║ sender_id (FK)──→USR ║
║ partner_id (FK)──→USR  ║    ║ message              ║
║ created_at             ║    ║ message_type (ENUM)  ║
╚════════════════════════╝    ║ is_read              ║
                              ║ sent_at              ║
                              ╚══════════════════════╝


╔══════════════════════╗     ╔═══════════════════════╗
║    OTP_SESSIONS      ║     ║     AUDIT_LOGS        ║
╠══════════════════════╣     ╠═══════════════════════╣
║ id (PK)              ║     ║ id (PK)               ║
║ phone                ║     ║ user_id (FK)──→USERS  ║
║ otp_hash             ║     ║ action                ║
║ attempts             ║     ║ entity_type           ║
║ expires_at           ║     ║ entity_id             ║
║ is_used              ║     ║ old_data (JSONB)       ║
║ created_at           ║     ║ new_data (JSONB)       ║
╚══════════════════════╝     ║ ip_address            ║
                             ║ created_at            ║
                             ╚═══════════════════════╝


╔══════════════════════╗
║      REFERRALS       ║
╠══════════════════════╣
║ id (PK)              ║
║ referrer_id (FK)─────║──→ USERS
║ referee_id (FK)──────║──→ USERS
║ referrer_reward      ║
║ referee_reward       ║
║ status (ENUM)        ║
║ created_at           ║
╚══════════════════════╝
```

---

## Relationship Summary

| Table | Has Many | Belongs To |
|-------|----------|-----------|
| users | vehicles, bookings, subscriptions, wallet_txns, notifications, addresses | — |
| vehicles | bookings, marketplace_listings, fleet_vehicles, insurance_policies | users |
| bookings | payments, booking_timeline, reviews, chat_conversations | users, vehicles, franchise_partners, staff |
| franchise_partners | staff, zones, bookings | users |
| staff | bookings | franchise_partners, users |
| subscription_plans | subscriptions | — |
| subscriptions | — | users, subscription_plans, vehicles |
| marketplace_listings | marketplace_inquiries | users, vehicles |
| coupons | coupon_usages | — |
| fleet_accounts | fleet_vehicles | — |
| chat_conversations | chat_messages | bookings, users |

---

## Enum Types

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('consumer','partner','admin','staff','fleet_manager','support');

-- KYC status
CREATE TYPE kyc_status AS ENUM ('pending','under_review','approved','rejected');

-- Vehicle fuel type
CREATE TYPE fuel_type AS ENUM ('petrol','diesel','cng','electric','hybrid');

-- Vehicle body type
CREATE TYPE vehicle_type AS ENUM ('hatchback','sedan','suv','luxury','commercial','bike');

-- Booking lifecycle
CREATE TYPE booking_status AS ENUM (
  'pending','confirmed','assigned','on_the_way',
  'arrived','in_progress','completed','cancelled','refunded'
);

-- Payment methods
CREATE TYPE payment_method AS ENUM ('razorpay','wallet','cash','upi','credit');

-- Payment status
CREATE TYPE payment_status AS ENUM ('pending','success','failed','refunded','disputed');

-- Subscription status
CREATE TYPE subscription_status AS ENUM ('active','paused','cancelled','expired','trial');

-- Subscription interval
CREATE TYPE subscription_interval AS ENUM ('weekly','monthly','quarterly','yearly');

-- Marketplace status
CREATE TYPE listing_status AS ENUM ('draft','pending_inspection','listed','under_review','sold','removed');

-- Condition
CREATE TYPE vehicle_condition AS ENUM ('excellent','good','fair','poor');

-- Insurance type
CREATE TYPE insurance_type AS ENUM ('third_party','comprehensive','zero_dep','bundled');

-- Coupon type
CREATE TYPE coupon_type AS ENUM ('percent','flat','free_service','cashback');

-- Message type
CREATE TYPE message_type AS ENUM ('text','image','location','system');

-- Reviewee type
CREATE TYPE reviewee_type AS ENUM ('partner','consumer','staff','platform');
```

---

*AutoCareX Database Design v1.0 | 2026*
