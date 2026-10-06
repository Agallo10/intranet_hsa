import type { UserDto } from './types'

const ACCESS_KEY = 'intranet_access_token'
const REFRESH_KEY = 'intranet_refresh_token'
const USER_KEY = 'intranet_user'
const FILE_KEY = 'intranet_file_token'
const FILE_EXP_KEY = 'intranet_file_token_exp'
const SESSION_EXPIRED_KEY = 'intranet_session_expired'

function decodeJwtExp(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = JSON.parse(atob(base64)) as { exp?: number }
    return typeof json.exp === 'number' ? json.exp * 1000 : null
  } catch {
    return null
  }
}

export const tokenStore = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY)
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY)
  },
  getFileToken(): string | null {
    return localStorage.getItem(FILE_KEY)
  },
  isFileTokenValid(): boolean {
    const token = localStorage.getItem(FILE_KEY)
    const expRaw = localStorage.getItem(FILE_EXP_KEY)
    if (!token || !expRaw) return false
    return Date.now() < Number(expRaw) - 60 * 1000
  },
  getUser(): UserDto | null {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as UserDto
    } catch {
      return null
    }
  },
  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_KEY, accessToken)
    localStorage.setItem(REFRESH_KEY, refreshToken)
  },
  setFileToken(token: string): void {
    localStorage.setItem(FILE_KEY, token)
    const exp = decodeJwtExp(token)
    if (exp) localStorage.setItem(FILE_EXP_KEY, String(exp))
    else localStorage.removeItem(FILE_EXP_KEY)
  },
  setUser(user: UserDto): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  consumeSessionExpired(): boolean {
    const flag = localStorage.getItem(SESSION_EXPIRED_KEY)
    localStorage.removeItem(SESSION_EXPIRED_KEY)
    return flag === '1'
  },
  markSessionExpired(): void {
    localStorage.setItem(SESSION_EXPIRED_KEY, '1')
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(FILE_KEY)
    localStorage.removeItem(FILE_EXP_KEY)
  },
}

export function authedUrl(path: string): string {
  const token = tokenStore.isFileTokenValid()
    ? tokenStore.getFileToken()
    : tokenStore.getAccessToken()
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}token=${encodeURIComponent(token ?? '')}`
}
