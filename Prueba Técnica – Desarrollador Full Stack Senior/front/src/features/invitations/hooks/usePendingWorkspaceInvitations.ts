import { useEffect, useState } from 'react'
import { cancelWorkspaceInvitation, listPendingInvitations } from '@/features/invitations/api/invitations.api'
import type { WorkspaceInvitation } from '@/features/invitations/types/invitation.types'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'

interface PendingInvitationsResult {
    revision: number
    invitations?: WorkspaceInvitation[]
    error?: string
}

export function usePendingWorkspaceInvitations(workspaceId: number) {
    const [revision, setRevision] = useState(0)
    const [result, setResult] = useState<PendingInvitationsResult | null>(null)
    const [cancellingId, setCancellingId] = useState<number | null>(null)
    const [cancelError, setCancelError] = useState<string | null>(null)
    const [cancelStatus, setCancelStatus] = useState<string | null>(null)
    const current = result?.revision === revision ? result : null

    useEffect(() => {
        const controller = new AbortController()
        const { signal } = controller
        listPendingInvitations(workspaceId, signal)
            .then((invitations) => {
                if (!signal.aborted) setResult({ revision, invitations })
            })
            .catch((error: unknown) => {
                if (!signal.aborted) {
                    setResult({ revision, error: getProtectedApiErrorMessage(error, 'No se pudieron cargar las invitaciones.') })
                }
            })
        return () => controller.abort()
    }, [workspaceId, revision])

    function reload() {
        setRevision((current) => current + 1)
    }

    async function cancel(invitation: WorkspaceInvitation) {
        if (cancellingId !== null) return
        setCancellingId(invitation.id)
        setCancelError(null)
        setCancelStatus(null)
        try {
            await cancelWorkspaceInvitation(invitation.id)
            setCancelStatus(`Invitación cancelada para ${invitation.email}.`)
        } catch (error) {
            setCancelError(getProtectedApiErrorMessage(error, 'No se pudo cancelar la invitación.'))
        } finally {
            setCancellingId(null)
            reload()
        }
    }

    return {
        invitations: current?.invitations, loadError: current?.error, isLoading: !current,
        cancellingId, cancelError, cancelStatus, cancel, reload,
    }
}
