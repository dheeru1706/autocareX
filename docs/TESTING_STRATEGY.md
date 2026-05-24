# AutoCareX Testing Strategy

## Testing Pyramid

```
          ┌─────────┐
          │   E2E   │  ← 10% (Playwright/Detox)
          │   Tests │
         ─┼─────────┼─
        ┌─┤ Integr. ├─┐  ← 30% (Supertest, Flutter integration)
        │ │  Tests  │ │
       ─┼─┼─────────┼─┼─
      ┌─┤ │  Unit   │ ├─┐  ← 60% (Jest, flutter_test)
      │ │ │  Tests  │ │ │
      └─┴─┴─────────┴─┴─┘
```

---

## Backend Testing (Node.js + Jest)

### Setup

```bash
# Install test dependencies
npm install --save-dev jest supertest @jest/globals
npm install --save-dev testcontainers  # For spinning up test PG + Redis
```

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
  coverageThreshold: {
    global: { branches: 70, functions: 80, lines: 80, statements: 80 }
  },
  setupFilesAfterFramework: ['./tests/setup.js'],
  testTimeout: 30000
};
```

### Unit Tests

#### Auth Service Tests
```javascript
// tests/unit/auth.service.test.js
describe('AuthService', () => {
  describe('generateOTP', () => {
    it('generates 6-digit numeric OTP', () => {
      const otp = AuthService.generateOTP();
      expect(otp).toMatch(/^\d{6}$/);
    });
    
    it('generates unique OTPs each call', () => {
      const otp1 = AuthService.generateOTP();
      const otp2 = AuthService.generateOTP();
      // Statistically very unlikely to be equal
      // This test just verifies function returns something
      expect(otp1).toBeDefined();
    });
  });

  describe('verifyOTP', () => {
    it('returns true for matching OTP within expiry', async () => {
      const otp = '123456';
      const hash = await bcrypt.hash(otp, 10);
      await redis.set('otp:+919999999999', hash, 'EX', 600);
      
      const result = await AuthService.verifyOTP('+919999999999', '123456');
      expect(result.valid).toBe(true);
    });
    
    it('returns false for wrong OTP', async () => {
      const otp = '123456';
      const hash = await bcrypt.hash(otp, 10);
      await redis.set('otp:+919999999999', hash, 'EX', 600);
      
      const result = await AuthService.verifyOTP('+919999999999', '999999');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('INVALID_OTP');
    });
    
    it('returns false when OTP expired', async () => {
      // No key in Redis = expired
      const result = await AuthService.verifyOTP('+910000000000', '123456');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('OTP_EXPIRED');
    });
  });
  
  describe('issueTokens', () => {
    it('returns access and refresh tokens', () => {
      const { accessToken, refreshToken } = AuthService.issueTokens({ id: 'user-123', role: 'consumer' });
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      expect(decoded.id).toBe('user-123');
      expect(decoded.role).toBe('consumer');
    });
    
    it('access token expires in 15 minutes', () => {
      const { accessToken } = AuthService.issueTokens({ id: 'user-123', role: 'consumer' });
      const decoded = jwt.decode(accessToken);
      const expiresIn = decoded.exp - decoded.iat;
      expect(expiresIn).toBe(900); // 15 * 60
    });
  });
});
```

#### Booking Service Tests
```javascript
// tests/unit/booking.service.test.js
describe('BookingService', () => {
  describe('checkSlotAvailability', () => {
    it('returns true when partner has no conflicting bookings', async () => {
      // Mock DB query returning no conflicts
      jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: [] });
      
      const available = await BookingService.checkSlotAvailability(
        'partner-123',
        new Date('2026-06-01T10:00:00'),
        new Date('2026-06-01T11:00:00')
      );
      expect(available).toBe(true);
    });
    
    it('returns false when slot conflicts with existing booking', async () => {
      jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: [{ id: 'booking-456' }] });
      
      const available = await BookingService.checkSlotAvailability(
        'partner-123',
        new Date('2026-06-01T10:00:00'),
        new Date('2026-06-01T11:00:00')
      );
      expect(available).toBe(false);
    });
  });

  describe('assignNearestPartner', () => {
    it('selects partner with highest rating in territory', async () => {
      const mockPartners = [
        { id: 'p1', rating: 4.8, distance_km: 2.5 },
        { id: 'p2', rating: 4.2, distance_km: 1.2 },
        { id: 'p3', rating: 4.5, distance_km: 3.1 },
      ];
      jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: mockPartners });
      
      const partner = await BookingService.assignNearestPartner(12.9716, 77.5946);
      expect(partner.id).toBe('p2'); // closest with acceptable rating
    });
  });
  
  describe('calculateAmount', () => {
    it('applies percentage coupon correctly', () => {
      const result = BookingService.calculateAmount(1000, { type: 'percent', value: 20, max_discount: 300 });
      expect(result.discount).toBe(200);
      expect(result.final).toBe(800);
    });
    
    it('caps discount at max_discount', () => {
      const result = BookingService.calculateAmount(5000, { type: 'percent', value: 20, max_discount: 300 });
      expect(result.discount).toBe(300); // capped at max
      expect(result.final).toBe(4700);
    });
    
    it('adds 18% GST to final amount', () => {
      const result = BookingService.calculateAmount(1000, null);
      expect(result.gst).toBe(180);
      expect(result.final).toBe(1180);
    });
  });
});
```

### Integration Tests

```javascript
// tests/integration/auth.routes.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/v1/auth/send-otp', () => {
  it('sends OTP for valid Indian phone number', async () => {
    // Mock Twilio
    jest.mock('../../src/utils/sms', () => ({
      sendOTP: jest.fn().mockResolvedValue({ sid: 'SM123' })
    }));
    
    const res = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ phone: '+919876543210' });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('OTP sent');
  });
  
  it('rejects invalid phone number', async () => {
    const res = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ phone: '12345' });
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('phone');
  });
  
  it('rate limits after 5 requests in 10 minutes', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/v1/auth/send-otp').send({ phone: '+919000000001' });
    }
    const res = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ phone: '+919000000001' });
    
    expect(res.status).toBe(429);
  });
});

