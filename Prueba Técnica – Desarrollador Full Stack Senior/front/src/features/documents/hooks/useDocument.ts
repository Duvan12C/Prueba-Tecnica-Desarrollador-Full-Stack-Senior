import { useEffect, useState } from 'react'
import { getDocument } from '@/features/documents/api/documents.api'
import type { AccessibleDocument } from '@/features/documents/types/document.types'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'

export function useDocument(documentId: number) {
    const [document, setDocument] = useState<AccessibleDocument | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        getDocument(documentId, controller.signal)
            .then((result) => {
                if (!controller.signal.aborted) setDocument(result)
            })
            .catch((error: unknown) => {
                if (!controller.signal.aborted) {
                    setLoadError(getProtectedApiErrorMessage(error, 'No se pudo abrir el documento.'))
                }
            })
        return () => controller.abort()
    }, [documentId])

    return { document, loadError }
}
