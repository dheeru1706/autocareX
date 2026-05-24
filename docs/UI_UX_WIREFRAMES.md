# AutoCareX UI/UX Wireframes & Design System

## Design Philosophy
- **Premium Dark**: Deep blacks (#0D0D0D), dark surfaces (#1A1A1A, #232323)
- **Gold Accent**: #F5C518 — used for CTAs, active states, highlights
- **Clean Typography**: Inter font family throughout
- **Card-based Layout**: Rounded corners (12px), subtle elevation shadows
- **Micro-animations**: 200-300ms transitions, spring physics
- **Automotive Feel**: Inspired by luxury car dashboards

---

## Color System

```
Primary Palette:
  Gold:      #F5C518  ████████
  Dark Gold: #D4A017  ████████
  
Background Palette:
  Base:      #0D0D0D  ████████
  Surface:   #1A1A1A  ████████
  Card:      #232323  ████████
  Elevated:  #2C2C2C  ████████
  
Text Palette:
  Primary:   #FFFFFF  ████████
  Secondary: #9E9E9E  ████████
  Muted:     #616161  ████████
  
Status Colors:
  Success:   #00C853  ████████
  Warning:   #FFB300  ████████
  Error:     #FF4444  ████████
  Info:      #2196F3  ████████
  
Status Badge Colors:
  Pending:   #FFB300 bg, #1A1A1A text
  Confirmed: #2196F3 bg, #FFFFFF text
  Active:    #00C853 bg, #FFFFFF text
  Cancelled: #FF4444 bg, #FFFFFF text
  Completed: #9E9E9E bg, #FFFFFF text
```

---

## Typography Scale

```
Display Large:   Inter 32px Bold    — App name, hero text
Display Medium:  Inter 28px Bold    — Screen titles
Headline Large:  Inter 24px SemiBold — Section headers
Headline Medium: Inter 20px SemiBold — Card titles
Title Large:     Inter 18px Medium   — List item titles
Title Medium:    Inter 16px Medium   — Sub-titles
Body Large:      Inter 16px Regular  — Main body text
Body Medium:     Inter 14px Regular  — Secondary body
Label Large:     Inter 14px SemiBold — Buttons, tags
Label Small:     Inter 12px Regular  — Captions, metadata
```

---

## Screen Wireframes

### 1. SPLASH SCREEN
```
┌─────────────────────────────┐
│                             │
│                             │
│                             │
│      ┌───────────────┐      │
│      │               │      │
│      │   [🚗 LOGO]   │      │  ← Gold car icon, animated
│      │               │      │
│      └───────────────┘      │
│                             │
│         AutoCareX           │  ← White, Display Large
│    Premium Car Care         │  ← Gold, Body Large
│                             │
│                             │
│                             │
│    ────────────────         │  ← Gold progress bar
└─────────────────────────────┘
Background: #0D0D0D
```

### 2. ONBOARDING (3 pages)
```
┌─────────────────────────────┐
│                      [Skip] │  ← Gold text
│                             │
│  ┌─────────────────────────┐│
│  │                         ││
│  │    [ILLUSTRATION]       ││  ← Car wash animation / lottie
│  │                         ││
│  └─────────────────────────┘│
│                             │
│   Premium Car Care          │  ← White, Headline Large
│   At Your Doorstep          │  ← Gold, smaller
│                             │
│   Expert technicians come   │  ← White, Body Medium
│   to your location. Save    │
│   time. Drive fresh.        │
│                             │
│       ● ○ ○                 │  ← Page indicator (gold active)
│                             │
│  ┌─────────────────────────┐│
│  │      GET STARTED        ││  ← Gold button, full width
│  └─────────────────────────┘│
└─────────────────────────────┘
```

### 3. LOGIN SCREEN
```
┌─────────────────────────────┐
│                             │
│   AutoCareX                 │  ← Logo + brand, top left
│                             │
│   Welcome back 👋           │  ← White, Display Medium
│   Sign in to continue       │  ← Grey, Body Large
│                             │
│  ┌──────┬──────────────────┐│
│  │ +91  │  Phone Number    ││  ← Dark card, gold focus border
│  └──────┴──────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │      SEND OTP           ││  ← Gold background, Black text
│  └─────────────────────────┘│
│                             │
│       ─────  OR  ─────      │
│                             │
│  ┌─────────────────────────┐│
│  │  [G] Continue with      ││  ← Dark card, white text
│  │       Google            ││
│  └─────────────────────────┘│
│                             │
│  By continuing you agree    │  ← Small grey text
│  to Terms & Privacy Policy  │
└─────────────────────────────┘
```

### 4. OTP VERIFICATION
```
┌─────────────────────────────┐
│  ←                          │  ← Back arrow (gold)
│                             │
│   Verify Phone              │  ← White, Display Medium
│   +91 98765 43210           │  ← Gold, number shown
│                             │
│  ┌─────────────────────────┐│
│  │  [_] [_] [_] [_] [_] [_]││  ← 6 digit OTP boxes
│  └─────────────────────────┘│
│   Active box: Gold border   │
│   Filled box: White text    │
│                             │
│   Resend OTP in 0:45        │  ← Grey countdown
│                             │
│  ┌─────────────────────────┐│
│  │       VERIFY OTP        ││  ← Gold button
│  └─────────────────────────┘│
│                             │
│   Didn't receive?           │
│   [Resend OTP]              │  ← Gold text (active after timer)
└─────────────────────────────┘
```

### 5. HOME DASHBOARD
```
┌─────────────────────────────┐
│  Hi, Rahul 👋   🔔  💰₹250 │  ← Wallet balance top right
│                             │
│  ┌─────────────────────────┐│
│  │ 🔍 Search services...   ││  ← Dark search bar
│  └─────────────────────────┘│
│                             │
│  [Car Wash] [Detail] [Insp] │  ← Scrollable chips, gold active
│  [Insurance] [Sell Car] +   │
│                             │
│  ╔══════════════════════╗   │
│  ║  SUMMER WASH SPECIAL ║   │  ← Promo banner carousel (gold)
│  ║  40% OFF this week   ║   │
│  ║  [Book Now]          ║   │
│  ╚══════════════════════╝   │
│  ● ○ ○                      │  ← Indicator dots
│                             │
│  Popular Services           │  ← Section header
│  ┌──────┐ ┌──────┐ ┌──────┐│
│  │  🚿  │ │  ✨  │ │  🔍  ││  ← Service cards
│  │ Wash │ │Detail│ │Inspct││
│  │₹299  │ │₹999  │ │₹499  ││
│  └──────┘ └──────┘ └──────┘│
│                             │
│  Your Vehicles              │
│  ┌───────────────────────┐  │
│  │ 🚗 Swift Dzire · DL01 │  │  ← Vehicle card
│  │    Petrol · 2022      │  │
│  └───────────────────────┘  │
│  [+ Add Vehicle]            │  ← Gold text button
│                             │
│  ┌─────────────────────────┐│  ← Active booking card
│  │ 🟡 Booking #AX1234      ││
│  │    Car Wash · Today 3PM ││
│  │    Rahul is on the way  ││
│  │    [Track Now]          ││
│  └─────────────────────────┘│
│─────────────────────────────│
│  🏠    📅    🏷️    👤       │  ← Bottom nav (gold active)
└─────────────────────────────┘
```

### 6. SERVICE PACKAGES
```
┌─────────────────────────────┐
│  ←  Car Wash Services       │
│                             │
│  Choose your package        │  ← Subtitle
│                             │
│  ╔═══════════════════════╗  │
│  ║ ⭐ MOST POPULAR        ║  │  ← Gold badge
│  ║ Premium Interior Wash  ║  │
│  ║ ₹499    ~~₹799~~       ║  │  ← Price + strike
│  ║ ⏱ 45 min               ║  │
│  ║                         ║  │
│  ║ ✅ Exterior foam wash   ║  │
│  ║ ✅ Interior vacuum      ║  │
│  ║ ✅ Dashboard wipe       ║  │
│  ║ ✅ Glass cleaning       ║  │
│  ║ ❌ Waxing               ║  │
│  ║                         ║  │
│  ║ [BOOK NOW]  [SUBSCRIBE] ║  │
│  ╚═══════════════════════╝  │
│                             │
│  ┌─────────────────────────┐│
│  │ Basic Exterior Wash     ││
│  │ ₹299 · 30 min          ││
│  │ [+] Expand             ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ Full Detail Package     ││
│  │ ₹1,999 · 120 min       ││
│  │ [+] Expand             ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

### 7. BOOKING FLOW - STEP 2 (Address)
```
┌─────────────────────────────┐
│  ←  Select Location         │
│  ── ─● ── ──                │  ← Progress: Step 2 of 5
│                             │
│  ┌─────────────────────────┐│
│  │     [Google Maps]       ││  ← Map with draggable pin
│  │                         ││
│  │          📍             ││
│  │                         ││
│  └─────────────────────────┘│
│                             │
│  📍 Confirmed Location:     │
│  ┌─────────────────────────┐│
│  │ 123, MG Road, Bangalore ││  ← Auto-filled from map
│  └─────────────────────────┘│
│                             │
│  Saved Addresses            │
│  ┌─────────────────────────┐│
│  │ 🏠 Home                 ││  ← Radio select
│  │    123 MG Road, BLR     ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 🏢 Office               ││
│  │    456 Koramangala, BLR ││
│  └─────────────────────────┘│
│  [+ Add New Address]        │
│                             │
│  ┌─────────────────────────┐│
│  │        CONTINUE →       ││  ← Gold button
│  └─────────────────────────┘│
└─────────────────────────────┘
```

### 8. BOOKING TRACKING
```
┌─────────────────────────────┐
│  ←  Booking #AX1234         │
│                             │
│  ┌─────────────────────────┐│
│  │     [Live Google Map]   ││  ← Map, gold car pin moving
│  │                         ││
│  │  🏎️ → → → 📍            ││
│  │                         ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ 👤 Rahul Kumar          ││
│  │    ⭐ 4.8  ·  423 jobs  ││
│  │    ETA: 12 minutes      ││
│  │                         ││
│  │  [📞 Call]  [💬 Chat]   ││
│  └─────────────────────────┘│
│                             │
│  Service Status             │
│  ● Booking Confirmed        │  ← Gold dot (completed)
│  ● Technician Assigned      │  ← Gold dot (completed)
│  ○ On the way      ← NOW   │  ← Pulsing gold dot
│  ○ Service Started          │  ← Grey dot
│  ○ Completed                │  ← Grey dot
│                             │
│  Start OTP: [4 2 7 8]       │  ← Show OTP to tech
└─────────────────────────────┘
```

### 9. MARKETPLACE - Car Listing
```
┌─────────────────────────────┐
│  ←  Used Cars (234)         │
│                             │
│  ┌─────────────────────────┐│
│  │ 🔍 Search cars...       ││
│  └─────────────────────────┘│
│  [Filter ▼]  [₹ Range]  ≡  │
│                             │
│  ┌─────────────────────────┐│  ← Car card
│  │ [CAR IMAGE]    📸 8     ││
│  │ 2021 Honda City ZX      ││
│  │ ₹8,50,000               ││  ← Price (gold)
│  │ AI estimate: ₹8.2-8.8L  ││  ← AI range
│  │ ──────────────────────  ││
│  │ 45,000 km · Petrol      ││
│  │ Excellent ● Score: 87   ││  ← Score badge
│  │ [📞 Enquire] [🔖 Save]  ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ [CAR IMAGE]             ││
│  │ 2020 Maruti Swift VXI   ││
│  │ ₹5,25,000               ││
│  └─────────────────────────┘│
│                             │
│  [Sell Your Car +]          │  ← Gold FAB
└─────────────────────────────┘
```

### 10. SUBSCRIPTION PLANS
```
┌─────────────────────────────┐
│  ←  Subscription Plans      │
│                             │
│  [Monthly]  [Yearly -20%]   │  ← Toggle, gold active
│                             │
│  ┌─────────────────────────┐│  ← Basic plan
│  │ BASIC                   ││
│  │ ₹999/month              ││
│  │ ──────────────────────  ││
│  │ ✅ 4 car washes/month   ││
│  │ ✅ Priority booking     ││
│  │ ✅ 10% discount         ││
│  │ ❌ Interior detailing   ││
│  │ ❌ Insurance assist     ││
│  │                         ││
│  │ [SELECT BASIC]          ││
│  └─────────────────────────┘│
│                             │
│  ╔══════════════════════╗   │  ← Premium (highlighted)
│  ║ ⭐ MOST POPULAR       ║   │
│  ║ PREMIUM               ║   │
│  ║ ₹1,999/month          ║   │  ← Gold text
│  ║ ───────────────────── ║   │
│  ║ ✅ 8 washes/month     ║   │
│  ║ ✅ 2 full details     ║   │
│  ║ ✅ Free inspection    ║   │
│  ║ ✅ Insurance assist   ║   │
│  ║ ✅ Dedicated manager  ║   │
│  ║                       ║   │
│  ║ [SELECT PREMIUM]      ║   │  ← Gold filled button
│  ╚══════════════════════╝   │
└─────────────────────────────┘
```

### 11. PARTNER DASHBOARD (Franchise App)
```
┌─────────────────────────────┐
│  AutoCareX Partner          │
│  SpeedWash BLR    ⭐ 4.7   │
│                             │
│  ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ 12  │ │ ₹8k │ │  3  │  │  ← KPI chips
│  │Jobs │ │Today│ │Pendg│  │
│  └─────┘ └─────┘ └─────┘  │
│                             │
│  New Bookings               │
│  ╔═══════════════════════╗  │
│  ║ 🔔 AX5678 · Car Wash  ║  │  ← Incoming alert
│  ║ Koramangala · 3:00PM  ║  │
│  ║ Honda City · ₹499     ║  │
│  ║ [✓ ACCEPT] [✗ DECLINE]║  │
│  ╚═══════════════════════╝  │
│                             │
│  Today's Schedule           │
│  ┌─────────────────────────┐│
│  │ 2PM  Rahul · AX1234    ││
│  │      Car Wash · Ongoing ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 4PM  Priya · AX5679    ││
│  │      Detailing · Upcoming││
│  └─────────────────────────┘│
│                             │
│  [Staff] [Earnings] [Report]│  ← Bottom nav
└─────────────────────────────┘
```

---

## Component Library

### Buttons
```
Primary (Gold Fill):
┌────────────────────────┐
│        BOOK NOW        │  bg:#F5C518, text:#000000, h:56px
└────────────────────────┘

Secondary (Gold Outline):
┌────────────────────────┐
│        LEARN MORE      │  border:#F5C518, text:#F5C518, h:48px
└────────────────────────┘

Danger (Red):
┌────────────────────────┐
│       CANCEL           │  bg:#FF4444, text:#FFFFFF, h:48px
└────────────────────────┘

Text Button:
  View All →              text:#F5C518, no bg
```

### Cards
```
Service Card (110×140):
┌──────────────┐
│   [icon]     │  bg:#232323, radius:12px
│   Car Wash   │  shadow: 0 4px 12px rgba(0,0,0,0.4)
│   ₹299       │  gold price
└──────────────┘

Booking Card:
┌─────────────────────────┐
│ 🟡 AX1234  [status]     │  bg:#1A1A1A, radius:16px
│ Car Wash · 3:00 PM     │  left border: 3px gold
│ DLH 123 · Honda City   │
│ [Track] [Cancel]        │
└─────────────────────────┘
```

### Status Badges
```
● Pending   → bg:#FFB30020, text:#FFB300, border:#FFB300
● Confirmed → bg:#2196F320, text:#2196F3, border:#2196F3
● Active    → bg:#00C85320, text:#00C853, border:#00C853
● Cancelled → bg:#FF444420, text:#FF4444, border:#FF4444
● Done      → bg:#9E9E9E20, text:#9E9E9E, border:#9E9E9E
```

### Input Fields
```
┌─────────────────────────────┐
│  Label                      │  ← White, 12px
│  ┌─────────────────────────┐│
│  │  Placeholder text       ││  ← bg:#232323, border:1px #2C2C2C
│  └─────────────────────────┘│  ← Focus: border:1px #F5C518
│  Error message here         │  ← Red, 12px (on error)
└─────────────────────────────┘
```

---

## Animation Guidelines

| Interaction | Animation | Duration | Easing |
|-------------|-----------|----------|--------|
| Screen transition | Slide right | 300ms | easeInOut |
| Bottom sheet open | Slide up | 250ms | spring |
| Card press | Scale 0.98 | 150ms | easeIn |
| Button tap | Scale 0.95 | 100ms | spring |
| Success state | Scale 1.0 → 1.1 → 1.0 | 400ms | bounce |
| Error shake | ±10px x3 | 300ms | linear |
| Loading shimmer | LTR gradient | 1200ms | linear loop |
| Notification pop | Drop from top | 300ms | spring |
| Tab switch | Crossfade | 200ms | easeOut |

---

## Icon System

Use Material Icons + custom automotive SVG set:
- 🚗 Car (sedan, SUV, hatchback variants)
- 🚿 Wash bucket/spray
- ✨ Sparkle (detailing)
- 🔍 Inspection magnifier
- 🛡️ Insurance shield
- 🏷️ Price tag
- 📱 Mobile/app
- 📍 Location pin (gold)
- ⭐ Rating star (gold fill)
- 🔔 Notification bell
- 💰 Wallet
- 👤 Profile
- 📅 Calendar
- ⏱ Clock
- ✅ Checkmark circle (success)
- ❌ X circle (error/missing)

---

*AutoCareX Design System v1.0 | 2026*
