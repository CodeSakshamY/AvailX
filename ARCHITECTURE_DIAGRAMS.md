# LocalPro Connect — Architecture & Flow Diagrams

## 1. SYSTEM ARCHITECTURE DIAGRAM

```mermaid
graph TB
    subgraph "Client Layer"
        CMA[Customer Mobile App<br/>React Native]
        PMA[Provider Mobile App<br/>React Native]
        CWA[Customer Web App<br/>Next.js]
        PWA[Provider Web App<br/>Next.js]
        ADM[Admin Dashboard<br/>Next.js]
    end

    subgraph "CDN / API Gateway"
        CF[Cloudflare / CloudFront<br/>DDoS Protection, Caching]
        LB[Load Balancer<br/>NGINX / AWS ALB]
    end

    subgraph "Application Layer"
        API[REST API Server<br/>Node.js + Express + TypeScript]
        WS[WebSocket Server<br/>Socket.io + Redis Pub/Sub]
        BG[Background Jobs<br/>BullMQ + Redis Queue]
        GQL[GraphQL API<br/>Optional/Future]
    end

    subgraph "Service Layer - Business Logic"
        AUTH[Auth Service<br/>JWT, OTP, Sessions]
        BOOK[Booking Service<br/>CRUD, Scheduling]
        PAY[Payment Service<br/>Gateway Integration]
        NOTIF[Notification Service<br/>Push, SMS, Email]
        CHAT[Chat Service<br/>Real-time Messaging]
        LOC[Location Service<br/>Geo-search, Tracking]
        RATE[Rating Service<br/>Reviews, Reputation]
        SEARCH[Search Service<br/>Elasticsearch, Filters]
        AI[AI Service<br/>Matching, Translation, Assistant]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Primary Database)]
        RD[(Redis<br/>Cache + Pub/Sub + Queue)]
        ES[(Elasticsearch<br/>Search Index)]
        S3[(AWS S3<br/>File Storage)]
    end

    subgraph "External Services"
        AADHAAR[Aadhaar e-KYC<br/>UIDAI Vendor]
        PAYG[Payment Gateway<br/>Razorpay/Stripe]
        SMS[SMS/OTP Provider<br/>Twilio/MSG91]
        EMAIL[Email Service<br/>SendGrid/SES]
        CALL[Voice/Video<br/>Agora.io/Twilio]
        MAPS[Maps API<br/>Google/MapMyIndia]
        TRANS[Translation<br/>Google Cloud/Azure]
        OPENAI[OpenAI GPT-4<br/>AI Assistant]
        FCM[Firebase FCM<br/>Push Notifications]
    end

    CMA --> CF
    PMA --> CF
    CWA --> CF
    PWA --> CF
    ADM --> CF

    CF --> LB
    LB --> API
    LB --> WS

    API --> AUTH
    API --> BOOK
    API --> PAY
    API --> SEARCH

    WS --> CHAT
    WS --> LOC
    WS --> NOTIF

    BG --> NOTIF
    BG --> AI

    AUTH --> PG
    BOOK --> PG
    PAY --> PG
    CHAT --> PG
    RATE --> PG

    SEARCH --> ES

    AUTH --> RD
    CHAT --> RD
    LOC --> RD
    API --> RD

    API --> S3

    AUTH --> AADHAAR
    PAY --> PAYG
    NOTIF --> SMS
    NOTIF --> EMAIL
    NOTIF --> FCM
    CHAT --> CALL
    LOC --> MAPS
    AI --> TRANS
    AI --> OPENAI
```

---

## 2. DATABASE ENTITY RELATIONSHIP DIAGRAM

