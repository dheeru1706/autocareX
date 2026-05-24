# AutoCareX — Credentials Setup Guide

All infrastructure is built. Follow these steps to plug in real credentials
and submit both apps to the stores.

---

## 1. Firebase (Push Notifications, Analytics)

### Step A — Create a Firebase project
1. Go to https://console.firebase.google.com
2. Click **Add project** → name it **AutoCareX** → Continue
3. Enable Google Analytics → Continue → Create project

### Step B — Add the Android app
1. In the project overview, click the **Android** icon (➕)
2. Package name: `com.autocareX.app`
3. App nickname: AutoCareX
4. Click **Register app**
5. Download `google-services.json`
6. Replace `mobile/android/app/google-services.json` with the downloaded file
7. Add this file content as GitHub secret **`GOOGLE_SERVICES_JSON`**

### Step C — Add the iOS app
1. Click **➕ Add app** → **iOS**
2. Bundle ID: `com.autocareX.app`
3. App nickname: AutoCareX
4. Click **Register app**
5. Download `GoogleService-Info.plist`
6. Replace `mobile/ios/Runner/GoogleService-Info.plist` with the downloaded file
7. Add this file content as GitHub secret **`GOOGLE_SERVICES_IOS_PLIST`**

### Step D — Enable Firebase services
In the Firebase console, enable:
- **Authentication** → Sign-in methods → Phone (for OTP)
- **Cloud Messaging** → (enabled by default, needed for push notifications)
- **Analytics** → (enabled by default)

---

## 2. Google Maps API Key

### Step A — Get the key
1. Go to https://console.cloud.google.com
2. Select (or create) the same project linked to Firebase
3. Go to **APIs & Services → Library**
4. Enable:
   - **Maps SDK for Android**
   - **Maps SDK for iOS**
   - **Places API** (for address autocomplete)
   - **Directions API** (for routing)
5. Go to **APIs & Services → Credentials → Create Credentials → API Key**
6. Restrict the key:
   - Android: restrict to `com.autocareX.app`
   - iOS: restrict to `com.autocareX.app`

### Step B — Add to GitHub Secrets
Secret name: **`GOOGLE_MAPS_API_KEY`**

### Step C — Android Manifest (already wired)
The key is already referenced in `AndroidManifest.xml`:
```xml
<meta-data android:name="com.google.android.geo.API_KEY"
           android:value="${GOOGLE_MAPS_API_KEY}"/>
```
No code change needed — it reads from the Gradle property injected by CI.

### Step D — iOS (add to AppDelegate)
Open `mobile/ios/Runner/AppDelegate.swift` and add:
```swift
import GoogleMaps
// Inside application(_:didFinishLaunchingWithOptions:):
GMSServices.provideAPIKey("YOUR_GOOGLE_MAPS_API_KEY")
```

---

## 3. Razorpay

### Step A — Get the key
1. Go to https://dashboard.razorpay.com
2. **Settings → API Keys → Generate Test Key** (for testing)
3. When ready for production: **Generate Live Key**
4. Your key ID looks like: `rzp_live_XXXXXXXXXXXX`

### Step B — Add to GitHub Secrets
Secret name: **`RAZORPAY_KEY_ID`**

The app reads it from `--dart-define=RAZORPAY_KEY_ID=...` at build time — no
code change needed.

---

## 4. Android Play Store

### Step A — Create account ($25 one-time)
1. Go to https://play.google.com/console
2. Pay the $25 registration fee
3. Complete the developer profile

### Step B — Upload the signed AAB
1. Go to GitHub Actions → **Build Android APK / AAB** → run it manually
2. Download the `.aab` artifact
3. In Play Console: **Create app → Upload the AAB** to Internal Testing first
4. Gradually promote: Internal → Closed → Open → Production

### Step C — Store listing
Ready-made listing copy is in `store-assets/play-store/listing.md`

