# AutoCareX API Documentation

**Base URL:** `https://api.autocareX.in/api/v1`
**Auth:** Bearer JWT token in `Authorization` header
**Content-Type:** `application/json`

---

## Authentication

### Send OTP
```
POST /auth/send-otp
```
**Body:**
```json
{ "phone": "+919988776655" }
```
**Response 200:**
```json
{ "message": "OTP sent successfully", "expires_in": 300 }
```

### Verify OTP
```
POST /auth/verify-otp
```
**Body:**
```json
{ "phone": "+919988776655", "otp": "482910" }
```
**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_01HXYZ",
    "phone": "+919988776655",
    "name": "Rahul Sharma",
    "is_new": false
  }
}
```

### Admin Login
```
POST /auth/admin/login
```
**Body:**
```json
{ "email": "admin@autocareX.in", "password": "securepassword" }
```
**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "adm_01", "name": "Super Admin", "email": "admin@autocareX.in", "role": "super_admin" }
}
```

### Refresh Token
```
POST /auth/refresh
```
**Body:**
```json
{ "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```
**Response 200:**
```json
{ "token": "NEW_JWT_TOKEN", "refresh_token": "NEW_REFRESH_TOKEN" }
```

### Logout
```
POST /auth/logout
Authorization: Bearer {token}
```
**Response 200:**
```json
{ "message": "Logged out successfully" }
```

---

## Users

