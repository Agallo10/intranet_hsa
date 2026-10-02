import type { UserDto } from './types'

const ACCESS_KEY = 'intranet_access_token'
const REFRESH_KEY = 'intranet_refresh_token'
const USER_KEY = 'intranet_user'
const FILE_KEY = 'intranet_file_token'

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
  },
  setUser(user: UserDto): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(FILE_KEY)
  },
}

export function authedUrl(path: string): string {
  const token = tokenStore.getFileToken() ?? tokenStore.getAccessToken()
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}token=${encodeURIComponent(token ?? '')}`
}
