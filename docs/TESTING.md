# AutoCareX — Testing Strategy

## Overview

| Test Type | Tool | Coverage Target | Runs In |
|-----------|------|----------------|---------|
| Unit | Jest | 80% lines | CI (every PR) |
| Integration | Jest + Supertest | All API endpoints | CI (every PR) |
| E2E (Flutter) | flutter_test | Critical user flows | CI (every PR) |
| Load Testing | k6 | Key endpoints | Pre-release |
| Contract | Pact | API contracts | CI (every PR) |

---

## Backend Testing (Jest + Supertest)

### Directory Structure

```
backend/
└── src/
    ├── __tests__/
    │   ├── unit/
    │   │   ├── services/
    │   │   │   ├── booking.service.test.js
    │   │   │   ├── payment.service.test.js
    │   │   │   └── subscription.service.test.js
    │   │   ├── utils/
    │   │   │   ├── otp.test.js
    │   │   │   └── pricing.test.js
    │   │   └── middleware/
    │   │       ├── auth.middleware.test.js
    │   │       └── rateLimit.test.js
    │   └── integration/
    │       ├── auth.test.js
    │       ├── bookings.test.js
    │       ├── payments.test.js
    │       ├── subscriptions.test.js
    │       ├── marketplace.test.js
    │       └── admin.test.js
    └── jest.config.js
```

### jest.config.js

```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/database/migrations/**',
  ],
  coverageThresholds: {
    global: { lines: 80, functions: 80, branches: 70, statements: 80 },
  },
  setupFilesAfterFramework: ['./src/__tests__/setup.js'],
  testTimeout: 15000,
};
```

### Integration Test Example

```javascript
// src/__tests__/integration/auth.test.js
const request = require('supertest');
const app = require('../../app');
const { prisma } = require('../../database');
const redis = require('../../lib/redis');

describe('POST /api/v1/auth/send-otp', () => {
  beforeEach(async () => {
    await redis.flushdb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await redis.quit();
  });

  it('should send OTP to valid phone number', async () => {
    const res = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ phone: '+919988776655' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('OTP sent successfully');
    expect(res.body.expires_in).toBe(300);

    // Verify OTP stored in Redis
    const stored = await redis.get('otp:+919988776655');
    expect(stored).toBeDefined();
    expect(stored).toHaveLength(6);
  });

  it('should rate limit after 5 requests', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/v1/auth/send-otp').send({ phone: '+919988776655' });
    }

    const res = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ phone: '+919988776655' });

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });

  it('should return 400 for invalid phone number', async () => {
    const res = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ phone: '12345' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/verify-otp', () => {
  it('should return JWT token on valid OTP', async () => {
    await redis.set('otp:+919988776655', '123456', 'EX', 300);

    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '+919988776655', otp: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.refresh_token).toBeDefined();
    expect(res.body.user.phone).toBe('+919988776655');
  });

  it('should reject wrong OTP', async () => {
    await redis.set('otp:+919988776655', '123456', 'EX', 300);

    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '+919988776655', otp: '999999' });

    expect(res.status).toBe(401);
  });
});
```

### Unit Test Example

```javascript
// src/__tests__/unit/services/booking.service.test.js
const { calculateBookingPrice } = require('../../../services/booking.service');

describe('calculateBookingPrice', () => {
  it('should apply percentage coupon correctly', () => {
    const result = calculateBookingPrice({
      baseAmount: 2500,
      coupon: { type: 'percent', value: 20, max_discount: 300 },
      subscriptionTier: 'basic',
    });

    expect(result.discount).toBe(300);  // 20% = 500, capped at 300
    expect(result.gst).toBe(396);       // 18% on (2500 - 300)
    expect(result.total).toBe(2596);
  });

  it('should apply subscription discount on top of base', () => {
    const result = calculateBookingPrice({
      baseAmount: 2000,
      coupon: null,
      subscriptionTier: 'pro',  // 20% off
    });

    expect(result.discount).toBe(400);
    expect(result.total).toBe(1888);
  });
});
```

### Running Tests

```bash
cd backend

# All tests
npm test

# Watch mode (development)
npm run test:watch

# With coverage
npm run test:coverage

# Specific file
npm test -- auth.test.js

# Integration tests only
npm test -- --testPathPattern=integration
```

---

## Flutter Testing

### Test Structure

```
mobile/
└── test/
    ├── unit/
    │   ├── models/
    │   │   ├── booking_model_test.dart
    │   │   └── vehicle_model_test.dart
    │   ├── providers/
    │   │   ├── auth_provider_test.dart
    │   │   └── booking_provider_test.dart
    │   └── utils/
    │       └── price_calculator_test.dart
    ├── widget/
    │   ├── booking_card_test.dart
    │   ├── service_list_test.dart
    │   └── login_screen_test.dart
    └── integration/
        └── booking_flow_test.dart
```

### Widget Test Example

