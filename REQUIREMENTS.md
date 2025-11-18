# LocalPro Connect — Product Requirements Document (PRD)
**Version:** 1.0
**Last Updated:** 2025-11-18
**Product Type:** Service Marketplace Platform (B2C + B2B2C)
**Target Launch:** Phased Regional Rollout

---

## 1. EXECUTIVE SUMMARY

**Vision:**
Build a trusted, AI-powered service marketplace connecting verified local service providers with customers across India and globally, starting from Lucknow.

**Mission:**
Empower local professionals with digital tools to grow their business while giving customers instant access to verified, rated service providers in their area.

**Value Proposition:**
- **For Customers:** Find, verify, and book trusted local service providers with real-time communication
- **For Providers:** Digital presence, customer discovery, reputation building, and business growth tools
- **For Platform:** Commission on verified bookings, premium subscriptions, featured listings

---

## 2. PRODUCT OVERVIEW

### 2.1 Core Platforms
1. **Customer Mobile App** (React Native/Expo)
2. **Provider Mobile App** (React Native/Expo)
3. **Customer Web Portal** (Next.js)
4. **Provider Web Portal** (Next.js)
5. **Admin Dashboard** (Next.js)
6. **Backend API** (Node.js + TypeScript + Prisma)

### 2.2 Key Differentiators
- ✅ Aadhaar-based self-verification (India-first approach)
- ✅ AI-powered service matching & communication assistant
- ✅ Real-time multilingual translation (Hybrid: UI + AI chat)
- ✅ Integrated real-time chat, voice/video call, live location sharing
- ✅ Reputation scoring algorithm (not just ratings)
- ✅ Flexible payment (Cash, UPI, optional gateway integration)
- ✅ Hyperlocal geo-search with regional rollout strategy

---

## 3. USER ROLES & PERSONAS

### 3.1 Customer
**Profile:**
- Age: 18-65
- Tech literacy: Basic to Advanced
- Needs: Quick, reliable, verified service providers
- Pain points: Trust issues, lack of transparency, communication barriers

**Key Actions:**
- Browse/search services by category, location, ratings
- View provider profiles (verification status, ratings, reviews, photos)
- Contact via chat/call
- Track provider location (if enabled)
- Book and pay for services
- Rate and review providers

### 3.2 Service Provider
**Profile:**
- Age: 21-60
- Occupation: Plumber, Electrician, Carpenter, Beautician, Tutor, Chef, etc.
- Tech literacy: Basic to Intermediate
- Needs: Customer discovery, reputation building, flexible work
- Pain points: Marketing costs, lack of digital presence, trust building

**Key Actions:**
- Create profile with Aadhaar verification
- List services with pricing, availability, service areas
- Receive and respond to customer inquiries
- Accept/reject booking requests
- Share live location during service
- Collect payments (cash/UPI)
- Build reputation through reviews

### 3.3 Admin
**Profile:**
- Platform operators, support team, moderators

**Key Actions:**
- Approve/reject provider verifications
- Monitor platform activity, disputes
- Manage categories, regions, pricing
- View analytics, reports
- Handle customer support escalations
- Moderate reviews, content

---

## 4. FUNCTIONAL REQUIREMENTS

### 4.1 Authentication & Verification

#### 4.1.1 Customer Authentication
- **Sign Up/Login Methods:**
  - Mobile OTP (Primary)
  - Google OAuth
  - Email/Password (Web)
- **Profile:** Name, Email, Phone, Photo, Address, Saved Locations
- **Verification:** Phone number mandatory

#### 4.1.2 Provider Authentication
- **Sign Up/Login Methods:**
  - Mobile OTP (Primary)
  - Email/Password
- **Profile Fields:**
  - Personal: Name, Email, Phone, Photo, Date of Birth
  - Business: Business name, Category, Sub-category, Service description
  - Location: Service areas (radius/pincodes), Base location
  - Pricing: Service rates, pricing model (hourly/fixed/custom)
  - Availability: Working hours, days off, calendar integration
  - Documents: Aadhaar number, Business license (optional), Certifications

#### 4.1.3 Aadhaar Self-Verification (India)
- **Integration:** Aadhaar e-KYC API (via UIDAI-approved vendors)
- **Process:**
  1. Provider enters Aadhaar number
  2. OTP sent to registered mobile
  3. OTP verification
  4. Name, DOB, Address auto-populated
- **Privacy:** Store only masked Aadhaar (XXXX-XXXX-1234), not full number
- **Badge:** "Aadhaar Verified" badge on profile

#### 4.1.4 Optional Background Check Badge
- **Third-Party Integration:** Partner with background verification agencies
- **Checks:** Criminal record, address verification, previous employment
- **Badge:** "Background Verified" badge (premium feature)
- **Cost:** Borne by provider or subsidized for promotions

---

### 4.2 Service Discovery & Search

#### 4.2.1 Search & Filters
- **Search Input:**
  - Service type (e.g., "plumber", "electrician", "yoga instructor")
  - Natural language (AI-powered: "need AC repair in Gomti Nagar")

- **Filters:**
  - Location (current location, custom address, radius)
  - Price range
  - Ratings (4+ stars, 3+ stars)
  - Availability (available now, today, this week)
  - Verification status (Aadhaar verified, Background verified)
  - Distance (nearest first)
  - Experience (years of service)

#### 4.2.2 Service Categories (Hierarchical)
```
Home Services
  ├── Plumbing
  ├── Electrical
  ├── Carpentry
  ├── Painting
  ├── Cleaning
  ├── Pest Control
  └── Appliance Repair

Personal Care
  ├── Salon/Spa
  ├── Fitness Trainer
  ├── Yoga Instructor
  └── Massage Therapy

Education
  ├── Home Tutor
  ├── Music Teacher
  ├── Language Teacher
  └── Skill Training

Events & Hospitality
  ├── Catering
  ├── Photography
  ├── Event Planning
  └── DJ/Entertainment

Professional Services
  ├── Legal Advisor
  ├── Accountant
  ├── Business Consultant
  └── IT Support

Transport & Logistics
  ├── Movers & Packers
  ├── Driver
  └── Courier

(Expandable based on demand)
```