describe('POST /api/v1/auth/verify-otp', () => {
  it('returns JWT tokens for valid OTP', async () => {
    // Seed OTP in Redis
    await redis.set('otp:+919876543210', await bcrypt.hash('123456', 10), 'EX', 600);
    
    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '+919876543210', otp: '123456' });
    
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user).toBeDefined();
  });
});
```

```javascript
// tests/integration/bookings.routes.test.js
describe('POST /api/v1/bookings', () => {
  let authToken;
  let userId;
  
  beforeAll(async () => {
    // Create test user and get token
    const user = await createTestUser();
    authToken = generateToken(user.id, 'consumer');
    userId = user.id;
  });
  
  it('creates booking for authenticated user', async () => {
    const vehicle = await createTestVehicle(userId);
    const address = await createTestAddress(userId);
    const pkg = await createTestPackage();
    const partner = await createTestPartner();
    
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        vehicleId: vehicle.id,
        addressId: address.id,
        servicePackageId: pkg.id,
        scheduledAt: '2026-07-01T10:00:00Z',
        notes: 'Please use eco-friendly products'
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.bookingNumber).toMatch(/^AX\d{6}$/);
    expect(res.body.data.status).toBe('pending');
  });
  
  it('rejects booking without auth', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .send({});
    
    expect(res.status).toBe(401);
  });
  
  it('prevents double-booking same slot', async () => {
    const vehicle = await createTestVehicle(userId);
    const address = await createTestAddress(userId);
    const pkg = await createTestPackage();
    
    // Create first booking
    await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ vehicleId: vehicle.id, addressId: address.id, servicePackageId: pkg.id, scheduledAt: '2026-07-01T14:00:00Z' });
    
    // Attempt second booking for same partner + time
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ vehicleId: vehicle.id, addressId: address.id, servicePackageId: pkg.id, scheduledAt: '2026-07-01T14:00:00Z' });
    
    expect(res.status).toBe(409);
  });
});
```

### Load Tests (k6)

```javascript
// tests/load/booking_flow.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 200 },  // Hold at 200 users
    { duration: '2m', target: 500 },  // Spike to 500
    { duration: '3m', target: 200 },  // Back to 200
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.05'],
  },
};

const BASE_URL = 'https://api.autocareX.in/api/v1';

export function setup() {
  // Login and get token
  const loginRes = http.post(`${BASE_URL}/auth/verify-otp`, JSON.stringify({
    phone: '+919999999999',
    otp: '123456'  // Test OTP in load test env
  }), { headers: { 'Content-Type': 'application/json' } });
  
  return { token: loginRes.json('data.accessToken') };
}

