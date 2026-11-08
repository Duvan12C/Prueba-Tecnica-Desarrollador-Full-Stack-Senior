import { useEffect, useState } from 'react'
import { createDocument, loadWorkspaceDocuments } from '@/features/documents/api/documents.api'
import type { WorkspaceDocuments } from '@/features/documents/types/document.types'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'

export function useDocuments(workspaceId: number) {
    const [catalog, setCatalog] = useState<WorkspaceDocuments | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        loadWorkspaceDocuments(workspaceId, controller.signal)
            .then((data) => {
                if (!controller.signal.aborted) setCatalog(data)
            })
            .catch((error: unknown) => {
                if (!controller.signal.aborted) {
                    setLoadError(getProtectedApiErrorMessage(error, 'No se pudieron cargar los documentos.'))
                }
            })
        return () => controller.abort()
    }, [workspaceId])

    async function addDocument(title: string) {
        const document = await createDocument({ title, space_work_id: workspaceId })
        setCatalog((current) => current && {
            ...current,
            documents: [document, ...current.documents],
        })
    }

    return { catalog, loadError, addDocument }
}
