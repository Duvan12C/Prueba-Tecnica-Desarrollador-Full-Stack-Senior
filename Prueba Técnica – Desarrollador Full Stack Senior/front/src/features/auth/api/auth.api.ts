import { apiClient } from '@/shared/api/client'
import type { ApiResponse } from '@/shared/api/api.types'
import type { AuthToken, LoginCredentials, RegisteredUser, SignUpCredentials } from '@/features/auth/types/auth.types'

export async function login(credentials: LoginCredentials): Promise<AuthToken> {
  const response = await apiClient.post<ApiResponse<AuthToken>>('/auth/login', credentials, { withCredentials: true })
  const result = response.data

  if (!result.success || !result.data) {
    throw new Error(result.message || 'No se pudo iniciar sesión')
  }

  return result.data
}

export async function signUp(credentials: SignUpCredentials): Promise<RegisteredUser> {
  const response = await apiClient.post<ApiResponse<RegisteredUser>>('/users/create', credentials)
  const result = response.data

  if (!result.success || !result.data) {
    throw new Error(result.message || 'No se pudo crear la cuenta')
  }

  return result.data
}

export async function refreshAuthSession(sessionId: string, active: boolean): Promise<AuthToken> {
  const { data } = await apiClient.post<ApiResponse<AuthToken>>(
    '/auth/refresh', { session_id: sessionId, active }, { withCredentials: true },
  )
  if (!data.success || !data.data) throw new Error(data.message || 'No se pudo renovar la sesión')
  return data.data
}

export async function revokeAuthSession(sessionId: string): Promise<void> {
  await apiClient.post('/auth/logout', { session_id: sessionId }, { withCredentials: true })
}
