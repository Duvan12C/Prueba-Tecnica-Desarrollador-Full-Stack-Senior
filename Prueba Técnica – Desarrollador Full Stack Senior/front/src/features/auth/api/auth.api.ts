import { apiClient } from '@/shared/api/client'
import type { ApiResponse } from '@/shared/api/api.types'
import type { AuthToken, LoginCredentials } from '@/features/auth/types/auth.types'

export async function login(credentials: LoginCredentials): Promise<AuthToken> {
  const response = await apiClient.post<ApiResponse<AuthToken>>('/auth/login', credentials)
  const result = response.data

  if (!result.success || !result.data) {
    throw new Error(result.message || 'No se pudo iniciar sesión')
  }

  return result.data
}
