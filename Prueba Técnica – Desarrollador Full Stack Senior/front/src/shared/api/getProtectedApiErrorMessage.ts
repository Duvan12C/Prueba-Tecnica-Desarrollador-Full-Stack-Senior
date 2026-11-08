import { isAxiosError } from 'axios'
import type { ApiErrorResponse } from './api.types'

export function getProtectedApiErrorMessage(error: unknown, fallback: string): string {
    if (isAxiosError<ApiErrorResponse>(error)) {
        const response = error.response
        if (response?.status === 401) return 'Tu sesión no es válida o expiró. Cierra sesión y vuelve a iniciar sesión.'
        if (response?.status === 403) return 'No tienes permiso para realizar esta acción.'
        if (!response || [502, 503, 504].includes(response.status)) {
            return 'No se pudo conectar con la API. Comprueba que el backend esté en ejecución.'
        }
        return response.data?.message || `${fallback} (HTTP ${response.status})`
    }

    return error instanceof Error && error.message ? error.message : fallback
}