#### 4.2.3 AI-Powered Matching
- **ML Model:** Service matching based on:
  - User search intent (NLP)
  - Provider ratings, reviews, response time
  - Historical booking success rate
  - Location proximity
  - Availability
  - Price preference
- **Ranking Algorithm:** Weighted scoring (Rating 40% + Verification 20% + Response Time 15% + Distance 15% + Availability 10%)

---

### 4.3 Communication System

#### 4.3.1 Real-Time Chat
- **Technology:** WebSocket (Socket.io) + Redis Pub/Sub
- **Features:**
  - Text messages
  - Image/document sharing
  - Voice messages
  - Location sharing
  - Typing indicators
  - Read receipts
  - Message reactions
- **AI Translation:**
  - Auto-detect language
  - Translate messages in real-time
  - Support: Hindi, English, Urdu, Regional languages (Bhojpuri, Awadhi)
  - Fallback: Google Translate API or Azure Translator

#### 4.3.2 Voice/Video Calling
- **Technology Options:**
  - **Option A:** Twilio Programmable Voice/Video
  - **Option B:** Agora.io (lower cost, good for Indian market)
  - **Option C:** WebRTC (self-hosted, complex)
- **Features:**
  - One-to-one voice call
  - One-to-one video call (optional, for consultations)
  - In-app calling (no phone number revealed)
  - Call recording (optional, with consent)

#### 4.3.3 Notifications
- **Push Notifications:**
  - New message
  - Booking request/confirmation
  - Payment received
  - Review received
- **SMS Notifications:**
  - OTP verification
  - Booking confirmation
  - Critical updates
- **Email Notifications:**
  - Weekly summary
  - Invoices
  - Account updates

---

### 4.4 Booking & Scheduling

#### 4.4.1 Booking Flow
1. **Customer initiates booking:**
   - From provider profile or after chat
   - Select service, date/time, location
   - Add special instructions
   - Request quote (for custom jobs)

2. **Provider receives request:**
   - Accept/Reject/Counter-offer
   - Response time tracked (impacts ranking)

3. **Confirmation:**
   - Both parties notified
   - Calendar entry created
   - Reminder notifications (24h, 1h before)

4. **Service completion:**
   - Provider marks "Job Started" → "Job Completed"
   - Customer confirms completion
   - Payment collection

#### 4.4.2 Calendar Integration
- **Provider Calendar:**
  - Availability management
  - Block dates/times
  - Sync with Google Calendar (optional)
- **Customer Calendar:**
  - View upcoming bookings
  - Reschedule (with provider approval)
  - Cancel (with cancellation policy)

#### 4.4.3 Cancellation Policy
- **Free Cancellation:** Up to 4 hours before service
- **Late Cancellation:** 25% fee (if paid in advance)
- **No-show:** Full charge
- **Provider Cancellation:** Penalty (lower ranking, strikes system)

---

### 4.5 Live Location Sharing

#### 4.5.1 Use Cases
- Customer tracks provider en route to location
- Provider shares location during service call
- Safety feature (both parties can share location)

#### 4.5.2 Implementation
- **Technology:**
  - React Native Geolocation
  - Socket.io for real-time updates
  - Google Maps API / MapMyIndia (India-focused)
- **Privacy:**
  - Opt-in (both parties must consent)
  - Time-limited (auto-stop after 4 hours)
  - Location history not stored
- **Features:**
  - Live marker on map
  - ETA calculation
  - Route visualization

---

### 4.6 Ratings & Reputation System

#### 4.6.1 Rating Mechanism
- **Post-Service Rating (Customer → Provider):**
  - 1-5 stars (mandatory)
  - Category ratings: Professionalism, Quality, Value, Punctuality
  - Written review (optional)
  - Photo upload (optional)

- **Counter-Rating (Provider → Customer):**
  - 1-5 stars
  - Feedback on customer behavior (optional, private)

#### 4.6.2 Reputation Score Algorithm
```
Reputation Score = Weighted Sum of:
  - Average Rating (40%)
  - Number of Completed Jobs (20%)
  - Response Time (15%)
  - Verification Status (15%)
  - Customer Retention Rate (10%)

Additional Factors:
  - Penalty for cancellations (-5 points per cancellation)
  - Bonus for consistent 5-star ratings (+10 points per 10 consecutive 5-star reviews)
  - Time decay (older reviews weighted less)
```

#### 4.6.3 Reviews Management
- **Display:**
  - Recent reviews (sorted by date)
  - Most helpful (upvoted by other customers)
  - Filter by star rating
- **Moderation:**
  - Flagging system (spam, abusive, fake)
  - Admin review for flagged content
  - Provider can respond to reviews

#### 4.6.4 Badges & Achievements
- 🏆 **Top Rated:** Average 4.8+ stars, 50+ reviews
- ⚡ **Quick Responder:** <10 min average response time
- 💯 **100% Completed:** No cancellations in last 3 months
- 🎓 **Expert:** 5+ years in category, certified
- ⭐ **Rising Star:** New provider with 4.8+ stars in first 20 jobs

---

### 4.7 Payment System

#### 4.7.1 Payment Methods
1. **Cash on Service:**
   - Customer pays provider directly
   - Provider marks "Payment Received"
   - No platform transaction fee (trust-based)

2. **UPI Direct:**
   - Customer scans provider's UPI QR
   - Provider confirms receipt in app
   - No platform transaction fee

