import { useCallback, useEffect, useRef, useState } from 'react'
import { acceptReceivedInvitation, listReceivedInvitations } from '@/features/invitations/api/invitations.api'
import type { ReceivedInvitation } from '@/features/invitations/types/invitation.types'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'

const INBOX_REFRESH_INTERVAL = 30_000

export function useReceivedInvitations() {
    const [invitations, setInvitations] = useState<ReceivedInvitation[] | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [acceptError, setAcceptError] = useState<string | null>(null)
    const [accepting, setAccepting] = useState<number | null>(null)
    const request = useRef<AbortController | null>(null)

    const reload = useCallback(() => {
        request.current?.abort()
        const controller = new AbortController()
        request.current = controller
        listReceivedInvitations(controller.signal)
            .then((result) => {
                if (controller.signal.aborted) return
                setInvitations(result)
                setLoadError(null)
            })
            .catch((error: unknown) => {
                if (!controller.signal.aborted) {
                    setLoadError(getProtectedApiErrorMessage(error, 'No se pudieron consultar tus invitaciones.'))
                }
            })
    }, [])

    useEffect(() => {
        reload()
        window.addEventListener('focus', reload)
        const timer = window.setInterval(() => {
            if (!document.hidden) reload()
        }, INBOX_REFRESH_INTERVAL)
        return () => {
            window.removeEventListener('focus', reload)
            window.clearInterval(timer)
            request.current?.abort()
        }
    }, [reload])

    async function accept(id: number) {
        if (accepting !== null) return null
        setAccepting(id)
        setAcceptError(null)
        try {
            const invitation = await acceptReceivedInvitation(id)
            setInvitations((current) => current?.filter((item) => item.id !== id) ?? null)
            reload()
            return invitation
        } catch (error) {
            setAcceptError(getProtectedApiErrorMessage(error, 'No se pudo aceptar la invitación.'))
            reload()
            return null
        } finally {
            setAccepting(null)
        }
    }

    return { invitations, loadError, acceptError, accepting, accept }
}

export type InvitationInbox = ReturnType<typeof useReceivedInvitations>
