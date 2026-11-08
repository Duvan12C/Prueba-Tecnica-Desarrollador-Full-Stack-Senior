import { useState } from 'react'
import { deleteDocument } from '@/features/documents/api/documents.api'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'

export function useDeleteDocument() {
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    async function remove(documentId: number): Promise<boolean> {
        if (deletingId !== null) return false
        setDeletingId(documentId)
        setDeleteError(null)
        try {
            await deleteDocument(documentId)
            return true
        } catch (error) {
            setDeleteError(getProtectedApiErrorMessage(error, 'No se pudo eliminar el documento.'))
            return false
        } finally {
            setDeletingId(null)
        }
    }

    return { deletingId, deleteError, remove }
}