### Step D — Required GitHub secrets for CI
| Secret | Value |
|--------|-------|
| `KEYSTORE_BASE64` | `base64 < mobile/autocareX.keystore` |
| `KEY_STORE_PASSWORD` | From `mobile/android/key.properties` |
| `KEY_PASSWORD` | From `mobile/android/key.properties` |
| `KEY_ALIAS` | From `mobile/android/key.properties` (default: `autocareX`) |

---

## 5. Apple App Store (iOS)

### Step A — Enroll ($99/year)
1. Go to https://developer.apple.com/programs/
2. Enroll with your Apple ID
3. Note your **10-character Team ID** (shown in Membership details)

### Step B — Create App ID
1. https://developer.apple.com/account/ → Identifiers → +
2. Bundle ID: `com.autocareX.app`

### Step C — Create certificates
In Xcode (on your Mac):
1. **Xcode → Preferences → Accounts → Manage Certificates**
2. Create an **Apple Distribution** certificate
3. Export as `.p12` → base64 encode it:
   ```bash
   base64 -i certificate.p12 | pbcopy
   ```
4. Add as GitHub secret **`IOS_CERTIFICATE_P12`**
5. Add the certificate password as **`IOS_CERTIFICATE_PASSWORD`**

### Step D — Create provisioning profile
1. https://developer.apple.com/account/ → Profiles → +
2. Type: **App Store Connect**
3. Select the `com.autocareX.app` App ID
4. Download → base64 encode:
   ```bash
   base64 -i autocareX.mobileprovision | pbcopy
   ```
5. Add as GitHub secret **`IOS_PROVISIONING_PROFILE`**

### Step E — Create the App in App Store Connect
1. https://appstoreconnect.apple.com → My Apps → +
2. Bundle ID: `com.autocareX.app`
3. Fill in the store listing (copy from `store-assets/app-store/listing.md`)

### Step F — Required GitHub secrets for iOS CI
| Secret | Value |
|--------|-------|
| `IOS_CERTIFICATE_P12` | base64-encoded .p12 file |
| `IOS_CERTIFICATE_PASSWORD` | Certificate password |
| `IOS_PROVISIONING_PROFILE` | base64-encoded .mobileprovision |
| `APPLE_TEAM_ID` | Your 10-char Team ID |
| `GOOGLE_SERVICES_IOS_PLIST` | Contents of GoogleService-Info.plist |

---

## 6. GitHub Secrets Summary

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Source | Used by |
|--------|--------|---------|
| `KEYSTORE_BASE64` | `base64 < mobile/autocareX.keystore` | Android CI |
| `KEY_STORE_PASSWORD` | key.properties | Android CI |
| `KEY_PASSWORD` | key.properties | Android CI |
| `KEY_ALIAS` | key.properties | Android CI |
| `GOOGLE_SERVICES_JSON` | Firebase Android download | Android CI |
| `GOOGLE_SERVICES_IOS_PLIST` | Firebase iOS download | iOS CI |
| `GOOGLE_MAPS_API_KEY` | Google Cloud Console | Both |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard | Both |
| `IOS_CERTIFICATE_P12` | Xcode export | iOS CI |
| `IOS_CERTIFICATE_PASSWORD` | Certificate password | iOS CI |
| `IOS_PROVISIONING_PROFILE` | Apple Developer Portal | iOS CI |
| `APPLE_TEAM_ID` | Apple Developer Membership | iOS CI |

---

## 7. Current Build Status

| Component | Status |
|-----------|--------|
| App icons (Android + iOS) | ✅ Generated |
| Android build system | ✅ Ready |
| iOS CI/CD workflow | ✅ Written |
| LaunchScreen | ✅ Custom (dark + AutoCareX logo) |
| Backend URL | ✅ Production Railway |
| Firebase configs | ⏳ Needs real credentials (Step 1) |
| Google Maps key | ⏳ Needs key (Step 2) |
| Razorpay key | ⏳ Needs key (Step 3) |
| Play Store account | ⏳ Needs $25 (Step 4) |
| Apple Developer account | ⏳ Needs $99/yr (Step 5) |
