import { useState } from 'react'
import { isAxiosError } from 'axios'
import { acceptInvitation } from '@/features/invitations/api/invitations.api'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'

export function useAcceptInvitation() {
    const [error, setError] = useState<string | null>(null)
    const [isAccepting, setIsAccepting] = useState(false)

    async function accept(token: string) {
        setIsAccepting(true)
        setError(null)
        try {
            return await acceptInvitation(token)
        } catch (error) {
            setError(isAxiosError(error) && error.response?.status === 403
                ? 'Esta invitación corresponde a otro correo. Inicia sesión con la cuenta invitada.'
                : getProtectedApiErrorMessage(error, 'No se pudo aceptar la invitación.'))
            return null
        } finally {
            setIsAccepting(false)
        }
    }

    return { accept, error, isAccepting }
}
