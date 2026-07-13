'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { authApi, tokenStore } from '@/lib/api'
import type { AuthResponse, LoginRequest, RegisterRequest, Role } from '@/types'

interface AuthUser {
  name: string
  email: string
  role: Role
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (creds: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('hwms_user')
      const token = tokenStore.get()
      if (stored && token) {
        setUser(JSON.parse(stored))
      }
    } catch {
      tokenStore.clear()
      localStorage.removeItem('hwms_user')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const persist = (res: AuthResponse) => {
    tokenStore.set(res.token)
    const u: AuthUser = { name: res.name, email: res.email, role: res.role }
    localStorage.setItem('hwms_user', JSON.stringify(u))
    setUser(u)
  }

  const login = useCallback(async (creds: LoginRequest) => {
    setError(null)
    try {
      const res = await authApi.login(creds)
      persist(res)
    } catch (e) {
      setError((e as Error).message)
      throw e
    }
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    setError(null)
    try {
      await authApi.register(data)
    } catch (e) {
      setError((e as Error).message)
      throw e
    }
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    localStorage.removeItem('hwms_user')
    setUser(null)
    setError(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      error,
      clearError: () => setError(null),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
  