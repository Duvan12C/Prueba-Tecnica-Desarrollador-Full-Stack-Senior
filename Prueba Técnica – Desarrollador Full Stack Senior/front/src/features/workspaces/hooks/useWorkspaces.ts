import { useEffect, useState } from 'react'
import { listWorkspaces } from '@/features/workspaces/api/workspaces.api'
import type { Workspace } from '@/features/workspaces/types/workspace.types'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'

export function useWorkspaces() {
    const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null)
    const [error, setError] = useState<string | null>(null)

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

    return { workspaces, error }
}