3. **In-App Payment (Optional, Phase 2):**
   - Credit/Debit Card (Razorpay/Stripe India)
   - UPI via payment gateway
   - Wallets (Paytm, PhonePe integration)
   - Platform holds payment → Releases after service completion
   - Platform commission: 8-15% of transaction

#### 4.7.2 Invoicing
- Auto-generated invoice after service completion
- PDF download/email
- GST details (if provider is registered)

#### 4.7.3 Payout (For In-App Payments)
- **Provider Wallet:**
  - View earnings, pending settlements
  - Withdraw to bank account (weekly auto-payout or on-demand)
- **Minimum Payout:** ₹500
- **Settlement Time:** T+2 days

---

### 4.8 AI Assistant & Automation

#### 4.8.1 AI Chatbot for Customers
- **Use Cases:**
  - Help find service providers: "I need a plumber in Gomti Nagar"
  - Answer FAQs: "How do I book a service?"
  - Dispute resolution guidance
  - Language translation assistance

#### 4.8.2 AI Chatbot for Providers
- **Use Cases:**
  - Onboarding assistance
  - Profile optimization tips
  - Automated responses to common customer queries
  - Business insights: "Your response time is slower than average"

#### 4.8.3 Smart Notifications
- **Predictive Suggestions:**
  - "John booked you last month for plumbing. Send a follow-up message?"
  - "Your calendar is empty this weekend. Consider offering a discount."

#### 4.8.4 Technology Stack
- **NLP Model:** GPT-4 API (OpenAI) or Azure OpenAI
- **Translation:** Hybrid (Pre-defined UI translations + AI for chat)
- **Recommendation Engine:** Collaborative filtering + Content-based filtering

---

### 4.9 Multilingual Support

#### 4.9.1 UI Languages
- English (Default)
- Hindi
- Urdu
- Regional: Bhojpuri, Awadhi (Lucknow-specific initially)
- Expandable: Tamil, Telugu, Bengali, Marathi (for expansion phases)

#### 4.9.2 Translation Approach
- **Static Content (UI):** Pre-translated JSON files (i18n)
- **Dynamic Content (Chat, Reviews):** AI translation (Google Translate API, Azure Translator)
- **Voice Input:** Speech-to-text → Translate → Response

#### 4.9.3 Language Detection
- Auto-detect user language preference
- Allow manual language switching
- Remember preference across sessions

---

### 4.10 Admin Dashboard

#### 4.10.1 Key Features
- **User Management:**
  - View/search customers, providers
  - Approve/reject verifications
  - Ban/suspend users
  - View user activity logs

- **Content Moderation:**
  - Review flagged content (reviews, profiles, messages)
  - Approve/reject service listings
  - Manage categories, sub-categories

- **Analytics & Reports:**
  - Platform metrics (GMV, Active users, Bookings)
  - Provider performance (Top earners, ratings distribution)
  - Regional heatmaps
  - Revenue reports

- **Support & Disputes:**
  - Ticketing system
  - Chat with users
  - Refund/payout management
  - Dispute resolution workflow

- **Configuration:**
  - Platform fees, commission rates
  - Service categories, pricing
  - Notification templates
  - Feature flags (enable/disable features by region)

---

## 5. NON-FUNCTIONAL REQUIREMENTS

### 5.1 Performance
- **API Response Time:** <200ms (p95), <500ms (p99)
- **App Load Time:** <2s on 4G, <5s on 3G
- **Real-time Chat Latency:** <100ms
- **Database Query Time:** <50ms (indexed queries)
- **Concurrent Users:** Support 10K concurrent users (Phase 1)

### 5.2 Scalability
- **Architecture:** Microservices-ready (initially monolithic, refactor later)
- **Database:** PostgreSQL with read replicas, connection pooling
- **Caching:** Redis for sessions, API responses, real-time data
- **CDN:** Cloudflare/AWS CloudFront for static assets
- **Load Balancing:** Horizontal scaling with NGINX/AWS ALB

### 5.3 Security
- **Authentication:** JWT tokens (short-lived access + refresh tokens)
- **Data Encryption:**
  - In transit: TLS 1.3
  - At rest: AES-256 (for sensitive data like Aadhaar)
- **API Security:**
  - Rate limiting (100 req/min per user)
  - CORS configuration
  - Input validation (Joi/Zod)
  - SQL injection prevention (Prisma ORM)
- **PCI DSS Compliance:** (if in-app payments)
- **Aadhaar Data Protection:**
  - Comply with UIDAI guidelines
  - Store only masked Aadhaar
  - Data retention policy (delete after verification if not needed)

### 5.4 Availability
- **Uptime Target:** 99.9% (8.76 hours downtime/year)
- **Backup:**
  - Database: Daily full backup + continuous WAL archiving
  - Retention: 30 days
- **Disaster Recovery:** RTO <4 hours, RPO <1 hour
- **Monitoring:**
  - Application: DataDog/New Relic
  - Uptime: UptimeRobot/Pingdom
  - Error tracking: Sentry

### 5.5 Compliance
- **Data Privacy:**
  - GDPR compliance (for global expansion)
  - Indian IT Act, 2000
  - DPDP Act, 2023 (Digital Personal Data Protection)
- **Accessibility:** WCAG 2.1 Level AA (web platform)
- **Localization:** Support Indian time zones, number formats, currency (₹)

---

## 6. TECHNICAL ARCHITECTURE

### 6.1 Technology Stack

#### Frontend
- **Mobile Apps:** React Native (Expo)
  - Navigation: React Navigation
  - State: Zustand/Redux Toolkit
  - API Client: Axios + React Query
  - UI: NativeBase / React Native Paper
  - Maps: react-native-maps

