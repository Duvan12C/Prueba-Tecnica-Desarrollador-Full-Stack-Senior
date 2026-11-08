import { useState } from 'react'
import axios from 'axios'
import { login } from '@/features/auth/api/auth.api'
import { saveSession } from '@/features/auth/session/sessionToken'
import type { ApiErrorResponse } from '@/shared/api/api.types'
import type { LoginCredentials } from '@/features/auth/types/auth.types'

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function submitLogin(credentials: LoginCredentials) {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const token = await login(credentials)
      saveSession(token)
      setSuccessMessage('Inicio de sesión exitoso')
      return token
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setError(error.response?.data.message ?? 'No fue posible conectar con el servidor')
      } else if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Ocurrió un error inesperado')
      }

      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { submitLogin, isLoading, error, successMessage }
}