```mermaid
erDiagram
    User ||--o| CustomerProfile : has
    User ||--o| ProviderProfile : has
    User {
        uuid id PK
        enum role
        string phone UK
        string email UK
        string name
        string profilePhoto
        datetime createdAt
        datetime updatedAt
    }

    CustomerProfile ||--o{ Booking : creates
    CustomerProfile ||--o{ Review : writes
    CustomerProfile ||--o{ ChatRoom : participates
    CustomerProfile {
        uuid id PK
        uuid userId FK
        date dateOfBirth
        json addresses
        json savedLocations
    }

    ProviderProfile ||--o{ Booking : receives
    ProviderProfile ||--o{ Review : receives
    ProviderProfile ||--o{ ChatRoom : participates
    ProviderProfile }o--|| Category : belongsTo
    ProviderProfile {
        uuid id PK
        uuid userId FK
        string businessName
        text description
        uuid categoryId FK
        json subCategoryIds
        boolean aadhaarVerified
        string aadhaarMasked
        boolean backgroundVerified
        json serviceAreas
        point baseLocation
        json pricing
        json workingHours
        int totalJobs
        int completedJobs
        decimal averageRating
        decimal reputationScore
        int responseTime
    }

    Category ||--o{ SubCategory : contains
    Category {
        uuid id PK
        string name
        json nameTranslations
        string icon
        text description
        boolean isActive
        int sortOrder
    }

    SubCategory {
        uuid id PK
        uuid categoryId FK
        string name
        json nameTranslations
        text description
        boolean isActive
    }

    Booking ||--o| Payment : has
    Booking ||--o| Review : has
    Booking ||--o| ChatRoom : linkedTo
    Booking {
        uuid id PK
        string bookingNumber UK
        uuid customerId FK
        uuid providerId FK
        string serviceType
        json serviceLocation
        datetime scheduledDate
        json scheduledTime
        enum status
        text cancellationReason
        enum cancelledBy
        text specialInstructions
        decimal quotedPrice
        decimal finalPrice
        string currency
        datetime createdAt
        datetime confirmedAt
        datetime startedAt
        datetime completedAt
        datetime cancelledAt
    }

    Payment {
        uuid id PK
        uuid bookingId FK
        decimal amount
        string currency
        enum method
        enum status
        string transactionId
        json gatewayResponse
        decimal platformFee
        decimal providerEarnings
        datetime paidAt
        datetime refundedAt
        datetime createdAt
    }

    Review {
        uuid id PK
        uuid bookingId FK UK
        uuid customerId FK
        uuid providerId FK
        int overallRating
        int qualityRating
        int punctualityRating
        int professionalismRating
        int valueRating
        text comment
        json photos
        boolean isPublished
        boolean isFlagged
        string flagReason
        text providerResponse
        datetime respondedAt
        int helpfulCount
        datetime createdAt
        datetime updatedAt
    }

    ChatRoom ||--o{ Message : contains
    ChatRoom {
        uuid id PK
        uuid customerId FK
        uuid providerId FK
        uuid bookingId FK
        datetime lastMessageAt
        datetime createdAt
    }

    Message }o--|| User : sentBy
    Message {
        uuid id PK
        uuid chatRoomId FK
        uuid senderId FK
        enum type
        text content
        text originalContent
        string detectedLanguage
        string mediaUrl
        json location
        boolean isRead
        datetime readAt
        datetime createdAt
    }
```

---

## 3. CUSTOMER BOOKING FLOW

```mermaid
sequenceDiagram
    actor C as Customer
    participant MA as Mobile App
    participant API as Backend API
    participant DB as Database
    participant WS as WebSocket
    participant P as Provider App
    participant NOTIF as Notification Service

    C->>MA: Open App & Login
    MA->>API: GET /api/auth/verify-token
    API->>DB: Validate JWT
    DB-->>API: User Data
    API-->>MA: Authenticated

    C->>MA: Search "plumber near me"
    MA->>API: POST /api/search<br/>{query, location}
    API->>DB: Query providers by category, location
    DB-->>API: Matching providers
    API-->>MA: Provider list with rankings

    C->>MA: Select Provider & View Profile
    MA->>API: GET /api/providers/:id
    API->>DB: Fetch provider details, reviews
    DB-->>API: Provider data
    API-->>MA: Display profile

    C->>MA: Click "Book Now"
    MA->>API: POST /api/bookings<br/>{providerId, service, date, location}
    API->>DB: Create booking (status: PENDING)
    DB-->>API: Booking ID
    API->>NOTIF: Send notification to provider
    NOTIF->>P: Push: "New booking request"
    API-->>MA: Booking created

    P->>API: PUT /api/bookings/:id/accept
    API->>DB: Update booking (status: CONFIRMED)
    DB-->>API: Success
    API->>WS: Emit booking confirmed event
    WS->>MA: Real-time update
    API->>NOTIF: Send confirmation to customer
    NOTIF->>MA: Push: "Booking confirmed"
    API-->>P: Acceptance confirmed

    Note over C,P: Service Day Arrives

    P->>API: PUT /api/bookings/:id/start
    API->>DB: Update (status: IN_PROGRESS, startedAt)
    API->>WS: Emit job started
    WS->>MA: Notification: "Provider started job"

    P->>API: PUT /api/bookings/:id/complete
    API->>DB: Update (status: COMPLETED, completedAt)
    API->>WS: Emit job completed
    WS->>MA: Notification: "Job completed"

    C->>MA: Mark payment received (Cash/UPI)
    MA->>API: POST /api/payments<br/>{bookingId, method, amount}
    API->>DB: Create payment record
    DB-->>API: Success
    API-->>MA: Payment recorded

    C->>MA: Rate & Review
    MA->>API: POST /api/reviews<br/>{bookingId, rating, comment}
    API->>DB: Create review, update provider stats
    DB-->>API: Success
    API->>NOTIF: Notify provider of new review
    NOTIF->>P: Push: "You received a review"
    API-->>MA: Review submitted
```