- **Web Apps:** Next.js 14+ (App Router)
  - Language: TypeScript
  - Styling: Tailwind CSS + shadcn/ui
  - State: Zustand/Redux Toolkit
  - API Client: Axios + React Query
  - Forms: React Hook Form + Zod validation

#### Backend
- **API Server:** Node.js + Express.js (TypeScript)
  - ORM: Prisma
  - Validation: Zod
  - Auth: JWT (jsonwebtoken)
  - API Documentation: Swagger/OpenAPI

- **Real-time:** Socket.io + Redis adapter
- **Background Jobs:** BullMQ + Redis
- **File Upload:** AWS S3 / Cloudinary

#### Database
- **Primary:** PostgreSQL 15+
- **Cache:** Redis 7+
- **Search:** Elasticsearch (or PostgreSQL Full-Text Search initially)

#### Infrastructure
- **Hosting:** AWS (or Vercel/Railway for MVP)
  - Compute: EC2 / ECS / Lambda
  - Database: RDS PostgreSQL
  - Cache: ElastiCache Redis
  - Storage: S3
  - CDN: CloudFront
- **CI/CD:** GitHub Actions
- **Containerization:** Docker + Docker Compose (local dev)

#### Third-Party Services
- **Payments:** Razorpay / Stripe India
- **SMS/OTP:** Twilio / MSG91
- **Email:** SendGrid / AWS SES
- **Push Notifications:** Firebase Cloud Messaging
- **Voice/Video:** Agora.io / Twilio
- **Maps:** Google Maps API / MapMyIndia
- **Aadhaar Verification:** UIDAI-approved vendor (e.g., SignDesk, Digio)
- **AI/ML:** OpenAI GPT-4 API / Azure OpenAI
- **Translation:** Google Cloud Translation API
- **Analytics:** Mixpanel / Google Analytics
- **Monitoring:** Sentry, DataDog

### 6.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│   Customer   │   Provider   │   Customer   │   Provider         │
│   Mobile     │   Mobile     │   Web        │   Web + Admin      │
│   (Expo)     │   (Expo)     │   (Next.js)  │   (Next.js)        │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬─────────────┘
       │              │              │              │
       └──────────────┴──────────────┴──────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY / CDN                           │
│               (Cloudflare / AWS CloudFront)                      │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API LAYER                             │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│   REST API   │  WebSocket   │  GraphQL     │   Background       │
│   (Express)  │  (Socket.io) │  (Optional)  │   Jobs (BullMQ)    │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬─────────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER (Business Logic)                │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│   Auth       │   Booking    │   Payment    │   Notification     │
│   Service    │   Service    │   Service    │   Service          │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│   Chat       │   Location   │   Rating     │   Search           │
│   Service    │   Service    │   Service    │   Service          │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬─────────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                    │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│  PostgreSQL  │    Redis     │  Elastic-    │    AWS S3          │
│  (Primary)   │  (Cache +    │  search      │  (File Storage)    │
│              │   Pub/Sub)   │  (Search)    │                    │
└──────────────┴──────────────┴──────────────┴────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                 EXTERNAL SERVICES                                │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│  Aadhaar     │  Payment     │  SMS/Email   │  Voice/Video       │
│  e-KYC       │  Gateway     │  Providers   │  (Agora/Twilio)    │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│  AI/ML       │  Translation │  Maps        │  Push Notif        │
│  (OpenAI)    │  (Google)    │  (GMaps)     │  (FCM)             │
└──────────────┴──────────────┴──────────────┴────────────────────┘
```

---

## 7. USER FLOW DIAGRAMS

### 7.1 Customer Journey: Finding & Booking a Service

```
START
  │
  ├─> Open App
  │     │
  │     ├─> [Not Logged In] → Sign Up/Login (OTP) → Home Screen
  │     └─> [Logged In] → Home Screen
  │
  ├─> HOME SCREEN
  │     │
  │     ├─> Browse Categories → Select Category (e.g., Plumbing)
  │     ├─> Search Bar → Enter "plumber near me" → AI Suggests
  │     └─> Location Permission → Current Location Detected
  │
  ├─> SEARCH RESULTS
  │     │
  │     ├─> View List of Providers (sorted by ranking)
  │     │     - Photo, Name, Rating, Distance, Price
  │     │     - Badges: Aadhaar Verified, Background Checked
  │     │
  │     ├─> Apply Filters (Price, Distance, Rating, Availability)
  │     │
  │     └─> Select Provider → VIEW PROFILE
  │
  ├─> PROVIDER PROFILE
  │     │
  │     ├─> View Details:
  │     │     - Services offered
  │     │     - Pricing
  │     │     - Photos/portfolio
  │     │     - Reviews & Ratings
  │     │     - Verification badges
  │     │
  │     ├─> Actions:
  │     │     ├─> [Chat] → Open Chat → Send Message
  │     │     ├─> [Call] → Voice/Video Call
  │     │     └─> [Book Now] → BOOKING FLOW
  │
  ├─> BOOKING FLOW
  │     │
  │     ├─> Select Service Type
  │     ├─> Choose Date & Time
  │     ├─> Enter Location (or use current)
  │     ├─> Add Special Instructions
  │     ├─> Review Booking Summary
  │     └─> [Confirm Booking]
  │           │
  │           └─> Notification Sent to Provider
  │
  ├─> PROVIDER ACCEPTS
  │     │
  │     ├─> Booking Confirmed
  │     ├─> Notifications Sent (Push + SMS)
  │     ├─> Add to Calendar
  │     └─> [Wait for Service Date]
  │
  ├─> SERVICE DAY
  │     │
  │     ├─> Reminder Notification (24h, 1h before)
  │     ├─> Provider Marks "On the Way"
  │     ├─> [Optional] Track Live Location
  │     ├─> Provider Marks "Job Started"
  │     ├─> Service Performed
  │     └─> Provider Marks "Job Completed"
  │
  ├─> POST-SERVICE
  │     │
  │     ├─> Customer Confirms Completion
  │     ├─> Payment (Cash/UPI/In-App)
  │     ├─> Provider Marks "Payment Received"
  │     ├─> Invoice Generated
  │     └─> RATING & REVIEW
  │           │
  │           ├─> Rate Provider (1-5 stars)
  │           ├─> Category Ratings (Quality, Punctuality, etc.)
  │           ├─> Write Review (optional)
  │           └─> Submit
  │
  └─> END (Booking Complete)
        │
        └─> Option to Rebook Same Provider
