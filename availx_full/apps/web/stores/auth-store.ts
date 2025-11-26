/**
 * Auth Store (Zustand)
 * Global authentication state management
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  phone: string
  name: string
  email?: string
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN'
  isVerified: boolean
}

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean

  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token)
        }
        set({ user, token, isAuthenticated: true })
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken')
        }
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
)
