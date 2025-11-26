/**
 * tRPC Client Configuration
 * Type-safe client setup for AvailX frontend
 */

import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
import { AppRouter } from 'api'
import superjson from 'superjson'

export const trpc = createTRPCReact<AppRouter>()

function getBaseUrl() {
  if (typeof window !== 'undefined') return '' // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}` // dev SSR should use localhost
}

export function getTRPCClient() {
  return trpc.createClient({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        headers() {
          const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
          return {
            authorization: token ? `Bearer ${token}` : '',
          }
        },
      }),
    ],
  })
}