```

### 7.2 Provider Journey: Onboarding & Service Delivery

```
START
  │
  ├─> Download Provider App
  │
  ├─> SIGN UP
  │     │
  │     ├─> Enter Mobile Number → OTP Verification
  │     ├─> Enter Basic Info (Name, Email, DOB)
  │     ├─> Select Business Category (e.g., Home Services → Plumbing)
  │     └─> Create Account
  │
  ├─> PROFILE SETUP
  │     │
  │     ├─> Add Business Details:
  │     │     - Business Name
  │     │     - Services Offered
  │     │     - Pricing (hourly/fixed)
  │     │     - Service Areas (location radius or pincodes)
  │     │     - Working Hours
  │     │
  │     ├─> Upload Documents:
  │     │     - Profile Photo
  │     │     - Portfolio Photos (before/after work)
  │     │     - Certificates (optional)
  │     │
  │     └─> AADHAAR VERIFICATION
  │           │
  │           ├─> Enter Aadhaar Number
  │           ├─> OTP to Aadhaar-Registered Mobile
  │           ├─> Verify OTP
  │           ├─> Data Auto-Populated (Name, DOB, Address)
  │           └─> "Aadhaar Verified" Badge Awarded
  │
  ├─> OPTIONAL: Background Check
  │     │
  │     ├─> Initiate Background Verification (₹ fee)
  │     ├─> Third-Party Agency Conducts Check
  │     ├─> [2-5 days] Verification Complete
  │     └─> "Background Verified" Badge Awarded
  │
  ├─> PROFILE ACTIVATION
  │     │
  │     ├─> Admin Reviews Profile
  │     ├─> [Approved] → Profile Goes Live
  │     └─> [Rejected] → Reason Provided, Fix & Resubmit
  │
  ├─> READY FOR BUSINESS
  │     │
  │     ├─> Dashboard Shows:
  │     │     - Pending Requests
  │     │     - Upcoming Bookings
  │     │     - Earnings Summary
  │     │     - Ratings & Reviews
  │     │
  │     └─> [Wait for Customer Requests]
  │
  ├─> RECEIVE BOOKING REQUEST
  │     │
  │     ├─> Push Notification
  │     ├─> View Request Details:
  │     │     - Customer Name, Location
  │     │     - Service Type
  │     │     - Date & Time
  │     │     - Special Instructions
  │     │
  │     └─> Actions:
  │           ├─> [Accept] → Booking Confirmed
  │           ├─> [Reject] → Reason Required (impacts ranking)
  │           └─> [Counter-Offer] → Suggest Alternative Time/Price
  │
  ├─> PRE-SERVICE
  │     │
  │     ├─> View Booking in Calendar
  │     ├─> [Optional] Chat with Customer
  │     ├─> Set Reminder
  │     └─> [Service Day Arrives]
  │
  ├─> SERVICE DAY
  │     │
  │     ├─> Mark "On the Way"
  │     ├─> [Optional] Share Live Location
  │     ├─> Arrive at Location
  │     ├─> Mark "Job Started"
  │     ├─> Perform Service
  │     ├─> Mark "Job Completed"
  │     └─> Collect Payment (Cash/UPI)
  │           │
  │           └─> Mark "Payment Received"
  │
  ├─> POST-SERVICE
  │     │
  │     ├─> Customer Rates & Reviews
  │     ├─> View Review
  │     ├─> [Optional] Respond to Review
  │     └─> Earnings Credited to Wallet (if in-app payment)
  │
  └─> ONGOING
        │
        ├─> Monitor Profile Performance
        ├─> Update Availability/Pricing
        ├─> Respond to Inquiries
        └─> Build Reputation
```

### 7.3 Real-Time Chat Flow

```
CUSTOMER                           PROVIDER
   │                                  │
   ├─> Open Provider Profile          │
   ├─> Click "Chat"                   │
   │                                  │
   ├─> [Send Message] ─────────────> ├─> [Receive Push Notification]
   │   "Hi, I need plumbing help"     ├─> Open Chat
   │                                  │
   │ <─────────────────────────────  ├─> [Reply]
   │   "Sure! What's the issue?"      │   (Typing indicator shows)
   │                                  │
   ├─> [Send Photo] ───────────────> ├─> [View Photo]
   │   (Broken pipe image)            │
   │                                  │
   │ <─────────────────────────────  ├─> [AI Translation Active]
   │   Original (Hindi): "मैं आ सकता हूं"
   │   Translated (English): "I can come"
   │                                  │
   ├─> [Share Location] ──────────>  ├─> [View Location on Map]
   │                                  │
   │ <─────────────────────────────  ├─> "I'll be there in 30 mins"
   │                                  ├─> [Mark as Read]
   │                                  │
   ├─> [Book Now from Chat] ────────> ├─> [Booking Request Received]
   │                                  │
   └───────────────────────────────────┘
