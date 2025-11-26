/**
 * tRPC API Route Handler
 * Handles all tRPC requests in Next.js app router
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from 'api'
import { createTRPCContext } from 'api'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  })

export { handler as GET, handler as POST }
