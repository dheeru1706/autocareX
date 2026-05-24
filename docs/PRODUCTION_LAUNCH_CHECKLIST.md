# AutoCareX Production Launch Checklist

## Phase 1: Infrastructure (Week -4)

### AWS Setup
- [ ] Create AWS account + IAM roles with least privilege
- [ ] Setup VPC with public/private subnets (3 AZs)
- [ ] RDS PostgreSQL 15 (Multi-AZ, db.r6g.large, 100GB gp3)
- [ ] ElastiCache Redis 7 (cluster mode, cache.r6g.large)
- [ ] EC2 Auto Scaling Group (t3.large, min:2, max:10)
- [ ] Application Load Balancer (ALB) with health checks
- [ ] S3 buckets: autocareX-uploads, autocareX-backups (versioning + lifecycle)
- [ ] CloudFront distribution for S3 assets
- [ ] Route53 hosted zone + DNS records
- [ ] ACM SSL certificate (api.autocareX.in, admin.autocareX.in, app.autocareX.in)
- [ ] ECR repositories for Docker images
- [ ] CloudWatch log groups + alarms
- [ ] SNS topics for alerts
- [ ] WAF rules on ALB (OWASP top 10 rule set)
- [ ] Secrets Manager for all credentials

### Database
- [ ] Run full schema migration on RDS
- [ ] Create read replica for analytics queries
- [ ] Setup automated backups (7-day retention)
- [ ] Enable Performance Insights
- [ ] Create database user with minimal permissions
- [ ] Test failover to standby RDS

### Security
- [ ] Security Group rules (backend only from ALB, DB only from backend)
- [ ] Enable AWS GuardDuty
- [ ] Enable AWS Config for compliance
- [ ] Enable CloudTrail for audit logging
- [ ] Rotate all secrets in Secrets Manager
- [ ] Penetration test (OWASP ZAP scan)

## Phase 2: Backend Deployment (Week -3)

### Pre-deployment
- [ ] All environment variables set in Secrets Manager
- [ ] Database migrations applied (verified on staging first)
- [ ] Redis connection verified
- [ ] S3 bucket policies and CORS configured
- [ ] Firebase project created (push notifications)
- [ ] FCM server key configured
- [ ] Twilio account funded + phone number verified
- [ ] Razorpay account in live mode, webhook URLs registered
- [ ] Google Maps API key with production domain restrictions

### Backend
- [ ] Docker image built and pushed to ECR
- [ ] ECS task definition or EC2 docker-compose deployed
- [ ] Health check endpoint returning 200 `/health`
- [ ] All API routes tested with Postman/Thunder Client
- [ ] Rate limiting verified (OTP: 5/10min, API: 100/min)
- [ ] JWT expiry and refresh flow tested
- [ ] Webhook endpoints verified (Razorpay test mode → live)
- [ ] WebSocket (Socket.io) connection verified
- [ ] FCM push notification tested on Android + iOS device
- [ ] SMS OTP delivery tested (real Indian phone numbers)
- [ ] S3 upload tested (images, documents)
- [ ] Email notifications (if applicable) tested

### Performance
- [ ] PostgreSQL indexes verified (EXPLAIN ANALYZE on hot queries)
- [ ] Redis caching tested (cache hit rate > 80% for catalog)
- [ ] API response times < 300ms (p95)
- [ ] Load test with k6 (500 concurrent users, 10 min)
- [ ] Connection pool sizing verified (pg: 20, Redis: 10)

## Phase 3: Mobile App (Week -2)