---

## 4. REAL-TIME CHAT FLOW

```mermaid
sequenceDiagram
    actor C as Customer
    participant CApp as Customer App
    participant WS as WebSocket Server
    participant Redis as Redis Pub/Sub
    participant DB as PostgreSQL
    participant AI as AI Translation Service
    participant PApp as Provider App
    actor P as Provider

    C->>CApp: Open chat with provider
    CApp->>WS: Connect WebSocket<br/>Authenticate (JWT)
    WS->>Redis: Subscribe to room:customer123-provider456
    WS-->>CApp: Connected

    P->>PApp: Open chat
    PApp->>WS: Connect WebSocket
    WS->>Redis: Subscribe to room:customer123-provider456
    WS-->>PApp: Connected

    C->>CApp: Type "I need plumbing help"
    CApp->>WS: Emit typing event
    WS->>Redis: Publish typing event
    Redis->>WS: Distribute to room subscribers
    WS->>PApp: Show "Customer is typing..."

    C->>CApp: Send message
    CApp->>WS: message: {text: "I need plumbing help", lang: "en"}
    WS->>DB: Save message
    WS->>Redis: Publish message to room
    Redis->>WS: Distribute
    WS->>PApp: Deliver message (Hindi UI user)
    Note over PApp: Display: "I need plumbing help"<br/>(No translation needed, both English)
    WS-->>CApp: Message delivered ✓

    P->>PApp: Reply "मैं 30 मिनट में आ सकता हूं"<br/>(Hindi)
    PApp->>WS: message: {text: "मैं 30 मिनट में आ सकता हूं", lang: "hi"}
    WS->>AI: Translate(text, from: hi, to: en)
    AI-->>WS: "I can come in 30 minutes"
    WS->>DB: Save original + translation
    WS->>Redis: Publish both versions
    Redis->>WS: Distribute
    WS->>CApp: Deliver translated: "I can come in 30 minutes"
    WS-->>PApp: Message sent ✓

    C->>CApp: Share location
    CApp->>WS: message: {type: LOCATION, lat: 26.8467, lng: 80.9462}
    WS->>DB: Save location message
    WS->>Redis: Publish
    Redis->>WS: Distribute
    WS->>PApp: Show location on map
    WS-->>CApp: Location shared ✓

    P->>PApp: Mark messages as read
    PApp->>WS: markAsRead: {messageIds: [...]}
    WS->>DB: Update isRead = true
    WS->>Redis: Publish read receipts
    Redis->>WS: Distribute
    WS->>CApp: Show double checkmarks ✓✓
```

---

## 5. PROVIDER ONBOARDING & VERIFICATION FLOW