```

---

## 8. DATA MODEL (Entities & Relationships)

### 8.1 Core Entities

#### Users
```typescript
User {
  id: UUID (PK)
  role: ENUM (CUSTOMER, PROVIDER, ADMIN)
  phone: String (unique, indexed)
  email: String (nullable, unique)
  name: String
  profilePhoto: String (URL)
  createdAt: DateTime
  updatedAt: DateTime

  // Relations
  customerProfile: CustomerProfile?
  providerProfile: ProviderProfile?
}
```

#### CustomerProfile
```typescript
CustomerProfile {
  id: UUID (PK)
  userId: UUID (FK → Users)
  dateOfBirth: Date?
  addresses: Address[] (one-to-many)
  savedLocations: SavedLocation[]

  // Relations
  bookings: Booking[]
  reviews: Review[]
  chats: ChatRoom[]
}
```

#### ProviderProfile
```typescript
ProviderProfile {
  id: UUID (PK)
  userId: UUID (FK → Users)
  businessName: String?
  description: Text
  categoryId: UUID (FK → Category)
  subCategoryIds: UUID[] (FK → SubCategory)

  // Verification
  aadhaarVerified: Boolean (default: false)
  aadhaarMasked: String? (XXXX-XXXX-1234)
  backgroundVerified: Boolean (default: false)
  verifiedAt: DateTime?

  // Service Info
  serviceAreas: JSON (pincodes or radius)
  baseLocation: Point (PostGIS geometry)
  pricing: JSON { hourlyRate?, fixedPrice?, custom? }
  workingHours: JSON
  availability: JSON (calendar)

  // Stats
  totalJobs: Int (default: 0)
  completedJobs: Int (default: 0)
  cancelledJobs: Int (default: 0)
  averageRating: Decimal (default: 0)
  reputationScore: Decimal (default: 0)
  responseTime: Int (seconds, avg)

  // Relations
  bookings: Booking[]
  reviews: Review[]
  portfolioPhotos: ProviderPhoto[]
  certifications: Certification[]
}
```

#### Category
```typescript
Category {
  id: UUID (PK)
  name: String
  nameTranslations: JSON { en, hi, ur, ... }
  icon: String (URL)
  description: Text
  isActive: Boolean
  sortOrder: Int

  // Relations
  subCategories: SubCategory[]
  providers: ProviderProfile[]
}
```

#### SubCategory
```typescript
SubCategory {
  id: UUID (PK)
  categoryId: UUID (FK → Category)
  name: String
  nameTranslations: JSON
  description: Text
  isActive: Boolean
}
```

#### Booking
```typescript
Booking {
  id: UUID (PK)
  bookingNumber: String (unique, indexed) // e.g., "BK-2025-001234"

  customerId: UUID (FK → CustomerProfile)
  providerId: UUID (FK → ProviderProfile)

  serviceType: String
  serviceLocation: JSON { address, lat, lng }
  scheduledDate: DateTime
  scheduledTime: TimeRange

  status: ENUM (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED)
  cancellationReason: Text?
  cancelledBy: ENUM (CUSTOMER, PROVIDER)?

  specialInstructions: Text?

  // Pricing
  quotedPrice: Decimal?
  finalPrice: Decimal?
  currency: String (default: INR)

  // Timestamps
  createdAt: DateTime
  confirmedAt: DateTime?
  startedAt: DateTime?
  completedAt: DateTime?
  cancelledAt: DateTime?

  // Relations
  payment: Payment?
  review: Review?
  chatRoom: ChatRoom?
}
```

#### Payment
```typescript
Payment {
  id: UUID (PK)
  bookingId: UUID (FK → Booking)

  amount: Decimal
  currency: String (default: INR)
  method: ENUM (CASH, UPI, CARD, WALLET)

  status: ENUM (PENDING, COMPLETED, FAILED, REFUNDED)

  // For in-app payments
  transactionId: String? (payment gateway ref)
  gatewayResponse: JSON?

  // Platform Commission
  platformFee: Decimal?
  providerEarnings: Decimal?

  paidAt: DateTime?
  refundedAt: DateTime?

  createdAt: DateTime
}
```

#### Review
```typescript
Review {
  id: UUID (PK)
  bookingId: UUID (FK → Booking, unique)
  customerId: UUID (FK → CustomerProfile)
  providerId: UUID (FK → ProviderProfile)

  // Ratings
  overallRating: Int (1-5)
  qualityRating: Int (1-5)?
  punctualityRating: Int (1-5)?
  professionalismRating: Int (1-5)?
  valueRating: Int (1-5)?

  // Review Content
  comment: Text?
  photos: String[] (URLs)

  // Moderation
  isPublished: Boolean (default: true)
  isFlagged: Boolean (default: false)
  flagReason: String?

  // Provider Response
  providerResponse: Text?
  respondedAt: DateTime?

  // Helpful Votes
  helpfulCount: Int (default: 0)

  createdAt: DateTime
  updatedAt: DateTime
}
```

#### ChatRoom
```typescript
ChatRoom {
  id: UUID (PK)
  customerId: UUID (FK → CustomerProfile)
  providerId: UUID (FK → ProviderProfile)
  bookingId: UUID? (FK → Booking, nullable)

  lastMessageAt: DateTime?

  createdAt: DateTime

  // Relations
  messages: Message[]
}
```

#### Message
```typescript
Message {
  id: UUID (PK)
  chatRoomId: UUID (FK → ChatRoom)
  senderId: UUID (FK → Users)

  type: ENUM (TEXT, IMAGE, DOCUMENT, VOICE, LOCATION)
  content: Text? (for TEXT, translated text stored here)
  originalContent: Text? (original before translation)
  detectedLanguage: String?

  mediaUrl: String? (for IMAGE, DOCUMENT, VOICE)
  location: JSON? { lat, lng, address }

  isRead: Boolean (default: false)
  readAt: DateTime?

  createdAt: DateTime
}
```

### 8.2 Entity Relationship Diagram (Simplified)

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     ├──────────────┬──────────────┐
     │              │              │
┌────▼─────────┐ ┌──▼────────────┐│
│Customer      │ │Provider       ││
│Profile       │ │Profile        ││
└────┬─────────┘ └──┬────────────┘│
     │              │             │
     │              │             │
     │    ┌─────────▼──┐          │
     └───►│  Booking   │◄─────────┘
          └─────┬──────┘
                │
        ┌───────┼───────┐
        │       │       │
   ┌────▼──┐ ┌──▼────┐ │
   │Payment│ │Review │ │
   └───────┘ └───────┘ │
                       │
                  ┌────▼────┐
                  │ChatRoom │
                  └────┬────┘
                       │
                  ┌────▼────┐
                  │Message  │
                  └─────────┘
```

