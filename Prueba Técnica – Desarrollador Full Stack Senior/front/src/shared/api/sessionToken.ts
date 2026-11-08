const ACCESS_TOKEN_KEY = 'docspace.access_token'

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY)
}

export function saveAccessToken(token: string): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
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
