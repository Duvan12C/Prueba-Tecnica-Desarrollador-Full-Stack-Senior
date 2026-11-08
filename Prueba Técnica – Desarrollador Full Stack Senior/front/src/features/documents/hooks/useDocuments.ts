import { useEffect, useState } from 'react'
import { createDocument, loadWorkspaceDocuments } from '@/features/documents/api/documents.api'
import { useDeleteDocument } from '@/features/documents/hooks/useDeleteDocument'
import type { WorkspaceDocuments } from '@/features/documents/types/document.types'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'

export function useDocuments(workspaceId: number) {
    const [catalog, setCatalog] = useState<WorkspaceDocuments | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)
    const { deletingId, deleteError, remove } = useDeleteDocument()

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

    async function removeDocument(documentId: number) {
        if (await remove(documentId)) {
            setCatalog((current) => current && {
                ...current,
                documents: current.documents.filter(({ id }) => id !== documentId),
            })
        }
    }

    return { catalog, loadError, addDocument, removeDocument, deletingId, deleteError }
}