```dart
// test/widget/booking_card_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:autocareX/widgets/booking_card.dart';
import 'package:autocareX/models/booking.dart';

void main() {
  testWidgets('BookingCard displays booking info correctly', (tester) async {
    final booking = Booking(
      id: 'BK001234',
      service: 'AC Service',
      status: BookingStatus.completed,
      amount: 2800,
      scheduledAt: DateTime(2024, 6, 1, 10, 0),
    );

    await tester.pumpWidget(
      MaterialApp(child: BookingCard(booking: booking)),
    );

    expect(find.text('BK001234'), findsOneWidget);
    expect(find.text('AC Service'), findsOneWidget);
    expect(find.text('₹2,800'), findsOneWidget);
    expect(find.byIcon(Icons.check_circle), findsOneWidget);
  });

  testWidgets('BookingCard shows "Rate Now" for completed bookings without rating', (tester) async {
    final booking = Booking(
      id: 'BK001234',
      service: 'AC Service',
      status: BookingStatus.completed,
      amount: 2800,
      scheduledAt: DateTime(2024, 6, 1),
      rating: null,
    );

    await tester.pumpWidget(
      MaterialApp(child: BookingCard(booking: booking)),
    );

    expect(find.text('Rate Now'), findsOneWidget);
  });
}
```

### Running Flutter Tests

```bash
cd mobile

# All tests
flutter test

# With coverage
flutter test --coverage

# Specific test file
flutter test test/widget/booking_card_test.dart

# Integration tests (requires device/emulator)
flutter test integration_test/booking_flow_test.dart
```

---

## Load Testing (k6)

### Install k6

```bash
brew install k6          # macOS
# or
docker pull grafana/k6   # Docker
```

### Booking API Load Test

```javascript
// k6/scripts/booking-load-test.js
import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const bookingDuration = new Trend('booking_creation_duration');

export const options = {
  scenarios: {
    ramp_up: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 200,
      stages: [
        { target: 50, duration: '2m' },   // Ramp to 50 RPS
        { target: 100, duration: '5m' },  // Hold at 100 RPS
        { target: 200, duration: '3m' },  // Peak load
        { target: 0, duration: '2m' },    // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],   // 95% under 500ms
    http_req_failed: ['rate<0.01'],                    // <1% error rate
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://api-staging.autocareX.in/api/v1';

export function setup() {
  // Login and get token
  const res = http.post(`${BASE_URL}/auth/admin/login`, JSON.stringify({
    email: __ENV.ADMIN_EMAIL,
    password: __ENV.ADMIN_PASSWORD,
  }), { headers: { 'Content-Type': 'application/json' } });
  return { token: res.json('token') };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  group('Get Dashboard Stats', () => {
    const res = http.get(`${BASE_URL}/admin/dashboard/stats`, { headers });
    check(res, {
      'status is 200': (r) => r.status === 200,
      'has revenue_mtd': (r) => r.json('revenue_mtd') !== undefined,
    });
    errorRate.add(res.status !== 200);
  });

  group('Get Bookings List', () => {
    const res = http.get(`${BASE_URL}/admin/bookings?page=1&limit=25`, { headers });
    check(res, {
      'status is 200': (r) => r.status === 200,
    });
  });

  sleep(1);
}

export function teardown(data) {
  console.log(`Load test complete. Final error rate: ${errorRate.value}`);
}
```

### Running Load Tests

```bash
# Point to staging environment
k6 run \
  -e BASE_URL=https://api-staging.autocareX.in/api/v1 \
  -e ADMIN_EMAIL=loadtest@autocareX.in \
  -e ADMIN_PASSWORD=loadtest_password \
  k6/scripts/booking-load-test.js

# With HTML report
k6 run --out json=results.json k6/scripts/booking-load-test.js
k6 report results.json

# Via Docker
docker run --rm -v $(pwd)/k6:/scripts grafana/k6 run /scripts/booking-load-test.js
```

### Load Test Targets

| Endpoint | Target p95 | Target p99 | Max RPS |
|----------|-----------|-----------|---------|
| GET /health | <50ms | <100ms | 1000 |
| POST /auth/verify-otp | <300ms | <500ms | 200 |
| GET /bookings | <400ms | <800ms | 300 |
| POST /bookings | <800ms | <1500ms | 100 |
| GET /admin/dashboard/stats | <500ms | <1000ms | 50 |
| GET /marketplace/cars | <600ms | <1200ms | 200 |

---

## Coverage Targets

| Module | Lines | Functions | Branches |
|--------|-------|-----------|----------|
| Auth | 90% | 90% | 85% |
| Bookings | 85% | 85% | 80% |
| Payments | 90% | 90% | 85% |
| Subscriptions | 80% | 80% | 75% |
| Admin | 75% | 75% | 70% |
| Utilities | 95% | 95% | 90% |
| **Overall** | **80%** | **80%** | **75%** |