### Android
- [ ] Generate signed APK/AAB with production keystore
- [ ] Keystore stored securely (NOT in git)
- [ ] applicationId set to `in.autocareX.app`
- [ ] minSdkVersion 21 (Android 5.0)
- [ ] targetSdkVersion 34
- [ ] google-services.json (production Firebase) in place
- [ ] Maps API key in AndroidManifest.xml (restricted to app signature)
- [ ] ProGuard/R8 rules verified (no obfuscation of model classes)
- [ ] App size < 50MB (AAB allows dynamic delivery)
- [ ] All permissions declared: INTERNET, LOCATION, CAMERA, READ_EXTERNAL_STORAGE
- [ ] Deep linking configured (autocareX://booking/123)
- [ ] Play Store listing: screenshots, description, content rating
- [ ] Internal testing track → Closed beta → Production

### iOS
- [ ] Bundle ID: `in.autocareX.app`
- [ ] Provisioning profile (App Store distribution)
- [ ] Signing certificate in Keychain
- [ ] GoogleService-Info.plist (production Firebase) in place
- [ ] NSLocationWhenInUseUsageDescription in Info.plist
- [ ] NSCameraUsageDescription in Info.plist
- [ ] NSPhotoLibraryUsageDescription in Info.plist
- [ ] APNs push certificate uploaded to Firebase
- [ ] Minimum iOS 12.0
- [ ] App Store listing + screenshots (6.5" + 5.5" screens)
- [ ] TestFlight internal → external → App Store review

### App Quality
- [ ] OTP login flow end-to-end on real device
- [ ] Booking flow end-to-end (select service → pay → track)
- [ ] Razorpay payment tested with live keys on real device
- [ ] Push notifications received in background + killed state
- [ ] Google Maps showing correct location, address search working
- [ ] Image upload (camera + gallery) working
- [ ] Offline mode (cached data shows, actions queued)
- [ ] App works on low-end Android (2GB RAM, Android 8)
- [ ] Dark mode verified on all screens
- [ ] No crashes in 1-hour stress test session

## Phase 4: Admin Panel (Week -2)

- [ ] Build deployed to S3 + CloudFront
- [ ] Admin login working (create initial admin user via script)
- [ ] All dashboard charts loading real data
- [ ] Franchise approval workflow tested
- [ ] Coupon creation and validation tested
- [ ] Push notification broadcast tested
- [ ] Revenue reports accurate (verify against payment records)
- [ ] Role-based access: superadmin vs city_manager vs support
- [ ] CSV export working
- [ ] Audit logs recording admin actions

## Phase 5: Business Operations (Week -1)

### Partner Onboarding
- [ ] First 5 franchise partners onboarded in KYC system
- [ ] Territory mapping done in admin panel
- [ ] Service packages priced and active
- [ ] Partner app tested with real partner accounts
- [ ] Staff accounts created per partner
- [ ] Payout process documented + tested

### Content
- [ ] Service categories seeded (Wash, Detail, Inspection, Insurance, Marketplace)
- [ ] Service packages with correct pricing
- [ ] Subscription plans created (Basic ₹999/mo, Premium ₹1999/mo)
- [ ] Launch coupons created (LAUNCH50, FIRST100)
- [ ] Push notification templates ready
- [ ] Onboarding SMS content approved

### Legal & Compliance
- [ ] Privacy Policy URL live
- [ ] Terms of Service URL live
- [ ] Refund Policy documented
- [ ] GST registration number in invoice template
- [ ] Payment confirmation emails/SMS templates approved
- [ ] Data retention policy documented (PII: 3 years)

## Phase 6: Launch Day

### T-24 hours
- [ ] Final smoke test on production environment
- [ ] Database backup taken
- [ ] On-call rotation assigned (backend + mobile)
- [ ] Monitoring dashboards open (CloudWatch, Datadog if using)
- [ ] Rollback procedure rehearsed
- [ ] Support team briefed with FAQ

### T-0 Launch
- [ ] App Store + Play Store goes live
- [ ] Send launch push notification to beta users
- [ ] Monitor error rates (< 1% target)
- [ ] Monitor API latency (p99 < 1s target)
- [ ] Monitor booking success rate
- [ ] Social media announcement

### T+24 hours post-launch
- [ ] Review Crashlytics/Firebase crash reports
- [ ] Review 1-star app store reviews
- [ ] Check payment failure rates
- [ ] Verify push notification delivery rates
- [ ] Review slow query logs
- [ ] Team retrospective call

## Monitoring & Alerting

### CloudWatch Alarms
- [ ] CPU > 80% for 5 min → SNS → PagerDuty
- [ ] Memory > 85% → alert
- [ ] RDS connections > 80% → alert
- [ ] ALB 5xx errors > 1% → alert (critical)
- [ ] API latency p99 > 2s → alert
- [ ] Redis memory > 80% → alert
- [ ] Failed login attempts > 100/min → alert (security)

### Business Metrics (Daily)
- [ ] Bookings created / completed / cancelled
- [ ] Revenue (GMV vs net)
- [ ] New user registrations
- [ ] App crashes (Crashlytics)
- [ ] Payment success rate (target > 95%)
- [ ] Subscription activations / cancellations

## Scalability Triggers

| Metric | Scale Action |
|--------|-------------|
| API CPU > 70% sustained | Add EC2 instance |
| DB read latency > 100ms | Promote read replica |
| Redis memory > 75% | Upgrade instance |
| Booking volume > 10k/day | Enable queue-based booking |
| 50k+ users | Consider separate microservices |
| Multi-region needed | CloudFront + multi-region RDS |

## Rollback Plan

1. Backend: ECR has previous image tagged → `docker pull prev-tag && docker-compose up -d`
2. Database: Never rollback schema forward — write backward-compatible migrations
3. Mobile app: Keep previous APK/IPA → issue patch release within 24h
4. Admin: S3 has previous build → repoint CloudFront distribution

---
*Last updated: 2026-05-23 | AutoCareX Engineering*
