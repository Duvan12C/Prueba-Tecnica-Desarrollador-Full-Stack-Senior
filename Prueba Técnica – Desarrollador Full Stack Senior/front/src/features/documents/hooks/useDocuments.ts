import { useEffect, useState } from 'react'
import { createDocument, loadDocuments } from '@/features/documents/api/documents.api'
import type { CreateDocumentRequest, DocumentCatalog } from '@/features/documents/types/document.types'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'

export function useDocuments() {
    const [catalog, setCatalog] = useState<DocumentCatalog | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        loadDocuments(controller.signal)
            .then((data) => {
                if (!controller.signal.aborted) setCatalog(data)
            })
            .catch((error: unknown) => {
                if (!controller.signal.aborted) {
                    setLoadError(getProtectedApiErrorMessage(error, 'No se pudieron cargar los documentos.'))
                }
            })
        return () => controller.abort()
    }, [])

    async function addDocument(request: CreateDocumentRequest) {
        const document = await createDocument(request)
        setCatalog((current) => {
            const space = current?.spaces.find(({ id }) => id === document.space_work_id)
            if (!current || !space) return current
            return { ...current, documents: [{ ...document, spaceName: space.name }, ...current.documents] }
        })
    }

    return { catalog, loadError, addDocument }
}
