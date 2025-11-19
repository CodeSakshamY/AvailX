# LocalPro Connect — Complete UI/UX Design System

**Version:** 1.0
**Design Philosophy:** Minimal, Clean, Trust-First
**Target Users:** Indian service marketplace (Tier 2/3 cities)

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [User Journey Maps](#2-user-journey-maps)
3. [Customer App Wireframes](#3-customer-app-wireframes)
4. [Provider App Wireframes](#4-provider-app-wireframes)
5. [Admin Dashboard Wireframes](#5-admin-dashboard-wireframes)
6. [Component Library](#6-component-library)
7. [Microcopy & Labels](#7-microcopy--labels)
8. [Trust-Building UX Rules](#8-trust-building-ux-rules)
9. [Accessibility & Localization](#9-accessibility--localization)

---

## 1. Design Principles

### 1.1 Core Principles

**Clarity Over Cleverness**
- Simple language (6th-grade reading level)
- Clear visual hierarchy
- One primary action per screen

**Trust Through Transparency**
- Show verification badges prominently
- Display real photos (no stock images)
- Transparent pricing (no hidden fees)
- Real reviews with dates and verified badges

**Mobile-First Design**
- Touch-friendly targets (min 44×44px)
- Thumb-zone optimization
- Offline-first for critical actions
- Fast load times (<2s on 3G)

**Inclusive Design**
- Multilingual by default (Hindi + English)
- High contrast for outdoor visibility
- Simple icons with labels
- Support for low-end Android devices

### 1.2 Color System

```
Primary Colors:
  - Brand Blue: #2563EB (trust, professionalism)
  - Success Green: #10B981 (verified, completed)
  - Warning Orange: #F59E0B (pending, caution)
  - Error Red: #EF4444 (cancelled, error)

Neutral Colors:
  - Gray 900: #111827 (headings)
  - Gray 700: #374151 (body text)
  - Gray 400: #9CA3AF (secondary text)
  - Gray 100: #F3F4F6 (backgrounds)
  - White: #FFFFFF

Semantic Colors:
  - Aadhaar Verified: #059669 (government green)
  - Background Check: #7C3AED (premium purple)
  - Top Rated: #F59E0B (gold)
```

### 1.3 Typography

```
Font Family: Inter (system fallback: -apple-system, Roboto, sans-serif)

Headings:
  - H1: 32px / 700 / -0.02em
  - H2: 24px / 600 / -0.01em
  - H3: 20px / 600 / 0
  - H4: 18px / 600 / 0

Body:
  - Large: 16px / 400 / 0
  - Regular: 14px / 400 / 0
  - Small: 12px / 400 / 0

Special:
  - Button: 14px / 500 / 0.01em (uppercase)
  - Caption: 12px / 400 / 0.02em
```

---

## 2. User Journey Maps

### 2.1 Customer Journey: First-Time User to Completed Booking

```
STAGE 1: DISCOVERY (Day 0)
┌─────────────────────────────────────────────────────────────┐
│ Touchpoint: Social media ad / Friend referral              │
│ Action: Downloads app                                       │
│ Emotion: Curious, Skeptical                                │
│ Pain Point: "Is this app trustworthy?"                     │
│ Solution: Clear value prop on app store listing            │
└─────────────────────────────────────────────────────────────┘
                            ↓
STAGE 2: ONBOARDING (5 minutes)
┌─────────────────────────────────────────────────────────────┐
│ Screen 1: Welcome                                           │
│   - "Find trusted local service providers"                 │
│   - "100% verified professionals in Lucknow"               │
│   - Skip button (browsing without signup)                  │
│                                                             │
│ Screen 2: Phone Number                                     │
│   - "Enter your mobile number"                            │
│   - "+91 |___________|"                                   │
│   - "We'll send an OTP"                                   │
│   - Privacy note: "We never share your number"           │
│                                                             │
│ Screen 3: OTP Verification                                 │
│   - "Enter 6-digit code sent to +91-98******12"          │
│   - Auto-detect OTP (Android)                             │
│   - "Didn't receive? Resend in 30s"                       │
│                                                             │
│ Screen 4: Basic Info                                       │
│   - "What should we call you?" [Name]                     │
│   - "Where are you located?" [Location picker]           │
│   - Skip button (complete later)                          │
│                                                             │
│ Emotion: Cautiously Optimistic                             │
│ Metrics: 70% completion rate (target)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
STAGE 3: FIRST SEARCH (2 minutes)
┌─────────────────────────────────────────────────────────────┐
│ Home Screen:                                                │
│   ┌─────────────────────────────────────┐                 │
│   │ 🔍 What service do you need?        │                 │
│   └─────────────────────────────────────┘                 │
│                                                             │
│   Popular Services:                                         │
│   [🔧 Plumber] [💡 Electrician] [🛠️ Carpenter]            │
│                                                             │
│   User Types: "plumber"                                   │
│   → Autocomplete: "Plumber near me" ⭐                    │
│                                                             │
│ Results Screen (15 providers):                             │
│   ┌─────────────────────────────────────┐                 │
│   │ [Photo] Rajesh Kumar                │                 │
│   │ ⭐ 4.8 (127 reviews) • 2.3 km       │                 │
│   │ ✓ Aadhaar Verified                  │                 │
│   │ ₹300/hr • Available Now              │                 │
│   │ [View Profile] [Book Now →]         │                 │
│   └─────────────────────────────────────┘                 │
│                                                             │
│ Emotion: Impressed, Comparing Options                      │
│ Decision Factors: Rating, Distance, Price, Verification   │
└─────────────────────────────────────────────────────────────┘
                            ↓
STAGE 4: PROVIDER PROFILE (3 minutes)
┌─────────────────────────────────────────────────────────────┐
│ Header:                                                     │
│   [Photo] Rajesh Kumar - Master Plumber                   │
│   ⭐ 4.8 (127 reviews) • 5 years experience               │
│   ✓ Aadhaar Verified  ✓ Background Checked               │
│   [💬 Chat] [📞 Call] [📅 Book]                         │
│                                                             │
│ About:                                                      │
│   "Expert in pipe fitting, leak repair, bathroom          │
│   installation. Fast response, quality work guaranteed."  │
│                                                             │
│ Services & Pricing:                                         │
│   • Leak Repair: ₹300-500                                 │
│   • Bathroom Fitting: ₹2000-5000                          │
│   • Emergency Service: ₹500/hr                            │
│                                                             │
│ Portfolio (4 photos):                                       │
│   [Before/After bathroom] [Pipe work] [etc]               │
│                                                             │
│ Reviews (showing 3 of 127):                                │
│   ┌─────────────────────────────────────┐                 │
│   │ Amit S. ⭐⭐⭐⭐⭐ 2 days ago         │                 │
│   │ "Excellent work! Fixed my leaking   │                 │
│   │ bathroom in 2 hours. Very polite."  │                 │
│   │ [📷 Photo]                           │                 │
│   └─────────────────────────────────────┘                 │
│                                                             │
│ Trust Signal: "Rajesh has completed 340+ jobs with       │
│ 95% 5-star ratings"                                       │
│                                                             │
│ Emotion: Building Trust, Ready to Book                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
STAGE 5: BOOKING (2 minutes)
┌─────────────────────────────────────────────────────────────┐
│ Booking Form:                                               │
│   Service: [Dropdown: Leak Repair ▼]                      │
│   Date: [Calendar: Tomorrow, Jan 15 ▼]                    │
│   Time: [Slots: 10 AM-12 PM ✓]                           │
│   Location: [Current location] [Change]                   │
│   Additional Info (optional):                              │
│   [Textarea: Kitchen sink leaking...]                     │
│                                                             │
│   Estimated Price: ₹400                                    │
│   Payment: After service ✓                                │
│                                                             │
│   [← Back] [Send Request →]                               │
│                                                             │
│ Confirmation:                                               │
│   ✓ Booking request sent to Rajesh                        │
│   "You'll get a response in ~10 minutes"                  │
│   [Track Status] [Chat with Provider]                     │
│                                                             │
│ Emotion: Relieved, Anticipating Response                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
STAGE 6: WAIT FOR ACCEPTANCE (10 minutes)
┌─────────────────────────────────────────────────────────────┐
│ Push Notification:                                          │
│   "🎉 Rajesh accepted your booking!"                       │
│                                                             │
│ Booking Detail Screen:                                      │
│   Status: ✓ Confirmed                                      │
│   Provider: Rajesh Kumar [💬 Chat]                        │
│   When: Tomorrow, Jan 15 at 10 AM                         │
│   Where: [Map showing your location]                      │
│   Price: ₹400 (pay after service)                         │
│                                                             │
│   Reminder: "We'll remind you 1 hour before"              │
│   [Add to Calendar] [Track Provider]                      │
│                                                             │
│ Emotion: Excited, Slightly Anxious                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
STAGE 7: SERVICE DAY (Next day, 10 AM)
┌─────────────────────────────────────────────────────────────┐
│ 9 AM - Reminder Notification:                              │
│   "Reminder: Rajesh will arrive at 10 AM"                 │
│                                                             │
│ 9:45 AM - Provider Update:                                 │
│   "Rajesh is on the way 📍"                               │
│   [Track Live Location on Map]                            │
│   ETA: 15 minutes                                          │
│                                                             │
│ 10:00 AM - Service Started:                                │
│   "Rajesh marked job as started"                          │
│   Timer: 00:15:30 elapsed                                  │
│   [💬 Chat if needed]                                     │
│                                                             │
│ 11:30 AM - Service Completed:                              │
│   "Rajesh marked job as complete"                         │
│   Final Amount: ₹400                                       │
│   [I confirm it's complete ✓]                             │
│                                                             │
│ Emotion: Satisfied, Grateful                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
STAGE 8: PAYMENT & REVIEW (5 minutes)
┌─────────────────────────────────────────────────────────────┐
│ Payment Screen:                                             │
│   How did you pay?                                         │
│   [ ] Cash (₹400)                                         │
│   [ ] UPI (scan QR below)                                 │
│   [Rajesh's UPI QR Code]                                  │
│                                                             │
│   After payment:                                           │
│   "Mark payment as received ✓"                            │
│                                                             │
│ Review Screen:                                              │
│   How was your experience?                                 │
│   [⭐⭐⭐⭐⭐] 5 stars                                       │
│                                                             │
│   Rate by category:                                        │
│   Quality: [⭐⭐⭐⭐⭐]                                      │
│   Punctuality: [⭐⭐⭐⭐⭐]                                  │
│   Professionalism: [⭐⭐⭐⭐⭐]                              │
│                                                             │
│   Write a review (optional):                               │
│   [Textarea: Great work, very professional...]            │
│                                                             │
│   Add photos (optional):                                   │
│   [📷 Add photos]                                         │
│                                                             │
│   [Skip] [Submit Review →]                                │
│                                                             │
│ Confirmation:                                               │
│   ✓ Thank you for your review!                            │
│   "Want to book Rajesh again?"                            │
│   [Yes, Book Again] [Browse Other Providers]              │
│                                                             │
│ Emotion: Happy, Likely to Recommend                        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Provider Journey: Signup to First Booking

```
STAGE 1: DISCOVERY & SIGNUP (Day 0, 15 minutes)
┌─────────────────────────────────────────────────────────────┐
│ Landing: "Join as a Service Provider"                      │
│   Benefits:                                                 │
│   • Find customers in your area                            │
│   • Build your reputation online                           │
│   • Get paid for every job                                 │
│   • Free to join!                                          │
│                                                             │
│   [Join Now →]                                             │
│                                                             │
│ Signup Flow:                                                │
│   1. Phone + OTP (same as customer)                       │
│   2. Role: "I'm a Service Provider"                       │
│   3. Category: [Dropdown: Plumber ▼]                      │
│   4. Sub-services:                                         │
│      ☑ Leak Repair                                        │
│      ☑ Bathroom Fitting                                   │
│      ☑ Pipe Installation                                  │
│                                                             │
│ Emotion: Hopeful, Curious about Opportunity                │
└─────────────────────────────────────────────────────────────┘
                            ↓
STAGE 2: PROFILE SETUP (20 minutes)
┌─────────────────────────────────────────────────────────────┐
│ Profile Wizard (5 steps):                                   │
│                                                             │
│ Step 1: Basic Info                                         │
│   Your Name: [Rajesh Kumar]                               │
│   Business Name: [Master Plumber Services]                │
│   Experience: [5 years ▼]                                 │
│   [Next →]                                                 │
│                                                             │
│ Step 2: Service Area                                       │
│   Where do you provide services?                          │
│   Base Location: [Gomti Nagar, Lucknow]                  │
│   Service Radius: [10 km ▼]                              │
│   Or select pincodes: [+ Add]                            │
│   [Next →]                                                 │
│                                                             │
│ Step 3: Pricing                                            │
│   How do you charge?                                      │
│   ( ) Hourly Rate: ₹___/hr                               │
│   (✓) Per Job: ₹300-500                                  │
│   ( ) Custom Quote                                        │
│   [Next →]                                                 │
│                                                             │
│ Step 4: Photos                                             │
│   Upload your profile photo:                              │
│   [📷 Upload] (required)                                  │
│                                                             │
│   Portfolio (optional but recommended):                    │
│   [+ Add Work Photos]                                     │
│   Tip: Photos increase bookings by 3x!                    │
│   [Next →]                                                 │
│                                                             │
│ Step 5: Verification (CRITICAL)                            │
│   Verify your identity to gain customer trust:            │
│                                                             │
│   Aadhaar Verification (Required):                         │
│   Enter Aadhaar: [____-____-____]                        │
│   → OTP to registered mobile                              │
│   → Auto-fill name, DOB                                   │
│   ✓ Aadhaar Verified Badge unlocked!                     │
│                                                             │
│   Background Check (Optional, ₹500):                      │
│   [ ] Police verification (takes 3-5 days)               │
│   Benefits: +50% more bookings                            │
│   [Skip for now] [Verify Now ₹500]                       │
│                                                             │
│   [Submit Profile →]                                       │
│                                                             │
│ Emotion: Proud, Invested Time                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
STAGE 3: APPROVAL WAIT (1-2 hours)
┌─────────────────────────────────────────────────────────────┐
│ Pending Screen:                                             │
│   ⏳ Profile Under Review                                  │
│   "Our team is verifying your profile"                    │
│   Estimated time: 1-2 hours                                │
│                                                             │
│   While you wait:                                          │
│   • Watch: "How to get your first booking" [▶ Video]     │
│   • Read: "Tips for 5-star reviews"                       │
│   • Prepare: "What customers look for"                    │
│                                                             │
│ Push Notification (90 min later):                          │
│   "🎉 Your profile is approved! You're live!"             │
│                                                             │
│ Emotion: Anxious → Excited                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
STAGE 4: FIRST BOOKING REQUEST (Same day, 3 PM)
┌─────────────────────────────────────────────────────────────┐
│ Push Notification:                                          │
│   "🔔 New booking request from Amit!"                      │
│                                                             │
│ Booking Request Screen:                                     │
│   New Request #BK-2025-001234                              │
│                                                             │
│   Customer: Amit Sharma                                    │
│   ⭐ New customer (0 bookings)                            │
│                                                             │
│   Service: Leak Repair                                     │
│   When: Tomorrow, Jan 15 at 10 AM                         │
│   Where: Sector 12, Gomti Nagar (2.3 km away)             │
│   [View on Map]                                            │
│                                                             │
│   Customer Note:                                           │
│   "Kitchen sink is leaking badly, needs urgent repair"    │
│                                                             │
│   Estimated Earnings: ₹400                                 │
│                                                             │
│   Response Time: ⏱ 8 min left (10 min deadline)          │
│   Tip: Fast response = higher ranking!                    │
│                                                             │
│   [Reject] [💬 Chat First] [Accept ✓]                    │
│                                                             │
│ Emotion: Nervous, Excited for First Job                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Customer App Wireframes

### Screen 1: Home / Search

```
┌─────────────────────────────────────┐
│ LocalPro  [🔔3]  [👤Profile]        │
├─────────────────────────────────────┤
│                                     │
│ 📍 Gomti Nagar, Lucknow [Change]   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔍 What service do you need?    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Popular Services                    │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │  🔧  │ │  💡  │ │  🛠️  │         │
│ │Plumber│ │Elect-│ │Carpe-│         │
│ │      │ │rician│ │nter  │         │
│ └──────┘ └──────┘ └──────┘         │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │  🧹  │ │  💆  │ │  📚  │         │
│ │Clean │ │Salon │ │Tutor │         │
│ └──────┘ └──────┘ └──────┘         │
│                                     │
│ Recent Bookings                     │
│ ┌─────────────────────────────────┐ │
│ │ [Photo] Rajesh Kumar            │ │
│ │ Leak Repair • Completed         │ │
│ │ Jan 15 • ₹400                   │ │
│ │ [Book Again] [Review]           │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ [🏠 Home] [📋 Bookings] [💬] [👤]  │
└─────────────────────────────────────┘
```

### Screen 2: Search Results

```
┌─────────────────────────────────────┐
│ ← Plumbers near you                 │
├─────────────────────────────────────┤
│ [Filter] [Sort: Relevance ▼]        │
│                                     │
│ 15 providers found                  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Photo] Rajesh Kumar            │ │
│ │ Master Plumber                  │ │
│ │ ⭐ 4.8 (127) • 2.3 km           │ │
│ │ ✓ Aadhaar ✓ Background          │ │
│ │ ₹300-500 • Available Now         │ │
│ │ "Expert in leak repair..."      │ │
│ │ [View Profile] [Book Now →]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Photo] Suresh Yadav            │ │
│ │ Plumbing Services               │ │
│ │ ⭐ 4.5 (82) • 3.1 km            │ │
│ │ ✓ Aadhaar                       │ │
│ │ ₹250-400 • Available Tomorrow   │ │
│ │ [View Profile] [Book Now →]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Load More...]                      │
│                                     │
└─────────────────────────────────────┘
```

### Screen 3: Provider Profile

```
┌─────────────────────────────────────┐
│ ← Provider Profile        [⋮ More]  │
├─────────────────────────────────────┤
│ ┌───────────────────────────────┐   │
│ │     [Large Profile Photo]      │   │
│ └───────────────────────────────┘   │
│                                     │
│ Rajesh Kumar                        │
│ Master Plumber • 5 years exp        │
│ ⭐ 4.8 (127 reviews)                │
│                                     │
│ ✓ Aadhaar Verified                  │
│ ✓ Background Checked                │
│ ⚡ Quick Responder (< 10 min)       │
│                                     │
│ ┌─────┐ ┌─────┐ ┌─────┐           │
│ │💬Chat│ │📞Call│ │📅Book│           │
│ └─────┘ └─────┘ └─────┘           │
│                                     │
│ ─── About ───                       │
│ Expert in pipe fitting, leak        │
│ repair, bathroom installation.      │
│ Fast response, quality work         │
│ guaranteed. 340+ successful jobs.   │
│                                     │
│ ─── Services & Pricing ───          │
│ • Leak Repair: ₹300-500             │
│ • Bathroom Fitting: ₹2000-5000      │
│ • Emergency Service: ₹500/hr        │
│                                     │
│ ─── Portfolio ───                   │
│ [Photo] [Photo] [Photo] [+5 more]   │
│                                     │
│ ─── Reviews (127) ───               │
│ ┌─────────────────────────────────┐ │
│ │ Amit S. ⭐⭐⭐⭐⭐ 2 days ago     │ │
│ │ Excellent work! Fixed my         │ │
│ │ leaking bathroom in 2 hours.     │ │
│ │ Very polite and professional.    │ │
│ │ [Photo attached]                 │ │
│ │ 👍 Helpful (12)                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [See All Reviews →]                 │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │          [Book Now →]            │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Screen 4: Booking Form

```
┌─────────────────────────────────────┐
│ ← Book Service                      │
├─────────────────────────────────────┤
│ Provider: Rajesh Kumar              │
│ ⭐ 4.8 • ₹300-500                   │
│                                     │
│ Service Type *                      │
│ ┌─────────────────────────────────┐ │
│ │ Leak Repair              ▼      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ When do you need the service? *     │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │Tomorrow│ │Jan 16│ │Jan 17│         │
│ └──────┘ └──────┘ └──────┘         │
│                                     │
│ Time Slot *                         │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │ 8-10AM│ │10-12PM│ │ 2-4PM│         │
│ └──────┘ └──────┘ └──────┘         │
│                                     │
│ Service Location *                  │
│ ┌─────────────────────────────────┐ │
│ │ 📍 Current Location              │ │
│ │ Sector 12, Gomti Nagar           │ │
│ │ [Change Location]                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Describe the problem (optional)     │
│ ┌─────────────────────────────────┐ │
│ │ Kitchen sink is leaking...       │ │
│ │                                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ─── Pricing ───                     │
│ Estimated Cost: ₹400                │
│ Payment: After service completion   │
│                                     │
│ ✓ I agree to Terms & Conditions     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │        Send Booking Request      │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Screen 5: Active Booking

```
┌─────────────────────────────────────┐
│ ← Booking Details      [⋮ Options]  │
├─────────────────────────────────────┤
│ Status: ✓ Confirmed                 │
│ Booking #BK-2025-001234             │
│                                     │
│ ─── Provider ───                    │
│ ┌─────────────────────────────────┐ │
│ │ [Photo] Rajesh Kumar     [💬]   │ │
│ │ Master Plumber                   │ │
│ │ ⭐ 4.8 (127 reviews)             │ │
│ │ ☎ Tap to call                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ─── Service Details ───             │
│ Service: Leak Repair                │
│ Date: Tomorrow, Jan 15              │
│ Time: 10:00 AM - 12:00 PM           │
│ Price: ₹400                         │
│                                     │
│ ─── Location ───                    │
│ ┌───────────────────────────────┐   │
│ │    [Map showing location]      │   │
│ │    📍 Your Location            │   │
│ └───────────────────────────────┘   │
│ Sector 12, Gomti Nagar              │
│                                     │
│ ─── Timeline ───                    │
│ ✓ Booking created - 2 hours ago     │
│ ✓ Provider accepted - 1 hour ago    │
│ ⏳ Service tomorrow at 10 AM        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │      Track Provider Live         │ │
│ │      (Available on service day)  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │      💬 Chat with Provider       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Cancel Booking]                    │
│                                     │
└─────────────────────────────────────┘
```

---

## 4. Provider App Wireframes

### Screen 1: Dashboard

```
┌─────────────────────────────────────┐
│ LocalPro Provider  [🔔5]  [☰Menu]   │
├─────────────────────────────────────┤
│ Welcome back, Rajesh! 👋            │
│                                     │
│ ─── Today's Schedule ───            │
│ ┌─────────────────────────────────┐ │
│ │ 10:00 AM - Leak Repair          │ │
│ │ Amit Sharma • 2.3 km            │ │
│ │ [View Details →]                │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 2:00 PM - Bathroom Fitting      │ │
│ │ Priya Gupta • 4.1 km            │ │
│ │ [View Details →]                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ─── Quick Stats ───                 │
│ This Week                           │
│ ┌────────┐ ┌────────┐ ┌────────┐  │
│ │   8    │ │  ⭐4.9  │ │ ₹3,200 │  │
│ │ Jobs   │ │ Rating │ │Earnings│  │
│ └────────┘ └────────┘ └────────┘  │
│                                     │
│ ─── Pending Requests (2) ───        │
│ ┌─────────────────────────────────┐ │
│ │ 🔔 New Request - 5 min ago      │ │
│ │ Leak Repair • Tomorrow 10 AM    │ │
│ │ ⏱ Respond in 5 min               │ │
│ │ [View →]                        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ─── Profile Score ───               │
│ 🏆 Reputation: 95/100               │
│ Tips to improve:                    │
│ • Add 2 more portfolio photos       │
│ • Complete background verification  │
│                                     │
├─────────────────────────────────────┤
│ [🏠 Home] [📋 Jobs] [💬] [📊Stats] │
└─────────────────────────────────────┘
```

### Screen 2: Booking Request

```
┌─────────────────────────────────────┐
│ ← New Booking Request               │
├─────────────────────────────────────┤
│ ⏱ Response Time: 7 min left         │
│ (10 min deadline for best ranking)  │
│                                     │
│ ─── Customer ───                    │
│ ┌─────────────────────────────────┐ │
│ │ [Photo] Amit Sharma              │ │
│ │ ⭐ New Customer (0 bookings)     │ │
│ │ ☎ +91-98******12                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ─── Service Details ───             │
│ Service: Leak Repair                │
│ Date: Tomorrow, Jan 15              │
│ Time: 10:00 AM - 12:00 PM           │
│ Location: Sector 12, Gomti Nagar    │
│ Distance: 2.3 km from you           │
│                                     │
│ ┌───────────────────────────────┐   │
│ │    [Map showing location]      │   │
│ └───────────────────────────────┘   │
│                                     │
│ Customer's Note:                    │
│ "Kitchen sink is leaking badly,     │
│ needs urgent repair"                │
│                                     │
│ ─── Pricing ───                     │
│ Your Estimated Rate: ₹300-500       │
│ Your Earnings: ₹400 (estimated)     │
│ Payment: After service              │
│                                     │
│ ─── Your Schedule ───               │
│ Tomorrow at 10 AM: ✅ Available     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │          💬 Chat First           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │          ✓ Accept Booking        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [✕ Reject] (affects your ranking)  │
│                                     │
└─────────────────────────────────────┘
```

### Screen 3: Active Job

```
┌─────────────────────────────────────┐
│ ← Active Job                        │
├─────────────────────────────────────┤
│ Status: In Progress                 │
│ Timer: 00:45:30                     │
│                                     │
│ ─── Customer ───                    │
│ Amit Sharma • Sector 12             │
│ ☎ +91-98******12                   │
│ [💬 Chat]                           │
│                                     │
│ ─── Service ───                     │
│ Leak Repair                         │
│ Started: 10:05 AM                   │
│ Estimated: ₹400                     │
│                                     │
│ ─── Your Location ───               │
│ ┌───────────────────────────────┐   │
│ │  [Map with your live location] │   │
│ │  📍 Sharing with customer      │   │
│ └───────────────────────────────┘   │
│ [Stop Sharing Location]             │
│                                     │
│ ─── Photos (Optional) ───           │
│ Upload before/after photos for      │
│ better reviews                      │
│ [📷 Add Photo]                      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │        Mark as Completed         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Need Help?]                        │
│                                     │
└─────────────────────────────────────┘
```

---

## 5. Admin Dashboard Wireframes

### Dashboard Home

```
┌──────────────────────────────────────────────────────────┐
│ LocalPro Admin            [Search...]  [Notifications] [👤]│
├────────────┬─────────────────────────────────────────────┤
│            │                                             │
│ Dashboard  │  ─── Overview (Last 30 Days) ───           │
│ Users      │                                             │
│ Providers  │  ┌─────────┐ ┌─────────┐ ┌─────────┐     │
│ Bookings   │  │ 1,234   │ │ 856     │ │ ₹45,600 │     │
│ Reviews    │  │ Users   │ │ Providers│ │ Revenue │     │
│ Payments   │  │ +12%    │ │ +8%     │ │ +15%    │     │
│ Reports    │  └─────────┘ └─────────┘ └─────────┘     │
│ Settings   │                                             │
│            │  ┌─────────┐ ┌─────────┐ ┌─────────┐     │
│            │  │ 2,341   │ │ 4.7 ⭐  │ │ 12      │     │
│            │  │Bookings │ │Avg Rating│ │ Pending │     │
│            │  │ +20%    │ │ +0.2    │ │ Reviews │     │
│            │  └─────────┘ └─────────┘ └─────────┘     │
│            │                                             │
│            │  ─── Recent Activity ───                   │
│            │                                             │
│            │  • Rajesh Kumar completed booking #1234    │
│            │  • New provider signup: Suresh Yadav       │
│            │  • Flagged review reported by Amit S.      │
│            │  • Payment of ₹400 processed               │
│            │  [View All →]                              │
│            │                                             │
│            │  ─── Pending Actions (5) ───               │
│            │                                             │
│            │  ┌─────────────────────────────────────┐   │
│            │  │ Provider Approval: Mohit Verma       │   │
│            │  │ Submitted 2 hours ago                │   │
│            │  │ [Review Profile →]                   │   │
│            │  └─────────────────────────────────────┘   │
│            │                                             │
│            │  ┌─────────────────────────────────────┐   │
│            │  │ Flagged Review: Inappropriate content│   │
│            │  │ Reported by 2 users                  │   │
│            │  │ [Review →]                           │   │
│            │  └─────────────────────────────────────┘   │
│            │                                             │
└────────────┴─────────────────────────────────────────────┘
```

---

## 6. Component Library

### 6.1 Buttons

```
Primary Button:
┌──────────────────┐
│   Book Now →     │  (bg: blue-600, text: white, rounded-lg)
└──────────────────┘

Secondary Button:
┌──────────────────┐
│  View Profile    │  (bg: white, text: gray-700, border: gray-300)
└──────────────────┘

Destructive Button:
┌──────────────────┐
│  Cancel Booking  │  (bg: red-50, text: red-600, border: red-200)
└──────────────────┘

Icon Button:
┌────┐
│ 💬 │  (44×44px touch target)
└────┘
```

### 6.2 Badges

```
Verification Badges:
┌──────────────────────┐
│ ✓ Aadhaar Verified   │  (bg: green-50, text: green-700)
└──────────────────────┘

┌──────────────────────┐
│ ✓ Background Checked │  (bg: purple-50, text: purple-700)
└──────────────────────┘

Status Badges:
┌─────────────┐
│ • Available │  (green dot)
└─────────────┘

┌─────────────┐
│ ⏱ Pending   │  (orange dot)
└─────────────┘
```

### 6.3 Cards

```
Provider Card:
┌─────────────────────────────────────┐
│ [Photo] Name                 [♡]    │
│ ⭐ 4.8 (127) • 2.3 km              │
│ ✓ Aadhaar Verified                  │
│ ₹300-500 • Available Now             │
│ ┌─────────────┐ ┌─────────────┐    │
│ │View Profile │ │  Book Now →  │    │
│ └─────────────┘ └─────────────┘    │
└─────────────────────────────────────┘

Review Card:
┌─────────────────────────────────────┐
│ [Avatar] Amit S. ⭐⭐⭐⭐⭐         │
│ 2 days ago • Verified Customer      │
│                                     │
│ Excellent work! Fixed my leaking    │
│ bathroom in 2 hours. Very polite.   │
│                                     │
│ [Photo] [Photo]                     │
│                                     │
│ 👍 Helpful (12) [Report]            │
└─────────────────────────────────────┘
```

---

## 7. Microcopy & Labels

### 7.1 Trust-Building Copy

**Verification Badges:**
- ✓ Aadhaar Verified (not just "Verified")
- ✓ Government ID Verified
- ✓ Background Checked
- ⚡ Quick Responder (<10 min avg)
- 🏆 Top Rated Provider

**Empty States:**
- No bookings yet: "Your bookings will appear here"
- No providers found: "No providers found nearby. Try increasing your search radius"
- No reviews: "Be the first to review this provider"

**Loading States:**
- "Finding providers near you..."
- "Loading booking details..."
- "Sending your request..."

**Success Messages:**
- "✓ Booking request sent! You'll get a response soon."
- "✓ Payment recorded. Thank you!"
- "✓ Your review has been published."

**Error Messages:**
- "Oops! Something went wrong. Please try again."
- "Unable to send OTP. Please check your number."
- "This provider is no longer available. Try another?"

### 7.2 Notifications

**Customer Notifications:**
- "🎉 Rajesh accepted your booking!"
- "Reminder: Service tomorrow at 10 AM"
- "📍 Rajesh is on the way (15 min)"
- "✓ Service completed. Please confirm and review"
- "❌ Rajesh cancelled your booking. Reason: [reason]"

**Provider Notifications:**
- "🔔 New booking request from Amit!"
- "⏱ Respond in 5 min to maintain your ranking"
- "✓ Booking confirmed. See you tomorrow at 10 AM"
- "⭐ You received a 5-star review!"
- "💰 Payment of ₹400 received"

### 7.3 Tooltips

- Aadhaar badge: "Verified with government ID"
- Background check: "Police verification completed"
- Response time: "Average time to first response"
- Reputation score: "Based on ratings, jobs, and reliability"

---

## 8. Trust-Building UX Rules

### 8.1 Verification First

**Rule:** Always show verification status prominently
- Display badges on every provider card
- Explain what each badge means
- Make verification easy for providers

**Implementation:**
```typescript
// Always include verification in search results
interface ProviderCard {
  aadhaarVerified: boolean;
  backgroundVerified: boolean;
  verificationTooltip: string;
}
```

### 8.2 Real Photos, No Stock Images

**Rule:** Require actual photos from providers
- Profile photo: Required
- Portfolio photos: Strongly encouraged
- Review photos: Optional but incentivized

**Implementation:**
- Photo upload with face detection (profile)
- Before/after photos for portfolio
- Customer-uploaded photos in reviews

### 8.3 Transparent Pricing

**Rule:** Show prices before booking
- Range (₹300-500) or fixed (₹400)
- No hidden fees
- Explain payment options clearly

**Copy:**
- "₹400 estimated • Pay after service"
- "No booking fees • No hidden charges"
- "Final price may vary based on work complexity"

### 8.4 Reviews You Can Trust

**Rule:** Only verified bookings can review
- One review per booking
- Show reviewer's booking count
- Allow provider responses
- Flag fake reviews

**Implementation:**
```typescript
// Only customers who completed bookings can review
canReview = booking.status === 'COMPLETED' && !booking.review;
```

### 8.5 Safety Features

**Rule:** Protect both parties
- Share location only during active booking
- In-app calling (no number revealed)
- Report abuse button
- 24/7 support for emergencies

**UI Elements:**
- [🚨 Report Issue] button on every booking
- Safety tips shown before first booking
- Emergency contact displayed prominently

---

## 9. Accessibility & Localization

### 9.1 Multilingual Support

**Languages:** English, Hindi (more later)

**Structure:**
```json
{
  "en": {
    "home.search.placeholder": "What service do you need?",
    "provider.verified.aadhaar": "Aadhaar Verified",
    "booking.status.confirmed": "Confirmed"
  },
  "hi": {
    "home.search.placeholder": "आपको किस सेवा की आवश्यकता है?",
    "provider.verified.aadhaar": "आधार सत्यापित",
    "booking.status.confirmed": "पुष्टि की गई"
  }
}
```

### 9.2 Accessibility

**Color Contrast:** WCAG AA (4.5:1 minimum)
**Touch Targets:** 44×44px minimum
**Screen Readers:** ARIA labels on all interactive elements
**Keyboard Navigation:** Tab order, focus indicators

---

**This comprehensive design guide ensures a trust-first, user-friendly experience for both customers and providers across all platforms.**
