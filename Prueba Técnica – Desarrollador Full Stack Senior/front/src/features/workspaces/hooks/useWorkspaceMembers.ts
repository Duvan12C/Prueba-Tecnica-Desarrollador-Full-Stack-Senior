import { useEffect, useState } from 'react'
import { listWorkspaceMembers, listWorkspaces } from '@/features/workspaces/api/workspaces.api'
import type { Workspace, WorkspaceMember } from '@/features/workspaces/types/workspace.types'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'

export function useWorkspaceMembers(workspaceId: number) {
    const [result, setResult] = useState<{ workspace: Workspace; members: WorkspaceMember[] } | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        const { signal } = controller
        Promise.all([listWorkspaces(signal), listWorkspaceMembers(workspaceId, signal)])
            .then(([workspaces, members]) => {
                const workspace = workspaces.find(({ id }) => id === workspaceId)
                if (!workspace) throw new Error('Este espacio de trabajo no está disponible.')
                if (!signal.aborted) setResult({ workspace, members })
            })
            .catch((error: unknown) => {
                if (!signal.aborted) setError(getProtectedApiErrorMessage(error, 'No se pudieron consultar los miembros del espacio.'))
            })
        return () => controller.abort()
    }, [workspaceId])

    return { result, error }
}