```mermaid
flowchart TD
    Start([Provider Downloads App]) --> SignUp[Sign Up with Mobile]
    SignUp --> OTP[Enter OTP]
    OTP --> OTPVerify{OTP Valid?}
    OTPVerify -->|No| OTP
    OTPVerify -->|Yes| BasicInfo[Enter Basic Info<br/>Name, Email, DOB]

    BasicInfo --> BusinessInfo[Enter Business Details<br/>Category, Services, Pricing]
    BusinessInfo --> ServiceArea[Set Service Areas<br/>Location, Radius]
    ServiceArea --> UploadDocs[Upload Documents<br/>Profile Photo, Portfolio]

    UploadDocs --> AadhaarStart{Aadhaar<br/>Verification?}
    AadhaarStart -->|Skip| ProfileReview
    AadhaarStart -->|Verify| EnterAadhaar[Enter Aadhaar Number]

    EnterAadhaar --> AadhaarAPI[Call Aadhaar e-KYC API]
    AadhaarAPI --> AadhaarOTP[Receive OTP on<br/>Aadhaar-registered Mobile]
    AadhaarOTP --> VerifyAadhaarOTP[Enter & Verify OTP]

    VerifyAadhaarOTP --> AadhaarValid{Valid?}
    AadhaarValid -->|No| EnterAadhaar
    AadhaarValid -->|Yes| AutoPopulate[Auto-populate Name, DOB, Address<br/>from Aadhaar]

    AutoPopulate --> SaveMasked[Store Masked Aadhaar<br/>XXXX-XXXX-1234]
    SaveMasked --> AwardBadge[Award 'Aadhaar Verified' Badge]

    AwardBadge --> BGCheck{Background<br/>Check?}
    BGCheck -->|Skip| ProfileReview
    BGCheck -->|Yes| PayBGFee[Pay ₹500-1000 Fee]

    PayBGFee --> InitiateBG[Initiate Background Verification<br/>with Third-Party Agency]
    InitiateBG --> WaitBG[Wait 2-5 Days]
    WaitBG --> BGResult{Verification<br/>Passed?}

    BGResult -->|Failed| Reject[Notify Provider<br/>Cannot Award Badge]
    BGResult -->|Passed| AwardBGBadge[Award 'Background Verified' Badge]

    Reject --> ProfileReview
    AwardBGBadge --> ProfileReview[Submit for Admin Review]

    ProfileReview --> AdminCheck{Admin<br/>Approval}
    AdminCheck -->|Rejected| NotifyFix[Notify Provider<br/>Reason for Rejection]
    NotifyFix --> FixProfile[Provider Fixes Issues]
    FixProfile --> ProfileReview

    AdminCheck -->|Approved| ProfileLive[Profile Goes Live]
    ProfileLive --> Dashboard[Provider Dashboard<br/>Ready to Receive Bookings]
    Dashboard --> End([Start Receiving Requests])
```

---

## 6. PAYMENT FLOW (Multiple Methods)

```mermaid
flowchart TD
    Start([Service Completed]) --> ProviderMark[Provider Marks<br/>'Job Completed']
    ProviderMark --> CustomerConfirm[Customer Confirms<br/>Completion]

    CustomerConfirm --> PaymentMethod{Select Payment<br/>Method}

    PaymentMethod -->|Cash| CashFlow[Customer Pays Cash<br/>to Provider Directly]
    CashFlow --> ProviderConfirmCash[Provider Marks<br/>'Payment Received - Cash']
    ProviderConfirmCash --> RecordCash[API Records Payment<br/>method: CASH, status: COMPLETED]
    RecordCash --> InvoiceCash[Generate Invoice]
    InvoiceCash --> EndCash([Transaction Complete<br/>No Platform Fee])

    PaymentMethod -->|UPI Direct| UPIFlow[Customer Scans<br/>Provider's UPI QR]
    UPIFlow --> CustomerPaysUPI[Customer Completes<br/>Payment in UPI App]
    CustomerPaysUPI --> ProviderConfirmUPI[Provider Confirms<br/>Payment Received]
    ProviderConfirmUPI --> RecordUPI[API Records Payment<br/>method: UPI, status: COMPLETED]
    RecordUPI --> InvoiceUPI[Generate Invoice]
    InvoiceUPI --> EndUPI([Transaction Complete<br/>No Platform Fee])

    PaymentMethod -->|In-App Payment| InAppFlow[Customer Selects<br/>Card/UPI/Wallet]
    InAppFlow --> CreatePaymentIntent[Create Payment Intent<br/>via Razorpay/Stripe]
    CreatePaymentIntent --> ProcessPayment[Process Payment<br/>with Gateway]

    ProcessPayment --> PaymentResult{Payment<br/>Successful?}
    PaymentResult -->|Failed| RetryPayment[Show Error<br/>Retry Payment]
    RetryPayment --> ProcessPayment

    PaymentResult -->|Success| HoldFunds[Platform Holds Funds<br/>in Escrow]
    HoldFunds --> CalculateFees[Calculate Platform Fee<br/>8-15% Commission]
    CalculateFees --> RecordInApp[Record Payment<br/>status: COMPLETED]
    RecordInApp --> ProviderWallet[Credit Provider Wallet<br/>Amount - Platform Fee]
    ProviderWallet --> InvoiceInApp[Generate Invoice<br/>with Fee Breakdown]
    InvoiceInApp --> EndInApp([Transaction Complete<br/>Platform Earns Commission])

    ProviderWallet --> AutoPayout{Auto-Payout<br/>Enabled?}
    AutoPayout -->|Yes| SchedulePayout[Schedule Weekly Payout<br/>to Provider Bank]
    AutoPayout -->|No| ManualWithdraw[Provider Requests<br/>Manual Withdrawal]
    ManualWithdraw --> WithdrawCheck{Balance ≥ ₹500?}
    WithdrawCheck -->|No| WaitMore[Wait for More Earnings]
    WithdrawCheck -->|Yes| ProcessPayout[Process Payout<br/>T+2 Days]
    SchedulePayout --> ProcessPayout
    ProcessPayout --> BankTransfer[Transfer to<br/>Provider's Bank Account]
    BankTransfer --> PayoutComplete([Payout Complete])
```

