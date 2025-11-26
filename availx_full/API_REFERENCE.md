# AvailX Complete API Reference

**Phase 3 Complete** - Full tRPC Backend API Layer for AvailX MVP

This document provides a complete reference of all tRPC endpoints available in the AvailX backend.

## Table of Contents

1. [Auth Router](#auth-router)
2. [Provider Router](#provider-router)
3. [Services Router](#services-router)
4. [Booking Router](#booking-router)
5. [Reviews Router](#reviews-router)
6. [Payments Router](#payments-router)
7. [Notifications Router](#notifications-router)
8. [AI Router](#ai-router)
9. [Chat Router](#chat-router)
10. [Admin Router](#admin-router)

---

## Auth Router

### 1. `auth.sendOTP`
**Type:** Mutation
**Access:** Public
**Description:** Send OTP for login/signup/verification

**Input:**
```typescript
{
  phone: string;
  purpose: 'LOGIN' | 'SIGNUP' | 'VERIFICATION';
}
```

**Output:**
```typescript
{
  success: boolean;
  message: string;
  otp?: string; // Only in development
}
```

---

### 2. `auth.signUp`
**Type:** Mutation
**Access:** Public
**Description:** Register a new user (customer or provider)

**Input:**
```typescript
{
  phone: string;
  name: string;
  email?: string;
  role: 'CUSTOMER' | 'PROVIDER';
  password?: string;
}
```

**Output:**
```typescript
{
  user: User;
  token: string;
}
```

---

### 3. `auth.verifyPhone`
**Type:** Mutation
**Access:** Public
**Description:** Verify phone number with OTP

**Input:**
```typescript
{
  phone: string;
  otp: string;
}
```

**Output:**
```typescript
{
  user: User;
  token: string;
}
```

---

### 4. `auth.login`
**Type:** Mutation
**Access:** Public
**Description:** Login with phone and password/OTP

**Input:**
```typescript
{
  phone: string;
  password?: string;
  otp?: string;
}
```

**Output:**
```typescript
{
  user: User;
  token: string;
}
```

---

### 5. `auth.me`
**Type:** Query
**Access:** Protected
**Description:** Get current user profile

**Output:**
```typescript
{
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: UserRole;
  phoneVerified: boolean;
  customerProfile?: CustomerProfile;
  providerProfile?: ProviderProfile;
}
```

---

### 6. `auth.logout`
**Type:** Mutation
**Access:** Protected
**Description:** Logout current user

**Output:**
```typescript
{
  success: boolean;
}
```

---

### 7. `auth.updateProfile`
**Type:** Mutation
**Access:** Protected
**Description:** Update user profile

**Input:**
```typescript
{
  name?: string;
  email?: string;
  profilePhoto?: string;
}
```

---

### 8. `auth.changePassword`
**Type:** Mutation
**Access:** Protected
**Description:** Change user password

**Input:**
```typescript
{
  currentPassword: string;
  newPassword: string;
}
```

---

### 9. `auth.getCurrentUser`
**Type:** Query
**Access:** Protected
**Description:** Get detailed current user info with profiles

---

## Provider Router

### 1. `provider.searchByRadius`
**Type:** Query
**Access:** Public
**Description:** Search providers within a radius using PostGIS

**Input:**
```typescript
{
  latitude: number;
  longitude: number;
  radiusKm?: number; // Default: 10, Max: 100
  categoryId?: string;
  minRating?: number;
  aadhaarVerified?: boolean;
  backgroundVerified?: boolean;
  sortBy?: 'distance' | 'rating' | 'reputation' | 'response_time';
  page?: number;
  limit?: number;
}
```

**Output:**
```typescript
{
  providers: Provider[];
  pagination: PaginationInfo;
  searchCenter: { latitude, longitude, radiusKm };
}
```

---

### 2. `provider.searchByBoundingBox`
**Type:** Query
**Access:** Public
**Description:** Search providers within map viewport

**Input:**
```typescript
{
  northEast: { latitude: number; longitude: number };
  southWest: { latitude: number; longitude: number };
  categoryId?: string;
  minRating?: number;
  limit?: number;
}
```

---

### 3. `provider.findNearest`
**Type:** Query
**Access:** Public
**Description:** Find N nearest providers to a location

**Input:**
```typescript
{
  latitude: number;
  longitude: number;
  categoryId?: string;
  limit?: number; // Default: 10
}
```

---

### 4. `provider.getAreaStats`
**Type:** Query
**Access:** Public
**Description:** Get provider statistics in an area

**Input:**
```typescript
{
  latitude: number;
  longitude: number;
  radiusKm?: number;
}
```

**Output:**
```typescript
{
  area: { latitude, longitude, radiusKm };
  stats: {
    totalProviders: number;
    averageRating: number;
    aadhaarVerifiedCount: number;
    backgroundVerifiedCount: number;
  };
  categoriesDistribution: Array<{ categoryId, count }>;
}
```

---

### 5. `provider.createProfile`
**Type:** Mutation
**Access:** Provider
**Description:** Create or update provider profile

**Input:**
```typescript
{
  businessName?: string;
  description: string;
  categoryId: string;
  subCategoryIds: string[];
  baseLocation: { address: string; lat: number; lng: number };
  pricing: {
    hourlyRate?: number;
    fixedPrice?: number;
    custom?: string;
  };
  workingHours?: Record<string, TimeSlot>;
}
```

---

### 6. `provider.uploadDocument`
**Type:** Mutation
**Access:** Provider
**Description:** Upload verification documents

**Input:**
```typescript
{
  type: 'AADHAAR' | 'PAN' | 'CERTIFICATION' | 'ID_PROOF' | 'ADDRESS_PROOF' | 'POLICE_CLEARANCE';
  url: string;
  title?: string;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
}
```

---

### 7. `provider.submitForVerification`
**Type:** Mutation
**Access:** Provider
**Description:** Submit provider profile for admin verification

---

### 8. `provider.setWorkRadius`
**Type:** Mutation
**Access:** Provider
**Description:** Set service area radius

**Input:**
```typescript
{
  lat: number;
  lng: number;
  radiusKm: number; // Min: 1, Max: 50
}
```

---

### 9. `provider.setAvailabilityCalendar`
**Type:** Mutation
**Access:** Provider
**Description:** Set availability for specific date

**Input:**
```typescript
{
  date: string; // ISO datetime
  slots: Array<{
    start: string; // HH:MM
    end: string;   // HH:MM
    isAvailable: boolean;
  }>;
}
```

---

### 10. `provider.addService`
**Type:** Mutation
**Access:** Provider
**Description:** Add a service offering

**Input:**
```typescript
{
  name: string;
  description: string;
  pricing: {
    amount: number;
    unit: 'HOURLY' | 'FIXED' | 'PER_UNIT';
  };
  duration?: number; // in minutes
}
```

---

### 11. `provider.updateService`
**Type:** Mutation
**Access:** Provider
**Description:** Update a service

---

### 12. `provider.removeService`
**Type:** Mutation
**Access:** Provider
**Description:** Remove a service

---

### 13. `provider.getDashboardStats`
**Type:** Query
**Access:** Provider
**Description:** Get provider dashboard statistics

**Output:**
```typescript
{
  stats: {
    totalJobs: number;
    completedJobs: number;
    cancelledJobs: number;
    averageRating: number;
    reputationScore: number;
    responseTimeSeconds: number;
    bookingsByStatus: Record<string, number>;
  };
  recentBookings: Booking[];
  recentReviews: Review[];
  profile: ProviderProfile;
}
```

---

### 14. `provider.getById`
**Type:** Query
**Access:** Public
**Description:** Get provider details by ID

**Input:**
```typescript
{
  providerId: string;
}
```

---

## Services Router

### 1. `services.listCategories`
**Type:** Query
**Access:** Public
**Description:** List all active service categories

---

### 2. `services.getCategory`
**Type:** Query
**Access:** Public
**Description:** Get category by ID or slug

**Input:**
```typescript
{
  categoryId?: string;
  slug?: string;
}
```

---

### 3. `services.listSubcategories`
**Type:** Query
**Access:** Public
**Description:** List subcategories for a category

**Input:**
```typescript
{
  categoryId: string;
}
```

---

### 4. `services.searchServices`
**Type:** Query
**Access:** Public
**Description:** Search services and categories

**Input:**
```typescript
{
  query: string; // Min: 2 chars
  limit?: number;
}
```

---

### 5. `services.getServicesByProvider`
**Type:** Query
**Access:** Public
**Description:** Get services offered by a provider

**Input:**
```typescript
{
  providerId: string;
}
```

---

## Booking Router

### 1. `booking.create`
**Type:** Mutation
**Access:** Customer
**Description:** Create a new booking

**Input:**
```typescript
{
  providerId: string;
  serviceType: string;
  serviceLocation: { address: string; lat: number; lng: number };
  scheduledDate: string; // ISO datetime
  scheduledTime: { start: string; end: string };
  specialInstructions?: string;
  quotedPrice?: number;
}
```

---

### 2. `booking.getById`
**Type:** Query
**Access:** Protected
**Description:** Get booking details by ID

---

### 3. `booking.listForCustomer`
**Type:** Query
**Access:** Customer
**Description:** List customer's bookings

**Input:**
```typescript
{
  status?: BookingStatus;
  page?: number;
  limit?: number;
}
```

---

### 4. `booking.listForProvider`
**Type:** Query
**Access:** Provider
**Description:** List provider's bookings

---

### 5. `booking.accept`
**Type:** Mutation
**Access:** Provider
**Description:** Accept a booking request

---

### 6. `booking.reject`
**Type:** Mutation
**Access:** Provider
**Description:** Reject a booking request

---

### 7. `booking.start`
**Type:** Mutation
**Access:** Provider
**Description:** Mark booking as in-progress

---

### 8. `booking.complete`
**Type:** Mutation
**Access:** Provider
**Description:** Mark booking as completed

---

### 9. `booking.cancel`
**Type:** Mutation
**Access:** Protected
**Description:** Cancel a booking

**Input:**
```typescript
{
  bookingId: string;
  reason: string;
}
```

---

### 10. `booking.reschedule`
**Type:** Mutation
**Access:** Protected
**Description:** Reschedule a booking

**Input:**
```typescript
{
  bookingId: string;
  scheduledDate: string;
  scheduledTime: { start: string; end: string };
  reason?: string;
}
```

---

## Reviews Router

### 1. `reviews.addReview`
**Type:** Mutation
**Access:** Customer
**Description:** Add a review for a completed booking

**Input:**
```typescript
{
  bookingId: string;
  overallRating: number; // 1-5
  qualityRating?: number;
  punctualityRating?: number;
  professionalismRating?: number;
  valueRating?: number;
  comment?: string;
  photos?: string[];
}
```

---

### 2. `reviews.editReview`
**Type:** Mutation
**Access:** Customer
**Description:** Edit an existing review

---

### 3. `reviews.deleteReview`
**Type:** Mutation
**Access:** Customer
**Description:** Delete a review

---

### 4. `reviews.getReviewsForProvider`
**Type:** Query
**Access:** Public
**Description:** Get reviews for a provider

**Input:**
```typescript
{
  providerId: string;
  page?: number;
  limit?: number;
}
```

---

### 5. `reviews.getRatingsSummary`
**Type:** Query
**Access:** Public
**Description:** Get ratings summary for a provider

**Output:**
```typescript
{
  averageRating: number;
  totalReviews: number;
  categoryAverages: {
    quality: number;
    punctuality: number;
    professionalism: number;
    value: number;
  };
  ratingDistribution: Array<{ rating: number; count: number }>;
}
```

---

### 6. `reviews.respondToReview`
**Type:** Mutation
**Access:** Provider
**Description:** Provider responds to a review

**Input:**
```typescript
{
  reviewId: string;
  response: string;
}
```

---

## Payments Router

### 1. `payments.createPaymentIntent`
**Type:** Mutation
**Access:** Protected
**Description:** Create Stripe/Razorpay payment intent

**Input:**
```typescript
{
  bookingId: string;
  amount: number;
  currency?: string; // Default: INR
}
```

**Output:**
```typescript
{
  paymentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
}
```

---

### 2. `payments.confirmPayment`
**Type:** Mutation
**Access:** Protected
**Description:** Confirm a payment

---

### 3. `payments.recordPayment`
**Type:** Mutation
**Access:** Protected
**Description:** Record cash/UPI payment

**Input:**
```typescript
{
  bookingId: string;
  amount: number;
  method: 'CASH' | 'UPI' | 'CARD' | 'WALLET';
  transactionId?: string;
}
```

---

### 4. `payments.refundPayment`
**Type:** Mutation
**Access:** Protected
**Description:** Refund a payment

**Input:**
```typescript
{
  paymentId: string;
  amount?: number;
  reason: string;
}
```

---

### 5. `payments.getTransactionHistory`
**Type:** Query
**Access:** Protected
**Description:** Get payment transaction history

---

### 6. `payments.calculatePlatformFee`
**Type:** Query
**Access:** Protected
**Description:** Calculate platform fee (10%)

**Input:**
```typescript
{
  amount: number;
}
```

**Output:**
```typescript
{
  platformFee: number;
  providerEarnings: number;
}
```

---

### 7. `payments.getEarningsSummary`
**Type:** Query
**Access:** Provider
**Description:** Get earnings summary for provider

---

## Notifications Router

### 1. `notifications.sendBookingConfirmation`
**Type:** Mutation
**Access:** Protected
**Description:** Send booking confirmation notification

---

### 2. `notifications.sendProviderAlert`
**Type:** Mutation
**Access:** Protected
**Description:** Send alert to provider

---

### 3. `notifications.sendPaymentSuccess`
**Type:** Mutation
**Access:** Protected
**Description:** Send payment success notification

---

### 4. `notifications.sendReviewReminder`
**Type:** Mutation
**Access:** Protected
**Description:** Send review reminder to customer

---

### 5. `notifications.updateNotificationPreferences`
**Type:** Mutation
**Access:** Protected
**Description:** Update notification preferences

**Input:**
```typescript
{
  email?: boolean;
  push?: boolean;
  sms?: boolean;
  bookingUpdates?: boolean;
  messages?: boolean;
  promotions?: boolean;
}
```

---

### 6. `notifications.getNotifications`
**Type:** Query
**Access:** Protected
**Description:** Get user notifications

**Input:**
```typescript
{
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}
```

---

### 7. `notifications.markAsRead`
**Type:** Mutation
**Access:** Protected
**Description:** Mark notifications as read

---

## AI Router

### 1. `ai.askAssistant`
**Type:** Mutation
**Access:** Protected
**Description:** Ask AI assistant a question

**Input:**
```typescript
{
  query: string;
  context?: Record<string, any>;
  conversationId?: string;
}
```

**Output:**
```typescript
{
  response: string;
  conversationId: string;
  suggestions?: string[];
}
```

---

### 2. `ai.providerInsights`
**Type:** Query
**Access:** Provider
**Description:** Get AI-powered provider insights

**Input:**
```typescript
{
  providerId?: string;
  period?: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
}
```

---

### 3. `ai.autoReplySuggestions`
**Type:** Mutation
**Access:** Protected
**Description:** Get AI auto-reply suggestions for chat

**Input:**
```typescript
{
  messageContent: string;
  chatRoomId: string;
}
```

**Output:**
```typescript
{
  suggestions: string[];
}
```

---

### 4. `ai.smartMatching`
**Type:** Mutation
**Access:** Protected
**Description:** AI-powered smart provider matching

**Input:**
```typescript
{
  serviceType: string;
  location: { lat: number; lng: number };
  requirements?: string;
  budget?: number;
}
```

**Output:**
```typescript
{
  matches: Array<{
    providerId: string;
    score: number;
    reasoning: string;
    matchFactors: {
      distanceScore: number;
      ratingScore: number;
      availabilityScore: number;
      priceScore: number;
      experienceScore: number;
    };
    provider: Provider;
  }>;
  totalFound: number;
}
```

---

## Chat Router

### 1. `chat.createChatSession`
**Type:** Mutation
**Access:** Protected
**Description:** Create or get chat session

**Input:**
```typescript
{
  recipientId: string;
  bookingId?: string;
}
```

---

### 2. `chat.sendMessage`
**Type:** Mutation
**Access:** Protected
**Description:** Send a chat message

**Input:**
```typescript
{
  chatRoomId?: string;
  recipientId: string;
  type: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VOICE' | 'LOCATION';
  content?: string;
  mediaUrl?: string;
  location?: { lat: number; lng: number; address: string };
}
```

---

### 3. `chat.getMessages`
**Type:** Query
**Access:** Protected
**Description:** Get chat messages

**Input:**
```typescript
{
  chatRoomId: string;
  limit?: number;
  cursor?: string; // For pagination
}
```

---

### 4. `chat.markRead`
**Type:** Mutation
**Access:** Protected
**Description:** Mark messages as read

---

### 5. `chat.getChatRooms`
**Type:** Query
**Access:** Protected
**Description:** Get all chat rooms for user

---

## Admin Router

### 1. `admin.getAllUsers`
**Type:** Query
**Access:** Admin
**Description:** Get all users with filtering

---

### 2. `admin.getAllProviders`
**Type:** Query
**Access:** Admin
**Description:** Get all providers with filtering

---

### 3. `admin.approveProvider`
**Type:** Mutation
**Access:** Admin
**Description:** Approve or reject provider

**Input:**
```typescript
{
  providerId: string;
  approved: boolean;
  rejectionReason?: string;
}
```

---

### 4. `admin.verifyProviderDocuments`
**Type:** Mutation
**Access:** Admin
**Description:** Verify provider documents

---

### 5. `admin.blockUser`
**Type:** Mutation
**Access:** Admin
**Description:** Block a user

---

### 6. `admin.blockProvider`
**Type:** Mutation
**Access:** Admin
**Description:** Block a provider

---

### 7. `admin.getDashboardStats`
**Type:** Query
**Access:** Admin
**Description:** Get admin dashboard statistics

---

### 8. `admin.getAdminLogs`
**Type:** Query
**Access:** Admin
**Description:** Get admin action logs

---

## Summary

**Total Endpoints:** 100+

**Routers:**
- Auth: 9 endpoints
- Provider: 14 endpoints
- Services: 5 endpoints
- Booking: 10 endpoints
- Reviews: 6 endpoints
- Payments: 7 endpoints
- Notifications: 7 endpoints
- AI: 4 endpoints
- Chat: 5 endpoints
- Admin: 8 endpoints

**Technologies:**
- tRPC v10
- Prisma ORM
- PostgreSQL + PostGIS
- Zod validation
- TypeScript
- Superjson transformer

**Authentication:**
- JWT-based
- Role-based access control (Customer, Provider, Admin)
- Protected, customer-only, provider-only, and admin-only procedures

All endpoints are fully type-safe and production-ready! 🚀
