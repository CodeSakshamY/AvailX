/**
 * Booking Store (Zustand)
 * Manages booking flow and temporary booking data
 */

import { create } from 'zustand'

interface BookingData {
  providerId?: string
  serviceId?: string
  scheduledFor?: Date
  notes?: string
  location?: {
    lat: number
    lng: number
    address: string
  }
}

interface BookingStore {
  currentBooking: BookingData
  step: number

  setBookingData: (data: Partial<BookingData>) => void
  clearBooking: () => void
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
}

export const useBookingStore = create<BookingStore>((set) => ({
  currentBooking: {},
  step: 1,

  setBookingData: (data) =>
    set((state) => ({
      currentBooking: { ...state.currentBooking, ...data },
    })),

  clearBooking: () =>
    set({
      currentBooking: {},
      step: 1,
    }),

  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),
}))