---

## 7. AI MATCHING & RECOMMENDATION ALGORITHM

```mermaid
flowchart TD
    Start([Customer Searches]) --> InputQuery[Input: Query + Location]
    InputQuery --> ParseQuery[NLP Parse Query<br/>Extract Intent]

    ParseQuery --> IntentType{Query Type}
    IntentType -->|Natural Language| NLP[AI Extracts:<br/>Service Type, Location, Time]
    IntentType -->|Direct Search| Direct[Direct Category:<br/>e.g., 'Plumber']

    NLP --> MapCategory[Map to Service Category<br/>& Sub-category]
    Direct --> MapCategory

    MapCategory --> GeoSearch[Geospatial Search<br/>Providers within Radius]
    GeoSearch --> InitialPool[Initial Provider Pool<br/>n candidates]

    InitialPool --> FilterActive{Active &<br/>Available?}
    FilterActive -->|No| Remove1[Remove from Pool]
    FilterActive -->|Yes| CheckVerification

    CheckVerification --> CalculateScore[Calculate Match Score<br/>for Each Provider]

    CalculateScore --> ScoreFactors[Score = Weighted Sum:<br/>• Rating: 40%<br/>• Verification: 20%<br/>• Response Time: 15%<br/>• Distance: 15%<br/>• Availability: 10%]

    ScoreFactors --> Personalization[Apply Personalization:<br/>• Previous Bookings<br/>• Customer Preferences<br/>• Provider Specialization]

    Personalization --> ReputationBoost{High Reputation<br/>Provider?}
    ReputationBoost -->|Yes| Boost[+10% Score Boost]
    ReputationBoost -->|No| NoBoost[No Boost]

    Boost --> FinalScore
    NoBoost --> FinalScore[Final Match Score<br/>0-100]

    FinalScore --> RankProviders[Rank All Providers<br/>by Score Descending]
    RankProviders --> ApplyFilters[Apply User Filters:<br/>Price, Rating, Distance]

    ApplyFilters --> FinalList[Final Ranked List]
    FinalList --> DisplayTop[Display Top 20 Results]

    DisplayTop --> UserSelects[Customer Selects Provider]
    UserSelects --> LogInteraction[Log Interaction for ML<br/>Improve Future Rankings]
    LogInteraction --> End([Booking Initiated])

    Remove1 --> CalculateScore
```

---

## 8. REPUTATION SCORING ALGORITHM

