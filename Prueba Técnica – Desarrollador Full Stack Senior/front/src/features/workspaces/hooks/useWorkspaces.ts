import { useEffect, useState } from 'react'
import { archiveWorkspace, listWorkspaces } from '@/features/workspaces/api/workspaces.api'
import type { Workspace } from '@/features/workspaces/types/workspace.types'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'

export function useWorkspaces() {
    const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [archiveError, setArchiveError] = useState<string | null>(null)
    const [archivingId, setArchivingId] = useState<number | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        listWorkspaces(controller.signal)
            .then((result) => {
                if (!controller.signal.aborted) setWorkspaces(result)
            })
            .catch((error: unknown) => {
                if (!controller.signal.aborted) {
                    setError(getProtectedApiErrorMessage(error, 'No se pudieron cargar los espacios de trabajo.'))
                }
            })
        return () => controller.abort()
    }, [])

    async function archive(workspaceId: number) {
        setArchiveError(null)
        setArchivingId(workspaceId)
        try {
            await archiveWorkspace(workspaceId)
            setWorkspaces((current) => current?.filter(({ id }) => id !== workspaceId) ?? null)
        } catch (error) {
            setArchiveError(getProtectedApiErrorMessage(error, 'No se pudo archivar el espacio de trabajo.'))
        } finally {
            setArchivingId(null)
        }
    }

    return { workspaces, error, archive, archiveError, archivingId }
}
