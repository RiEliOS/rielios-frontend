import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthState, User } from '@/types/auth'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user: User) => {
        set({ user, isAuthenticated: true })
      },

      clearAuth: () => {
        set({ user: null, isAuthenticated: false })
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'rielios-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