```mermaid
flowchart TD
    Start([New Review Submitted]) --> FetchProvider[Fetch Provider Profile]

    FetchProvider --> BaseRating[Calculate Base Rating:<br/>Avg of All Star Ratings]
    BaseRating --> CategoryRating[Calculate Category Ratings:<br/>Quality, Punctuality, etc.]

    CategoryRating --> JobsCompleted{Total Jobs<br/>Completed}
    JobsCompleted -->|< 10| NewProvider[New Provider Penalty<br/>-10 Points]
    JobsCompleted -->|10-50| MidProvider[Normal Scoring]
    JobsCompleted -->|> 50| ExperiencedBonus[Experience Bonus<br/>+15 Points]

    NewProvider --> ResponseTime
    MidProvider --> ResponseTime
    ExperiencedBonus --> ResponseTime[Calculate Avg<br/>Response Time]

    ResponseTime --> ResponseScore{Response Time}
    ResponseScore -->|< 10 min| FastBonus[Quick Responder<br/>+10 Points]
    ResponseScore -->|10-60 min| NormalResponse[Normal: 0 Points]
    ResponseScore -->|> 60 min| SlowPenalty[Slow Response<br/>-5 Points]

    FastBonus --> VerificationCheck
    NormalResponse --> VerificationCheck
    SlowPenalty --> VerificationCheck[Check Verification Status]

    VerificationCheck --> AadhaarCheck{Aadhaar<br/>Verified?}
    AadhaarCheck -->|Yes| AadhaarBonus[+10 Points]
    AadhaarCheck -->|No| NoAadhaar[0 Points]

    AadhaarBonus --> BGCheck{Background<br/>Verified?}
    NoAadhaar --> BGCheck
    BGCheck -->|Yes| BGBonus[+10 Points]
    BGCheck -->|No| NoBG[0 Points]

    BGBonus --> CancellationCheck
    NoBG --> CancellationCheck[Check Cancellation Rate]

    CancellationCheck --> CancelRate{Cancellation<br/>Rate}
    CancelRate -->|< 5%| GoodRecord[Excellent: 0 Penalty]
    CancelRate -->|5-10%| ModeratePenalty[-10 Points]
    CancelRate -->|> 10%| HighPenalty[-25 Points]

    GoodRecord --> ConsistencyCheck
    ModeratePenalty --> ConsistencyCheck
    HighPenalty --> ConsistencyCheck[Check Rating Consistency]

    ConsistencyCheck --> Streak{Last 10 Reviews<br/>All 5-Star?}
    Streak -->|Yes| StreakBonus[Consistency Bonus<br/>+10 Points]
    Streak -->|No| NoStreak[0 Points]

    StreakBonus --> TimeDecay
    NoStreak --> TimeDecay[Apply Time Decay:<br/>Recent Reviews Weighted More]

    TimeDecay --> FinalCalc[Final Reputation Score =<br/>Base Rating × 10 +<br/>Job Bonus +<br/>Response Bonus +<br/>Verification Bonus -<br/>Penalties]

    FinalCalc --> NormalizeScore[Normalize to 0-100 Scale]
    NormalizeScore --> UpdateDB[Update Provider Profile<br/>in Database]
    UpdateDB --> RecalculateRank[Recalculate Search Rankings]
    RecalculateRank --> End([Reputation Updated])
```

---

## 9. INFRASTRUCTURE & DEPLOYMENT ARCHITECTURE

```mermaid
graph TB
    subgraph "Users"
        WEB[Web Browsers]
        MOB[Mobile Apps]
    end

    subgraph "CDN & Edge"
        CF[Cloudflare CDN<br/>DDoS Protection<br/>SSL/TLS Termination]
        EDGE[Edge Locations<br/>Static Assets Cache]
    end

    subgraph "AWS Cloud - Production"
        subgraph "Public Subnet"
            ALB[Application Load Balancer<br/>Health Checks, SSL]
            NAT[NAT Gateway]
        end

        subgraph "Private Subnet - Compute"
            ECS1[ECS Cluster - API<br/>Auto-scaling: 2-10 instances]
            ECS2[ECS Cluster - WebSocket<br/>Auto-scaling: 2-8 instances]
            LAMBDA[Lambda Functions<br/>Background Jobs, Scheduled Tasks]
        end

        subgraph "Private Subnet - Data"
            RDS[(RDS PostgreSQL<br/>Multi-AZ, Read Replicas)]
            REDIS[(ElastiCache Redis<br/>Cluster Mode)]
            ES[(Elasticsearch<br/>3-node Cluster)]
        end

        subgraph "Storage"
            S3[S3 Buckets<br/>User Uploads, Backups]
            S3CF[S3 + CloudFront<br/>Static Assets]
        end

        subgraph "Monitoring & Logging"
            CW[CloudWatch<br/>Logs, Metrics, Alarms]
            SENTRY[Sentry<br/>Error Tracking]
            DD[DataDog<br/>APM, Traces]
        end
    end

    subgraph "Third-Party SaaS"
        RAZORPAY[Razorpay<br/>Payment Gateway]
        TWILIO[Twilio/MSG91<br/>SMS, OTP]
        AGORA[Agora.io<br/>Voice/Video]
        FCM[Firebase FCM<br/>Push Notifications]
        OPENAI[OpenAI API<br/>GPT-4, AI Services]
        GMAPS[Google Maps API<br/>Geocoding, Directions]
    end

    subgraph "CI/CD Pipeline"
        GH[GitHub Repository]
        GHA[GitHub Actions<br/>Build, Test, Deploy]
        ECR[AWS ECR<br/>Docker Registry]
    end

    WEB --> CF
    MOB --> CF
    CF --> EDGE
    EDGE --> ALB

    ALB --> ECS1
    ALB --> ECS2

    ECS1 --> RDS
    ECS1 --> REDIS
    ECS1 --> ES
    ECS1 --> S3

    ECS2 --> REDIS
    ECS2 --> RDS

    LAMBDA --> RDS
    LAMBDA --> S3

    ECS1 --> NAT
    ECS2 --> NAT
    NAT --> RAZORPAY
    NAT --> TWILIO
    NAT --> AGORA
    NAT --> FCM
    NAT --> OPENAI
    NAT --> GMAPS

    ECS1 --> CW
    ECS2 --> CW
    LAMBDA --> CW
    CW --> DD
    ECS1 --> SENTRY
    ECS2 --> SENTRY

    GH --> GHA
    GHA --> ECR
    GHA --> ECS1
    GHA --> ECS2
```

