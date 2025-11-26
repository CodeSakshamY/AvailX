/**
 * Provider Store (Zustand)
 * Manages provider onboarding and profile state
 */

import { create } from 'zustand'

interface ProviderOnboarding {
  step: number
  businessName?: string
  categories?: string[]
  services?: Array<{
    name: string
    price: number
    duration: number
  }>
  workRadius?: number
  availability?: Record<string, boolean>
  documents?: {
    aadhaar?: string
    photo?: string
    certificate?: string
  }
}

interface ProviderStore {
  onboarding: ProviderOnboarding
  isOnboardingComplete: boolean

  setOnboardingStep: (step: number) => void
  updateOnboarding: (data: Partial<ProviderOnboarding>) => void
  clearOnboarding: () => void
  completeOnboarding: () => void
}

export const useProviderStore = create<ProviderStore>((set) => ({
  onboarding: {
    step: 1,
  },
  isOnboardingComplete: false,

  setOnboardingStep: (step) =>
    set((state) => ({
      onboarding: { ...state.onboarding, step },
    })),

  updateOnboarding: (data) =>
    set((state) => ({
      onboarding: { ...state.onboarding, ...data },
    })),

  clearOnboarding: () =>
    set({
      onboarding: { step: 1 },
      isOnboardingComplete: false,
    }),

  completeOnboarding: () =>
    set({ isOnboardingComplete: true }),
}))
