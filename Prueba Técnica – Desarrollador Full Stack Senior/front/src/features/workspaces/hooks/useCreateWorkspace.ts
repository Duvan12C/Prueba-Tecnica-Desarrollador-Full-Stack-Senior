import { useState } from 'react'
import { createWorkspace } from '@/features/workspaces/api/workspaces.api'
import type { CreateWorkspaceRequest } from '@/features/workspaces/types/workspace.types'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'

export function useCreateWorkspace() {
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function submit(request: CreateWorkspaceRequest) {
        setIsSaving(true)
        setError(null)
        try {
            return await createWorkspace(request)
        } catch (error) {
            setError(getProtectedApiErrorMessage(error, 'No se pudo crear el espacio de trabajo.'))
            return null
        } finally {
            setIsSaving(false)
        }
    }

    return { submit, isSaving, error }
}
