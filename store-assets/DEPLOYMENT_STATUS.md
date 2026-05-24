# AutoCareX — Deployment Status & Next Steps
*Last updated: May 2026*

---

## ✅ COMPLETED

### GitHub
- Repo: https://github.com/dheeru1706/autocareX (currently public)
- 200+ files pushed (admin, backend, mobile, mobile-preview)
- 7 GitHub Actions secrets set:
  - `KEYSTORE_BASE64` — Android release keystore
  - `KEY_STORE_PASSWORD` / `KEY_PASSWORD` / `KEY_ALIAS`
  - `VITE_API_URL` — https://autocarex-production.up.railway.app/api/v1
  - `VITE_RAZORPAY_KEY_ID`
  - `GOOGLE_SERVICES_JSON` (placeholder — replace with real Firebase config)

### Admin Panel (Vercel)
- **LIVE at: https://admin-eta-woad-17.vercel.app**
- Login: admin@autocarex.in / Admin@123 (change after setup!)
- Theme: Navy + White + Orange automotive design

### Railway Infrastructure Created
- Project ID: c267fabe-d504-4240-8275-f600202baf7d
- PostgreSQL service (b33e0bb3) — postgres:15-alpine
- Redis service (b4487e1b) — redis:7-alpine
- Backend service (90ed4d19) — connected to GitHub repo
- 18 environment variables set

### Mobile App
- Flutter 3.44.0 SDK installed at /Users/saidheeraj/development/flutter-sdk
- Android keystore generated: mobile/autocareX.keystore
  - Password: AutoCareX@2024 | Alias: autocareX
- Dependencies resolved (flutter pub get completed)
- Firebase init is fault-tolerant (won't crash if config missing)

---

## 🔴 NEEDS YOUR ACTION

### 1. Railway Backend Deployment (URGENT)
The Railway API token has expired. Do this:

1. Go to **https://railway.app** → Sign In
2. Go to your project → **autocareX** 
3. Click the backend service → check **Deployments** tab
4. If the latest deployment is failing, click **"Redeploy"**
5. Go to **Account → Tokens** → create a new token
6. Send the new token so I can continue automating Railway

**After backend is up:**
- Run schema migration: `DATABASE_URL=<from Railway vars> node backend/scripts/migrate.js`
- Seed admin user: `DATABASE_URL=<from Railway vars> node backend/scripts/seed-admin.js`

### 2. GitHub Actions Workflows (Android Build)
Your GitHub token needs `workflow` scope to push `.github/workflows/` files.

**Option A — Update existing token:**
1. Go to https://github.com/settings/tokens
2. Find your token → Edit → check ✅ **workflow** checkbox → Save
3. Tell me "done" — I'll push the workflow files

**Option B — Create new token:**
1. Go to https://github.com/settings/tokens/new
2. Check: `repo` + `workflow`
3. Give me the new token

**GitHub Actions workflows ready to push:**
- `build-android.yml` — builds signed APK + AAB on every push
- `deploy-admin.yml` — deploys admin panel to Vercel automatically
- `backend-ci.yml` — runs tests on every PR

### 3. Railway Environment: CORS
Once backend is up, add this environment variable in Railway:
```
CORS_ORIGINS=https://admin-eta-woad-17.vercel.app,https://autocarex-production.up.railway.app
```

### 4. Make GitHub Repo Private
After Railway deployment is confirmed working:
1. Go to https://github.com/dheeru1706/autocareX/settings
2. Scroll to "Danger Zone" → Change visibility → Make private

---

## 📱 MOBILE APPS — STORE SUBMISSION

### Android (Play Store)
**Pre-requisite:** Firebase project needed first.

1. **Create Firebase project:**
   - Go to https://console.firebase.google.com
   - Create project "autocareX"
   - Add Android app with package `com.autocareX.app`
   - Download `google-services.json`
   - Replace `mobile/android/app/google-services.json` with real one
   - Update `GOOGLE_SERVICES_JSON` GitHub secret with real content

2. **Pay Play Store fee:**
   - Go to https://play.google.com/console
   - Pay $25 one-time fee
   - Create app: AutoCareX | Utility | Free

3. **GitHub Actions will auto-build AAB:**
   - Push any change to `mobile/` folder
   - Go to https://github.com/dheeru1706/autocareX/actions
   - Download the `autocareX-release-aab` artifact

4. **Upload AAB to Play Store:**
   - Internal Testing → Upload the .aab file
   - Fill store listing, screenshots, ratings questionnaire
   - Submit for review (2-7 days)

### iOS (App Store)
**Requires macOS with Xcode:**

1. **Pay Apple Developer fee:** $99/year at developer.apple.com
2. **Install full Xcode from App Store** (15GB download)
3. **Create Firebase iOS app** + download `GoogleService-Info.plist`
4. **Build:** `cd mobile && flutter build ipa --release`
5. **Upload with Transporter app** or `xcrun altool`
6. **Submit on App Store Connect**

---

## 🎯 CURRENT DEPLOYMENT ARCHITECTURE

```
Users
  │
  ├── Admin Panel ──► Vercel (https://admin-eta-woad-17.vercel.app)
  │                          │ VITE_API_URL points to Railway
  │
  ├── Mobile App  ──► Direct API calls to Railway backend
  │
  └── Backend     ──► Railway (https://autocarex-production.up.railway.app)
                        ├── PostgreSQL (Railway managed)
                        └── Redis (Railway managed)
```

---

## 🔑 IMPORTANT CREDENTIALS
*(Keep these safe — never share publicly)*

| Service | Credential | Value |
|---------|-----------|-------|
| Admin Panel | URL | https://admin-eta-woad-17.vercel.app |
| Admin Login | Email | admin@autocarex.in |
| Admin Login | Password | Admin@123 (change after first login!) |
| Railway | Project | autocareX-production.up.railway.app |
| Android Keystore | Password | AutoCareX@2024 |
| Android Keystore | Alias | autocareX |
| Android Keystore | File | mobile/autocareX.keystore |
