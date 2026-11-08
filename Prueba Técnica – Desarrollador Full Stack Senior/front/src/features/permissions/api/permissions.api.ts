import type { DocumentMemberAccess, DocumentPermission } from '@/features/permissions/types/permission.types'
import { apiClient } from '@/shared/api/client'
import type { ApiResponse } from '@/shared/api/api.types'

export async function listDocumentAccess(documentId: number, signal: AbortSignal): Promise<DocumentMemberAccess[]> {
    const { data } = await apiClient.get<ApiResponse<DocumentMemberAccess[]>>(`/documents/${documentId}/permissions`, { signal })
    if (!data.success || !data.data) throw new Error(data.message)
    return data.data
}

export async function saveDocumentAccess(documentId: number, userId: number, permission: DocumentPermission | null): Promise<void> {
    const path = `/documents/${documentId}/permissions/${userId}`
    const { data } = permission
        ? await apiClient.put<ApiResponse<unknown>>(path, { permission })
        : await apiClient.delete<ApiResponse<null>>(path)
    if (!data.success) throw new Error(data.message)
}
