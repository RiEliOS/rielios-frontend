export interface User {
  id: string
  email: string
  createdAt: string
  profile?: {
    fullName: string | null
    phone: string | null
    avatarUrl: string | null
    timezone: string | null
    currency: string | null
    theme: string | null
  }
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
}

export interface RegisterPayload {
  email: string
  password: string
  fullName: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}
