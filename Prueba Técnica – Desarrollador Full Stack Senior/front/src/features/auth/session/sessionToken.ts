import type { AuthToken } from '@/features/auth/types/auth.types'

const ACCESS_TOKEN_KEY = 'docspace.access_token'
const listeners = new Set<() => void>()

export function subscribeToSession(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function getSession(): AuthToken | null {
  try {
    const session = JSON.parse(sessionStorage.getItem(ACCESS_TOKEN_KEY) ?? 'null') as AuthToken | null
    return session?.session_id ? session : null
  } catch {
    return null
  }
}

export function getSessionId(): string | null {
  const session = getSession()
  return session && session.idle_expires_at * 1000 > Date.now() ? session.session_id : null
}

export function getAccessToken(): string | null {
  return getSession()?.access_token ?? null
}

export function saveSession(session: AuthToken): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, JSON.stringify(session))
  listeners.forEach((listener) => listener())
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  listeners.forEach((listener) => listener())
}

export function getSessionUserId(): number | null {
  const payload = getAccessToken()?.split('.')[1]
  if (!payload) return null

  try {
    const { sub } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    const userId = Number(sub)
    return Number.isSafeInteger(userId) && userId > 0 ? userId : null
  } catch {
    return null
  }
}
