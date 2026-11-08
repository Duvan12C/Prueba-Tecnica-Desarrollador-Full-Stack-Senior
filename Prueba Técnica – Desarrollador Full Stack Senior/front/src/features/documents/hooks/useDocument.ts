import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { getDocument, saveDocumentVersion } from '@/features/documents/api/documents.api'
import type { AccessibleDocument } from '@/features/documents/types/document.types'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'

export function useDocument(documentId: number) {
    const [document, setDocument] = useState<AccessibleDocument | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

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

    async function save(content: string): Promise<boolean> {
        if (isSaving) return false
        setIsSaving(true)
        setSaveError(null)
        try {
            const version = await saveDocumentVersion(documentId, content)
            setDocument((current) => current && {
                ...current,
                content: version.content,
                current_version_number: version.version_number,
                updated_at: version.created_at,
            })
            return true
        } catch (error) {
            if (isAxiosError(error) && error.response?.status === 403) {
                setDocument((current) => current && { ...current, permission: 'read', canEdit: false })
            }
            setSaveError(getProtectedApiErrorMessage(error, 'No se pudo guardar la versión.'))
            return false
        } finally {
            setIsSaving(false)
        }
    }

    return { document, loadError, saveError, isSaving, save }
}
