import { useEffect, useState } from 'react'
import { getWorkspaceCapabilities } from '@/features/workspaces/api/workspaces.api'
import type { WorkspaceCapabilities } from '@/features/workspaces/types/workspace.types'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'

export function useWorkspaceCapabilities() {
    const [capabilities, setCapabilities] = useState<WorkspaceCapabilities | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        getWorkspaceCapabilities(controller.signal)
            .then((result) => {
                if (!controller.signal.aborted) setCapabilities(result)
            })
            .catch((error: unknown) => {
                if (!controller.signal.aborted) {
                    setError(getProtectedApiErrorMessage(error, 'No se pudieron comprobar los permisos del espacio.'))
                }
            })
        return () => controller.abort()
    }, [])

    return { canCreateWorkspace: capabilities?.can_create ?? false, isLoading: !capabilities && !error, error }
}