### Get Profile
```
GET /users/me
Authorization: Bearer {token}
```
**Response 200:**
```json
{
  "id": "usr_01HXYZ",
  "name": "Rahul Sharma",
  "phone": "+919988776655",
  "email": "rahul@example.com",
  "city": "Hyderabad",
  "profile_photo": "https://cdn.autocareX.in/photos/usr_01HXYZ.jpg",
  "wallet_balance": 850.00,
  "subscription": { "plan": "Pro", "expires_at": "2024-07-15" },
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Update Profile
```
PUT /users/me
Authorization: Bearer {token}
```
**Body:**
```json
{ "name": "Rahul Kumar Sharma", "email": "rahul.sharma@email.com", "city": "Hyderabad" }
```

### Get Vehicles
```
GET /users/me/vehicles
Authorization: Bearer {token}
```
**Response 200:**
```json
{
  "vehicles": [
    {
      "id": "veh_001",
      "registration_number": "TS 09 EA 1234",
      "make": "Honda",
      "model": "City",
      "year": 2021,
      "fuel_type": "Petrol",
      "color": "White Pearl",
      "service_due_date": "2024-06-30"
    }
  ]
}
```

### Add Vehicle
```
POST /users/me/vehicles
Authorization: Bearer {token}
```
**Body:**
```json
{
  "registration_number": "TS 09 EA 1234",
  "make": "Honda",
  "model": "City",
  "year": 2021,
  "fuel_type": "Petrol",
  "color": "White Pearl"
}
```

---

## Bookings

### Create Booking
```
POST /bookings
Authorization: Bearer {token}
```
**Body:**
```json
{
  "vehicle_id": "veh_001",
  "franchise_id": "FR0042",
  "service_type": "ac_service",
  "scheduled_at": "2024-06-01T10:00:00Z",
  "address": {
    "line1": "42, Jubilee Hills",
    "city": "Hyderabad",
    "pincode": "500033",
    "lat": 17.4319,
    "lng": 78.4083
  },
  "coupon_code": "SUMMER20",
  "notes": "Please check AC compressor noise"
}
```
**Response 201:**
```json
{
  "booking": {
    "id": "BK001234",
    "status": "pending_payment",
    "service_type": "ac_service",
    "scheduled_at": "2024-06-01T10:00:00Z",
    "pricing": {
      "base_amount": 2500.00,
      "discount": 500.00,
      "gst": 360.00,
      "total": 2360.00
    }
  },
  "payment": {
    "order_id": "order_NjFkZmE4YzQ5NGM4NjM",
    "key": "rzp_live_XXXXXX",
    "amount": 236000,
    "currency": "INR"
  }
}
```

### List Bookings
```
GET /bookings?status=completed&page=1&limit=20
Authorization: Bearer {token}
```
**Query Params:** `status` | `page` | `limit` | `vehicle_id` | `from_date` | `to_date`

**Response 200:**
```json
{
  "bookings": [...],
  "pagination": { "total": 48, "page": 1, "limit": 20, "pages": 3 }
}
```

### Get Booking Detail
```
GET /bookings/:id
Authorization: Bearer {token}
```

### Cancel Booking
```
POST /bookings/:id/cancel
Authorization: Bearer {token}
```
**Body:**
```json
{ "reason": "Schedule changed" }
```

### Rate Booking
```
POST /bookings/:id/rating
Authorization: Bearer {token}
```
**Body:**
```json
{ "rating": 5, "review": "Excellent service, very professional!", "technician_rating": 5 }
```

---

## Payments

### Verify Payment
```
POST /payments/verify
Authorization: Bearer {token}
```
**Body:**
```json
{
  "razorpay_order_id": "order_NjFkZmE4YzQ5NGM4NjM",
  "razorpay_payment_id": "pay_NjFkZmE4YzQ5",
  "razorpay_signature": "hmac_sha256_signature"
}
```
**Response 200:**
```json
{ "verified": true, "booking_id": "BK001234", "status": "confirmed" }
```

### Get Wallet Balance
```
GET /payments/wallet
Authorization: Bearer {token}
```
**Response 200:**
```json
{ "balance": 850.00, "currency": "INR" }
```

### Get Payment History
```
GET /payments/history?page=1&limit=20
Authorization: Bearer {token}
```

---

## Subscriptions

### List Plans
```
GET /subscriptions/plans
```
**Response 200:**
```json
{
  "plans": [
    {
      "id": "plan_basic",
      "name": "Basic",
      "price": 299,
      "billing_cycle": "monthly",
      "features": ["2 oil changes/year", "10% discount on services", "Free pickup & drop (2x/year)"],
      "vehicles_limit": 1
    },
    {
      "id": "plan_pro",
      "name": "Pro",
      "price": 599,
      "billing_cycle": "monthly",
      "features": ["4 oil changes/year", "20% discount on services", "Free pickup & drop (4x/year)", "Priority booking", "Free car wash (monthly)"],
      "vehicles_limit": 2
    },
    {
      "id": "plan_elite",
      "name": "Elite",
      "price": 999,
      "billing_cycle": "monthly",
      "features": ["Unlimited oil changes", "30% discount on all services", "Unlimited pickup & drop", "Dedicated service manager", "Annual comprehensive inspection"],
      "vehicles_limit": 3
    }
  ]
}
```

### Subscribe
```
POST /subscriptions/subscribe
Authorization: Bearer {token}
```
**Body:**
```json
{ "plan_id": "plan_pro", "vehicle_ids": ["veh_001", "veh_002"] }
```
**Response 201:**
```json
{
  "subscription": { "id": "SUB10042", "plan": "Pro", "status": "active", "starts_at": "2024-06-01", "renews_at": "2024-07-01" },
  "payment": { "order_id": "order_XXXXX", "key": "rzp_live_XXXXX", "amount": 59900, "currency": "INR" }
}
```

### Get Active Subscription
```
GET /subscriptions/active
Authorization: Bearer {token}
```

### Cancel Subscription
```
POST /subscriptions/:id/cancel
Authorization: Bearer {token}
```
**Body:**
```json
{ "reason": "Not using enough", "cancel_at_period_end": true }
```

---

## Marketplace

### List Cars
```
GET /marketplace/cars?city=Hyderabad&make=Honda&min_price=500000&max_price=1500000&page=1
```
**Response 200:**
```json
{
  "listings": [
    {
      "id": "CAR01024",
      "title": "Honda City 2021 — Excellent Condition",
      "make": "Honda",
      "model": "City",
      "year": 2021,
      "fuel": "Petrol",
      "km_driven": 24000,
      "price": 850000,
      "ai_estimated_price": 838000,
      "inspection_score": 87,
      "photos": ["https://cdn.autocareX.in/listings/CAR01024/1.jpg"],
      "city": "Hyderabad",
      "seller": { "type": "dealer", "name": "Sunrise Motors", "rating": 4.8 }
    }
  ],
  "pagination": { "total": 142, "page": 1, "limit": 20 }
}
```

### Get Car Detail
```
GET /marketplace/cars/:id
```

### Get AI Price Estimate
```
POST /marketplace/estimate-price
```
**Body:**
```json
{ "make": "Honda", "model": "City", "year": 2021, "km_driven": 24000, "fuel": "Petrol", "city": "Hyderabad" }
```
**Response 200:**
```json
{
  "estimated_price": 838000,
  "price_range": { "min": 780000, "max": 890000 },
  "confidence": 0.94,
  "factors": ["Year: 2021 (+)", "Low km (24k) (+)", "Popular model (+)", "Petrol (+)"]
}
```

---

## Insurance

### Get Quote
```
POST /insurance/quote
Authorization: Bearer {token}
```
**Body:**
```json
{
  "vehicle_id": "veh_001",
  "insurance_type": "comprehensive",
  "idv": 850000,
  "addons": ["zero_depreciation", "roadside_assistance", "engine_protect"]
}
```
**Response 200:**
```json
{
  "quotes": [
    {
      "provider": "HDFC Ergo",
      "plan": "Comprehensive",
      "premium": 18400,
      "idv": 850000,
      "addons_included": ["zero_depreciation", "roadside_assistance"],
      "claim_settlement_ratio": 98.2
    }
  ]
}
```

---

## Franchise (Partner App)

### Get Dashboard
```
GET /franchise/dashboard
Authorization: Bearer {partner_token}
```
**Response 200:**
```json
{
  "today_bookings": 8,
  "pending_bookings": 3,
  "month_earnings": 68400,
  "average_rating": 4.8,
  "upcoming_bookings": [...]
}
```

### Update Booking Status
```
PATCH /franchise/bookings/:id/status
Authorization: Bearer {partner_token}
```
**Body:**
```json
{ "status": "in_progress", "notes": "AC compressor replaced, testing..." }
```

---

## Admin API

### Dashboard Stats
```
GET /admin/dashboard/stats
Authorization: Bearer {admin_token}
```
**Response 200:**
```json
{
  "revenue_mtd": 21500000,
  "revenue_growth_pct": 12.4,
  "active_bookings": 1284,
  "total_customers": 84320,
  "active_franchises": 127,
  "active_subscriptions": 6870,
  "pending_kyc": 14
}
```

### Get All Franchises
```
GET /admin/franchises?city=Hyderabad&status=pending&page=1&limit=25
Authorization: Bearer {admin_token}
```

### Approve/Reject KYC
```
POST /admin/franchises/:id/kyc/approve
POST /admin/franchises/:id/kyc/reject
Authorization: Bearer {admin_token}
```
**Body:**
```json
{ "notes": "All documents verified and compliant" }
```

### Get Analytics
```
GET /admin/analytics/revenue?period=monthly&from=2024-01-01&to=2024-05-31
Authorization: Bearer {admin_token}
```

---

## Webhooks

### Razorpay Payment Webhook
```
POST /webhooks/razorpay
X-Razorpay-Signature: {hmac_sha256}
```
**Events handled:**
- `payment.captured` — Mark booking as paid
- `payment.failed` — Notify user of failure
- `subscription.charged` — Renew subscription
- `subscription.cancelled` — Cancel subscription
- `refund.processed` — Update refund status

**Verification:** HMAC-SHA256 of payload with `RAZORPAY_WEBHOOK_SECRET`

---

## Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | VALIDATION_ERROR | Request body validation failed |
| 401 | UNAUTHORIZED | Missing or invalid JWT token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Duplicate resource (e.g., slot taken) |
| 422 | UNPROCESSABLE | Valid format but invalid business logic |
| 429 | RATE_LIMITED | Too many requests |
| 500 | SERVER_ERROR | Internal server error |
| 503 | MAINTENANCE | Platform in maintenance mode |

**Error Response Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Phone number is required",
    "details": [{ "field": "phone", "message": "Required" }]
  }
}
```

---

## Rate Limiting

| Endpoint Group | Limit |
|---------------|-------|
| OTP Send | 5 requests/minute per phone |
| OTP Verify | 10 requests/minute per phone |
| Auth endpoints | 20 requests/minute per IP |
| API (authenticated) | 100 requests/minute per user |
| API (unauthenticated) | 30 requests/minute per IP |
| File upload | 10 requests/minute per user |
| Admin API | 200 requests/minute per admin |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1716460800
Retry-After: 45  (only on 429 responses)
```
