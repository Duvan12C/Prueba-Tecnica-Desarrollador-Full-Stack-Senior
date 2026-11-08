import { useEffect, useState } from 'react'
import { listDocumentAccess, saveDocumentAccess } from '@/features/permissions/api/permissions.api'
import type { DocumentMemberAccess, DocumentPermission } from '@/features/permissions/types/permission.types'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'

export function useDocumentAccess(documentId: number) {
    const [members, setMembers] = useState<DocumentMemberAccess[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [status, setStatus] = useState<string | null>(null)
    const [savingId, setSavingId] = useState<number | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        const { signal } = controller
        listDocumentAccess(documentId, signal)
            .then((result) => {
                if (!signal.aborted) setMembers(result)
            })
            .catch((error: unknown) => {
                if (!signal.aborted) setError(getProtectedApiErrorMessage(error, 'No se pudieron consultar los permisos.'))
            })
        return () => controller.abort()
    }, [documentId])

    async function save(member: DocumentMemberAccess, permission: DocumentPermission | null) {
        setSavingId(member.user_id)
        setError(null)
        setStatus(null)
        try {
            await saveDocumentAccess(documentId, member.user_id, permission)
            setMembers((current) => current?.map((item) => item.user_id === member.user_id ? { ...item, permission } : item) ?? null)
            setStatus(permission ? `Permiso actualizado para ${member.name}.` : `Acceso retirado a ${member.name}.`)
        } catch (error) {
            setError(getProtectedApiErrorMessage(error, 'No se pudo actualizar el permiso.'))
        } finally {
            setSavingId(null)
        }
    }

    return { members, error, status, savingId, save }
}
