/**
 * LocalPro Connect API
 * Main tRPC router export
 */

import { router } from './src/trpc';
import { authRouter } from './src/routers/auth';
import { searchRouter } from './src/routers/search';
import { bookingRouter } from './src/routers/booking';
import { providerRouter } from './src/routers/provider';

/**
 * Main application router
 *
 * This aggregates all feature routers:
 * - auth: Authentication and authorization
 * - search: Legacy search with client-side distance filtering
 * - provider: PostGIS-based geospatial provider search (NEW)
 * - booking: Booking management
 */
export const appRouter = router({
  auth: authRouter,
  search: searchRouter,
  provider: providerRouter, // NEW: PostGIS-based radius search
  booking: bookingRouter,
});

export type AppRouter = typeof appRouter;

// Re-export types and utilities
export * from './src/trpc';
export * from './src/context';
