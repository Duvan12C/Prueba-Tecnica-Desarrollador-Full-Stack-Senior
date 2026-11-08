import { useState } from 'react'
import axios from 'axios'
import { signUp } from '@/features/auth/api/auth.api'
import type { ApiErrorResponse } from '@/shared/api/api.types'
import type { SignUpCredentials } from '@/features/auth/types/auth.types'

export function useSignUp() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    async function submitSignUp(credentials: SignUpCredentials) {
        setIsLoading(true)
        setError(null)
        setSuccessMessage(null)

        try {
            const user = await signUp(credentials)
            setSuccessMessage('Cuenta creada exitosamente')
            return user
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

    return { submitSignUp, isLoading, error, successMessage }
}
