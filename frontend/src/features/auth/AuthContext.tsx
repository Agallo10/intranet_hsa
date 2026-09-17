import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../../lib/api'
import { tokenStore } from '../../lib/token'
import type { LoginResponse, UserDto } from '../../lib/types'

interface AuthContextValue {
  user: UserDto | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<UserDto>
  logout: () => void
  updateUser: (user: UserDto) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(() => tokenStore.getUser())

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post<LoginResponse>('/auth/login', {
      username,
      password,
    })
    const { accessToken, refreshToken, user } = res.data
    tokenStore.setTokens(accessToken, refreshToken)
    tokenStore.setUser(user)
    setUser(user)
    return user
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  const updateUser = useCallback((next: UserDto) => {
    tokenStore.setUser(next)
    setUser(next)
  }, [])

  const value = useMemo(
    () => ({ user, isAuthenticated: user !== null, login, logout, updateUser }),
    [user, login, logout, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return ctx
}
