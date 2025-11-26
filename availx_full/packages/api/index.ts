/**
 * AvailX API
 * Main tRPC router export
 * Complete MVP Backend API Layer
 */

import { router } from './src/trpc';
import { authRouter } from './src/routers/auth';
import { searchRouter } from './src/routers/search';
import { bookingRouter } from './src/routers/booking';
import { providerRouter } from './src/routers/provider';
import { servicesRouter } from './src/routers/services';
import { reviewsRouter } from './src/routers/reviews';
import { paymentsRouter } from './src/routers/payments';
import { notificationsRouter } from './src/routers/notifications';
import { aiRouter } from './src/routers/ai';
import { chatRouter } from './src/routers/chat';
import { adminRouter } from './src/routers/admin';

/**
 * Main application router
 *
 * This aggregates all feature routers for the AvailX MVP:
 *
 * Core Features:
 * - auth: Authentication and authorization (login, signup, OTP, profile management)
 * - search: Legacy search with client-side distance filtering
 * - provider: PostGIS-based geospatial provider search & management
 * - booking: Complete booking lifecycle management
 * - services: Categories, subcategories, and service listings
 * - reviews: Customer reviews and ratings system
 *
 * Advanced Features:
 * - payments: Payment processing with Stripe/Razorpay integration
 * - notifications: Push, SMS, and email notification system
 * - ai: AI-powered assistant, insights, auto-reply, and smart matching
 * - chat: Real-time messaging between customers and providers
 *
 * Admin:
 * - admin: Admin dashboard, user management, and provider verification
 */
export const appRouter = router({
  // Core features
  auth: authRouter,
  search: searchRouter,
  provider: providerRouter,
  booking: bookingRouter,
  services: servicesRouter,
  reviews: reviewsRouter,

  // Advanced features
  payments: paymentsRouter,
  notifications: notificationsRouter,
  ai: aiRouter,
  chat: chatRouter,

  // Admin
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;

// Re-export types and utilities
export * from './src/trpc';
export * from './src/context';
