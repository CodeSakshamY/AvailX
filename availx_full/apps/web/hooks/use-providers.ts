/**
 * Custom Provider Search Hooks
 * Wraps tRPC provider search and profile queries
 */

import { trpc } from '@/lib/trpc'

export function useSearchProviders(params: {
  query?: string
  latitude?: number
  longitude?: number
  radiusKm?: number
  categoryId?: string
}) {
  return trpc.provider.searchByRadius.useQuery(params, {
    enabled: !!params.latitude && !!params.longitude,
  })
}

export function useProviderProfile(providerId: string) {
  return trpc.provider.getProfile.useQuery({ providerId }, {
    enabled: !!providerId,
  })
}

export function useFeaturedProviders() {
  return trpc.provider.getFeatured.useQuery()
}

export function useProviderServices(providerId: string) {
  return trpc.services.getByProvider.useQuery({ providerId }, {
    enabled: !!providerId,
  })
}