---

## 9. REGIONAL ROLLOUT STRATEGY

### Phase 1: Lucknow (Pilot) — Month 1-3
**Objectives:**
- Test product-market fit
- Gather user feedback
- Refine AI models with local data
- Build initial provider network

**Activities:**
- Onboard 50-100 providers (priority categories: Plumbing, Electrical, Cleaning, Home Tutors)
- Acquire 1,000 customers
- Partner with local verification agencies for Aadhaar/background checks
- Focus marketing: Local newspapers, radio, WhatsApp groups, pamphlets

**Success Metrics:**
- 500+ bookings in first month
- 4.0+ average provider rating
- <30% customer churn
- <5% provider churn

### Phase 2: Uttar Pradesh (State Expansion) — Month 4-6
**Target Cities:** Kanpur, Varanasi, Agra, Meerut, Ghaziabad

**Activities:**
- Expand to 500+ providers
- Acquire 10,000 customers
- Launch regional language support (Bhojpuri, Awadhi)
- Partner with local businesses for co-marketing

### Phase 3: North India — Month 7-12
**Target States:** Delhi, Haryana, Punjab, Rajasthan, MP

**Activities:**
- Scale to 2,000+ providers
- Acquire 100,000 customers
- Launch in-app payments
- Introduce premium subscriptions for providers
- Add more service categories

### Phase 4: Pan-India — Year 2
**Target:** All major metros + Tier 2 cities

**Activities:**
- Scale to 50,000+ providers
- Acquire 2 million customers
- Add voice/video calling
- Launch AI assistant (full-featured)
- Expand to B2B services (corporate tie-ups)

### Phase 5: Global — Year 3+
**Target Countries:** Southeast Asia (Bangladesh, Sri Lanka, Nepal), Middle East (UAE, Saudi), Africa

**Activities:**
- Localization for each market
- Partner with local payment providers
- Adapt verification systems (not Aadhaar-based)

---

## 10. MONETIZATION STRATEGY

### 10.1 Revenue Streams

#### A. Commission on Bookings (Primary)
- **Model:** Platform commission on completed bookings (in-app payments only)
- **Rate:** 8-15% of transaction value
- **Year 1 Revenue (Est.):**
  - 10,000 bookings/month @ avg ₹500/booking
  - 10% commission → ₹5 lakh/month

#### B. Provider Subscription Plans
- **Free Tier:**
  - Basic profile listing
  - Aadhaar verification badge
  - Chat support
  - Max 10 bookings/month

- **Pro Tier (₹499/month):**
  - Unlimited bookings
  - Priority in search results
  - Background verification badge
  - Portfolio showcase (up to 20 photos)
  - Analytics dashboard

- **Premium Tier (₹999/month):**
  - All Pro features
  - Featured listing (top 3 in category)
  - Dedicated account manager
  - AI-powered business insights
  - Custom branding

#### C. Featured Listings & Ads
- **Sponsored Listings:** ₹2,000-5,000/week (category-specific)
- **Banner Ads:** For B2B services (tools, equipment sellers)

#### D. Value-Added Services
- **Background Verification:** ₹500-1,000 per provider (one-time, cost-recovery + margin)
- **Photography Service:** Professional photos for provider profiles (₹2,000-5,000)
- **Lead Generation:** Sell qualified leads to providers (₹50-100/lead)

#### E. B2B Partnerships
- **Corporate Tie-ups:** Bulk service contracts (offices, apartment complexes)
- **White-label Solutions:** Licensing platform to enterprises

### 10.2 Projected Revenue (3-Year Forecast)

| Year | Users     | Bookings/Month | Avg Value | Commission Revenue | Subscription Revenue | Total Revenue (Annual) |
|------|-----------|----------------|-----------|-------------------|---------------------|----------------------|
| 1    | 100K      | 10,000         | ₹500      | ₹60 lakh          | ₹30 lakh            | ₹90 lakh             |
| 2    | 2M        | 200,000        | ₹600      | ₹14.4 Cr          | ₹5 Cr               | ₹19.4 Cr             |
| 3    | 10M       | 1,000,000      | ₹700      | ₹84 Cr            | ₹20 Cr              | ₹104 Cr              |

---

## 11. KEY RISKS & MITIGATION

### Risk 1: Provider Trust & Adoption
**Risk:** Service providers may resist digital platforms, prefer traditional word-of-mouth.
**Mitigation:**
- Hyperlocal onboarding (field teams)
- Free tier to reduce entry barrier
- Training & handholding for tech-averse providers
- Showcase success stories

### Risk 2: Customer Trust & Safety
**Risk:** Customers may fear fraud, low-quality service.
**Mitigation:**
- Strong verification (Aadhaar + background check)
- Rating & review system
- Insurance/guarantee on platform-facilitated bookings
- 24/7 customer support

### Risk 3: Aadhaar Data Privacy
**Risk:** Regulatory penalties, user backlash for Aadhaar misuse.
**Mitigation:**
- Comply with UIDAI guidelines strictly
- Store only masked Aadhaar
- Clear user consent flows
- Data retention policies (auto-delete after verification)

