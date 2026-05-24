# AutoCareX — App Store & Play Store Submission Guide

This guide walks you through building a signed release and submitting AutoCareX to both the Google Play Store and Apple App Store.

---

## Android — Google Play Store

### Step 1: Generate the Android Keystore

Run this command once and keep the generated file safe. Losing the keystore means you can never update the app under the same package name.

```bash
keytool -genkey -v \
  -keystore autocareX.keystore \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias autocareX
```

You will be prompted for:
- Keystore password (use a strong, memorable password — store it in a password manager)
- Key password (can be the same as keystore password)
- Your name, organisation, city, state, country code

Place the generated `autocareX.keystore` file in `mobile/android/` (one level above the `app/` folder).

### Step 2: Fill in key.properties

Copy the template and fill in your actual values:

```bash
cp mobile/android/key.properties.template mobile/android/key.properties
```

Edit `key.properties`:
```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=autocareX
storeFile=../autocareX.keystore
```

Never commit `key.properties` or `autocareX.keystore` to git. Add them to `.gitignore`:
```
mobile/android/key.properties
mobile/android/autocareX.keystore
```

### Step 3: Build the Release Android App Bundle (AAB)

```bash
cd mobile
flutter build appbundle --release
```

The output file will be at:
```
mobile/build/app/outputs/bundle/release/app-release.aab
```

This `.aab` file is what you upload to Play Store — it is smaller than an APK and allows Google to optimise the download for each device.

### Step 4: Create a Google Play Developer Account

1. Go to https://play.google.com/console
2. Sign in with a Google account (create a dedicated one for the business)
3. Pay the one-time $25 registration fee
4. Complete identity verification (takes 1-2 business days)

### Step 5: Create the App and Upload the AAB

1. In Play Console → "Create app"
2. App name: **AutoCareX - Car Care & Service**
3. Default language: **English (India)**
4. App or Game: **App**
5. Free or Paid: **Free**
6. Accept the declarations and click "Create app"
7. Go to **Production** → **Create new release** → Upload the `.aab` file
8. Fill in release notes (what's new in this version)

### Step 6: Complete the Store Listing

Use the content from `store-assets/play-store/listing.md`:
- App name, short description, full description
- Upload at least 2 screenshots per device type (phone required, tablet optional)
- Upload a feature graphic (1024 × 500 px)
- Set content rating: complete the questionnaire → **Everyone**
- Set category: **Auto & Vehicles**
- Add privacy policy URL: `https://autocareX.in/privacy`

### Step 7: Set Up Pricing and Distribution

- Pricing: **Free**
- Countries: Select **India** (or "All countries" if planning global)
- Confirm it does not contain ads (adjust if needed)

### Step 8: Submit for Review

- Go to **Publishing overview**
- Review all warnings and fix any blockers
- Click **Send for review**

Timeline: **1–3 business days** for initial review. Subsequent updates are typically reviewed within hours to 1 business day.

---

## iOS — Apple App Store

### Step 1: Enrol in Apple Developer Program

1. Go to https://developer.apple.com/programs/enroll/
2. Sign in with your Apple ID
3. Enrol as an **Individual** or **Organisation** (Organisation requires a D-U-N-S number — allow 1-2 weeks)
4. Pay the **$99/year** membership fee

### Step 2: Create an App ID and Provisioning

1. In Apple Developer portal → Certificates, IDs & Profiles → Identifiers
2. Register a new App ID: `com.autocareX.app`
3. Enable capabilities: Push Notifications, Associated Domains, Sign In with Apple (if used)
4. Xcode can manage signing automatically — set your Team in Xcode and let it create profiles

### Step 3: Configure Xcode

1. Open `mobile/ios/Runner.xcworkspace` in Xcode (use `.xcworkspace`, not `.xcodeproj`)
2. Select the **Runner** target
3. Under **Signing & Capabilities** → set **Team** to your Apple Developer team
4. Ensure **Bundle Identifier** is `com.autocareX.app`
5. Set **Version** and **Build** numbers (e.g., 1.0.0 / 1)

### Step 4: Archive and Upload via Xcode

```bash
cd mobile
flutter build ipa --release --export-options-plist=ios/ExportOptions.plist
```

Or use Xcode directly:
1. In Xcode: **Product** → **Archive** (make sure the scheme is set to "Runner" and destination is "Any iOS Device")
2. When the Organizer opens, select the archive → **Distribute App**
3. Choose **App Store Connect** → **Upload**
4. Follow the wizard — Xcode handles signing automatically

The IPA will be uploaded to App Store Connect.

### Step 5: Create the App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. **My Apps** → "+" → **New App**
3. Platform: **iOS**
4. Name: **AutoCareX**
5. Bundle ID: select `com.autocareX.app` from the dropdown
6. SKU: `autocareX-ios-v1` (internal reference, not shown to users)
7. User access: **Full access**

### Step 6: Fill the App Store Listing

Use the content from `store-assets/app-store/listing.md`:
- Name, subtitle, description, keywords, promotional text
- Upload screenshots for each required device size (iPhone 6.9" and 6.5" are mandatory)
- Upload app icon (1024 × 1024 px, no alpha channel)
- Set age rating: **4+**
- Category: **Lifestyle** (primary), **Travel** (secondary)
- Privacy policy URL: `https://autocareX.in/privacy`
- Support URL: `https://autocareX.in/support`

### Step 7: Select the Build and Submit

1. Under **Build** section in the App Store listing → select the uploaded build
2. Complete the **Export Compliance** questionnaire (the app uses HTTPS — answer accordingly)
3. Complete **Advertising Identifier** (IDFA) — if not using ad tracking, select "No"
4. Click **Submit for Review**

Timeline: **1–7 business days** for initial review (Apple's review time varies). Check https://developer.apple.com/system-status/ for review queue status.

---

## Post-Submission Checklist

- [ ] Monitor email for review feedback from Apple / Google
- [ ] Set up crash reporting (Firebase Crashlytics is already configured)
- [ ] Enable Google Play's pre-launch report to catch device-specific issues
- [ ] Prepare App Store promotional assets (preview video, feature graphic)
- [ ] Update the privacy policy page at `autocareX.in/privacy` before submission
- [ ] Test deep links (`autocareX://` scheme and `https://autocareX.in`) on a physical device
- [ ] Verify Razorpay live keys are active and webhook is configured
- [ ] Confirm push notifications work on a physical device (not simulator/emulator)

---

## Useful Commands Reference

```bash
# Build Android AAB (production)
flutter build appbundle --release

# Build Android APK (for testing — not for Play Store)
flutter build apk --release --split-per-abi

# Build iOS IPA (production)
flutter build ipa --release --export-options-plist=ios/ExportOptions.plist

# Check Flutter environment
flutter doctor -v

# Clean build cache
flutter clean && flutter pub get
```
