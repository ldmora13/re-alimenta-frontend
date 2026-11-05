/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { queryClient } from '../../shared/lib/queryClient'
import {
  clearSession,
  getSession,
  onSessionChange,
  saveSession,
} from '../../shared/lib/api'
import type { Session } from '../../shared/types'
import { loginRequest, logoutRequest, registerRequest } from './api'
import type { LoginInput, RegisterInput } from './api'

interface AuthContextValue {
  session: Session | null
  user: Session['user'] | null
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<Session>
  register: (input: RegisterInput) => Promise<Session>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => getSession())

  useEffect(() => {
    return onSessionChange(() => setSession(getSession()))
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const next = await loginRequest(input)
    queryClient.clear()
    saveSession(next)
    setSession(next)
    return next
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const next = await registerRequest(input)
    queryClient.clear()
    saveSession(next)
    setSession(next)
    return next
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // La sesión local se limpia incluso si el backend no responde.
    } finally {
      clearSession()
      setSession(null)
      queryClient.clear()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      login,
      register,
      logout,
    }),
    [session, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