---

## 10. CI/CD PIPELINE FLOW

```mermaid
flowchart LR
    DEV[Developer Commits Code] --> PUSH[Push to GitHub]
    PUSH --> TRIGGER{Branch?}

    TRIGGER -->|feature/*| FeatureCI[Run Feature Branch CI]
    TRIGGER -->|develop| DevCI[Run Dev CI]
    TRIGGER -->|main| ProdCI[Run Prod CI]

    FeatureCI --> Lint1[ESLint + Prettier]
    DevCI --> Lint2[ESLint + Prettier]
    ProdCI --> Lint3[ESLint + Prettier]

    Lint1 --> TypeCheck1[TypeScript Check]
    Lint2 --> TypeCheck2[TypeScript Check]
    Lint3 --> TypeCheck3[TypeScript Check]

    TypeCheck1 --> UnitTest1[Unit Tests - Jest]
    TypeCheck2 --> UnitTest2[Unit Tests - Jest]
    TypeCheck3 --> UnitTest3[Unit Tests - Jest]

    UnitTest1 --> IntTest1[Integration Tests]
    UnitTest2 --> IntTest2[Integration Tests]
    UnitTest3 --> IntTest3[Integration Tests]

    IntTest1 --> EndFeature[Report Status<br/>Do Not Deploy]

    IntTest2 --> BuildDev[Build Docker Image]
    BuildDev --> PushECRDev[Push to ECR<br/>Tag: dev-latest]
    PushECRDev --> DeployDev[Deploy to Dev/Staging<br/>ECS Service Update]
    DeployDev --> HealthCheckDev{Health Check}
    HealthCheckDev -->|Failed| RollbackDev[Rollback to Previous]
    HealthCheckDev -->|Success| NotifyDev[Notify Slack/Teams]

    IntTest3 --> BuildProd[Build Docker Image]
    BuildProd --> SecurityScan[Trivy Security Scan]
    SecurityScan --> ScanResult{Vulnerabilities?}
    ScanResult -->|Critical| FailPipeline[Fail Pipeline<br/>Notify Team]
    ScanResult -->|None/Low| PushECRProd[Push to ECR<br/>Tag: prod-v1.2.3]

    PushECRProd --> ManualApproval{Manual<br/>Approval?}
    ManualApproval -->|Rejected| CancelDeploy[Cancel Deployment]
    ManualApproval -->|Approved| DeployProd[Deploy to Production<br/>Blue-Green Deployment]

    DeployProd --> HealthCheckProd{Health Check}
    HealthCheckProd -->|Failed| RollbackProd[Automatic Rollback]
    HealthCheckProd -->|Success| SwitchTraffic[Switch Traffic to Green]

    SwitchTraffic --> MonitorMetrics[Monitor Metrics 5 min]
    MonitorMetrics --> MetricsOK{Metrics<br/>Normal?}
    MetricsOK -->|No| RollbackProd
    MetricsOK -->|Yes| DecommissionBlue[Decommission Blue Environment]
    DecommissionBlue --> NotifySuccess[Notify Success<br/>Update Release Notes]
    NotifySuccess --> TagRelease[Create Git Tag<br/>v1.2.3]
```

---

These diagrams provide a comprehensive visual representation of the LocalPro Connect platform architecture, flows, and infrastructure. Ready to proceed with implementation once you answer the confirmation questions in the PRD!