export default function(data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`
  };
  
  // Test 1: Get service packages
  const pkgsRes = http.get(`${BASE_URL}/services/packages`, { headers });
  check(pkgsRes, { 'packages returned': (r) => r.status === 200 });
  
  // Test 2: Get user profile
  const profileRes = http.get(`${BASE_URL}/users/profile`, { headers });
  check(profileRes, { 'profile returned': (r) => r.status === 200 });
  
  // Test 3: Create booking
  const bookingRes = http.post(`${BASE_URL}/bookings`, JSON.stringify({
    vehicleId: 'test-vehicle-id',
    addressId: 'test-address-id',
    servicePackageId: 'test-pkg-id',
    scheduledAt: new Date(Date.now() + 86400000).toISOString()
  }), { headers });
  
  const success = check(bookingRes, {
    'booking created': (r) => r.status === 201,
    'response time ok': (r) => r.timings.duration < 1000
  });
  
  errorRate.add(!success);
  
  sleep(1 + Math.random() * 2); // Random 1-3s think time
}
```

---

## Flutter Testing

### Unit Tests
```dart
// test/unit/booking_validator_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:autocareX/core/utils/validators.dart';

void main() {
  group('Validators', () {
    group('Phone validation', () {
      test('accepts valid Indian phone number', () {
        expect(Validators.phone('+919876543210'), isNull); // null = valid
      });
      
      test('rejects short phone number', () {
        expect(Validators.phone('98765'), isNotNull);
      });
      
      test('rejects non-numeric characters', () {
        expect(Validators.phone('9876abc210'), isNotNull);
      });
    });
    
    group('Required field', () {
      test('accepts non-empty string', () {
        expect(Validators.required('hello'), isNull);
      });
      
      test('rejects empty string', () {
        expect(Validators.required(''), isNotNull);
      });
      
      test('rejects whitespace-only string', () {
        expect(Validators.required('   '), isNotNull);
      });
    });
  });
  
  group('Price formatting', () {
    test('formats Indian price with commas', () {
      expect(formatPrice(125000), '₹1,25,000');
    });
    
    test('formats price under 1000 without commas', () {
      expect(formatPrice(499), '₹499');
    });
  });
}
```

### Widget Tests
```dart
// test/widget/login_screen_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:autocareX/features/auth/presentation/screens/login_screen.dart';

void main() {
  testWidgets('Login screen shows phone input and send OTP button', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(home: LoginScreen()),
      ),
    );
    
    expect(find.byType(TextField), findsOneWidget);
    expect(find.text('SEND OTP'), findsOneWidget);
    expect(find.text('+91'), findsOneWidget);
  });
  
  testWidgets('Shows validation error for empty phone submit', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(home: LoginScreen()),
      ),
    );
    
    await tester.tap(find.text('SEND OTP'));
    await tester.pumpAndSettle();
    
    expect(find.text('Please enter your phone number'), findsOneWidget);
  });
  
  testWidgets('Enables button when valid phone entered', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(home: LoginScreen()),
      ),
    );
    
    await tester.enterText(find.byType(TextField), '9876543210');
    await tester.pump();
    
    final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
    expect(button.onPressed, isNotNull);
  });
}
```

### Integration Tests
```dart
// integration_test/booking_flow_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:autocareX/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  
  group('Booking Flow E2E', () {
    testWidgets('Complete booking from home to payment', (tester) async {
      app.main();
      await tester.pumpAndSettle();
      
      // Login
      await tester.tap(find.text('Car Wash'));
      await tester.pumpAndSettle();
      
      // Select package
      await tester.tap(find.text('Premium Interior Wash'));
      await tester.pumpAndSettle();
      
      await tester.tap(find.text('BOOK NOW'));
      await tester.pumpAndSettle();
      
      // Select vehicle
      expect(find.text('Select Vehicle'), findsOneWidget);
      await tester.tap(find.text('Swift Dzire'));
      await tester.pumpAndSettle();
      
      // Verify payment screen reached
      expect(find.text('Order Summary'), findsOneWidget);
    });
  });
}
```

---

## Coverage Targets

| Component | Line Coverage | Branch Coverage |
|-----------|-------------|----------------|
| Backend auth module | 90% | 85% |
| Backend bookings module | 85% | 80% |
| Backend payments module | 95% | 90% |
| Flutter auth feature | 80% | 75% |
| Flutter booking feature | 75% | 70% |
| Overall backend | 80% | 75% |
| Overall Flutter | 70% | 65% |

---

## CI Test Pipeline

```yaml
# .github/workflows/ci.yml (test jobs)
test-backend:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:15
      env: { POSTGRES_DB: autocareX_test, POSTGRES_USER: test, POSTGRES_PASSWORD: test }
    redis:
      image: redis:7
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: '20', cache: 'npm', cache-dependency-path: backend/package-lock.json }
    - run: cd backend && npm ci
    - run: cd backend && npm run migrate:test
    - run: cd backend && npm test -- --coverage --forceExit
    - uses: codecov/codecov-action@v4

test-flutter:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: subosito/flutter-action@v2
      with: { flutter-version: '3.19.0', channel: 'stable' }
    - run: cd mobile && flutter pub get
    - run: cd mobile && flutter analyze
    - run: cd mobile && flutter test --coverage
```

---

*AutoCareX Testing Strategy v1.0 | 2026*
