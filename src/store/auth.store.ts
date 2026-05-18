import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthState, User } from '@/types/auth'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user: User, token: string) => {
        localStorage.setItem('token', token)
        set({ user, token, isAuthenticated: true })
      },

      clearAuth: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'rielios-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)