### Risk 4: High Customer Acquisition Cost (CAC)
**Risk:** Competing with established players (Urban Company, Justdial).
**Mitigation:**
- Hyperlocal focus (less competition in Tier 2/3 cities)
- Referral programs (₹50 bonus for referrer + referee)
- Community-driven marketing (WhatsApp, local influencers)

### Risk 5: Payment Fraud
**Risk:** Fake payment confirmations, disputes.
**Mitigation:**
- For cash/UPI: Both parties confirm payment in app
- For in-app payments: Escrow system (hold → release on completion)
- Dispute resolution team

### Risk 6: Scalability Challenges
**Risk:** System downtime during peak usage.
**Mitigation:**
- Auto-scaling infrastructure (AWS ECS/Lambda)
- Load testing before each rollout phase
- Database optimization (read replicas, caching)
- CDN for static assets

---

## 12. SUCCESS METRICS (KPIs)

### Product Metrics
- **MAU (Monthly Active Users):** Customers + Providers
- **Booking Conversion Rate:** (Bookings / Profile Views) %
- **Repeat Customer Rate:** % of customers with 2+ bookings
- **Provider Utilization Rate:** Avg bookings per provider per month

### Engagement Metrics
- **Average Session Duration:** App/Web
- **Chat Response Time:** Provider avg time to first response
- **Search-to-Booking Funnel:** Conversion at each step

### Business Metrics
- **GMV (Gross Merchandise Value):** Total booking value
- **Take Rate:** Platform commission as % of GMV
- **CAC (Customer Acquisition Cost):** Marketing spend / New users
- **LTV (Lifetime Value):** Avg revenue per user over lifetime
- **LTV:CAC Ratio:** Target >3:1

### Quality Metrics
- **Average Provider Rating:** Target >4.5 stars
- **Booking Completion Rate:** (Completed / Confirmed) %
- **Dispute Rate:** % of bookings with disputes
- **Provider Response Rate:** % of inquiries responded within 1 hour

### Technical Metrics
- **API Uptime:** 99.9%
- **App Crash Rate:** <1%
- **Page Load Time:** <2s (p95)

---

## CONFIRMATION QUESTIONS

Before we proceed to detailed architecture and implementation, please confirm/answer:

### A. Product Scope
1. **MVP vs Full Build:** Do you want to build the complete platform in one go, or start with an MVP (e.g., Customer app + Provider app + basic booking, no AI/translation initially)?
2. **Platform Priority:** Mobile-first or Web+Mobile simultaneously?
3. **Payment Gateway:** Should we integrate in-app payments from Day 1, or launch with Cash/UPI initially?
4. **AI Features Priority:** Which AI features are critical for MVP?
   - [ ] AI-powered search/matching
   - [ ] AI chatbot assistant
   - [ ] Real-time translation
   - [ ] All of the above

### B. Technical Decisions
5. **Backend Framework:** Node.js + Express (current scaffold) OR migrate to NestJS (better structure for complex apps)?
6. **Database:** PostgreSQL (as planned) OR add MongoDB for flexible schemas (chat, AI data)?
7. **Real-time Infrastructure:** Self-hosted WebSocket (Socket.io) OR managed service (Pusher, Ably)?
8. **Mobile App:** Single React Native app with role switching OR separate apps for Customer & Provider?
9. **Aadhaar Integration:** Do you have UIDAI-approved vendor access, or should we mock this for now?

### C. Third-Party Services
10. **Voice/Video Calling:** Agora.io (cost-effective) OR Twilio (feature-rich but expensive)?
11. **Maps:** Google Maps API (paid) OR MapMyIndia (India-focused, cheaper)?
12. **Translation:** Google Cloud Translation OR Azure Translator OR OpenAI GPT (more context-aware)?
13. **Hosting:** AWS (scalable but complex) OR Railway/Render/Vercel (simpler for MVP)?

### D. Business & Legal
14. **Target Launch Date:** When do you plan to launch the Lucknow pilot?
15. **Team Size:** How many developers/designers/PMs are working on this?
16. **Budget for Third-Party Services:** Monthly budget for APIs, hosting, etc.?
17. **Legal/Compliance:** Do you have legal counsel for Aadhaar compliance, data privacy?

### E. Design & UX
18. **Design System:** Do you have a design system/brand guidelines, or should we use default (Material Design / shadcn)?
19. **Languages for MVP:** Start with English + Hindi only, or include regional languages from Day 1?

### F. Admin & Operations
20. **Admin Dashboard:** Needed for MVP or can be added in Phase 2?
21. **Customer Support:** In-app ticketing system OR external (Zendesk, Freshdesk)?

---

## NEXT STEPS

Once you answer the confirmation questions, I will:

1. ✅ **Finalize Tech Stack & Architecture**
2. ✅ **Design Database Schema (Prisma models)**
3. ✅ **Create API Specifications (OpenAPI)**
4. ✅ **Build Folder Structure (monorepo with apps/services/packages)**
5. ✅ **Implement Core Features:**
   - Auth system (JWT + OTP)
   - User profiles (Customer & Provider)
   - Service discovery (search + filters)
   - Booking flow
   - Real-time chat
   - Payment integration
   - Rating & review system
6. ✅ **Set up CI/CD pipelines**
7. ✅ **Write unit/integration tests**
8. ✅ **Deploy to staging environment**

**Estimated Timeline (Full Build with Team of 3-5 Developers):**
- **MVP (Core Features):** 3-4 months
- **Phase 1 (Lucknow Launch):** 5-6 months
- **Full Platform (AI, Payments, All Features):** 8-12 months

---

**Ready to architect when you provide the confirmations.** 🚀
