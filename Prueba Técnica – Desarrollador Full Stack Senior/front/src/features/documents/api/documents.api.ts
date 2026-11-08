import { apiClient } from '@/shared/api/client'
import type { ApiResponse } from '@/shared/api/api.types'
import type { AccessibleDocument, CreateDocumentRequest, DocumentCatalog, DocumentDetails, DocumentListItem } from '@/features/documents/types/document.types'
import type { DocumentVersion } from '@/features/versions/types/version.types'
import { getWorkspaceCapabilities, listWorkspaces } from '@/features/workspaces/api/workspaces.api'
import { getSessionUserId } from '@/features/auth/session/sessionToken'

export async function loadDocuments(signal: AbortSignal): Promise<DocumentCatalog> {
    const spaces = await listWorkspaces(signal)
    const documents = await Promise.all(spaces.map(async (space) => {
        const { data } = await apiClient.get<ApiResponse<DocumentListItem[]>>('/documents', {
            params: { space_work_id: space.id },
            signal,
        })
        if (!data.success || !data.data) throw new Error(data.message)
        return data.data.map((document) => ({ ...document, spaceName: space.name }))
    }))

    return { spaces, documents: documents.flat() }
}

export async function createDocument(request: CreateDocumentRequest): Promise<DocumentListItem> {
    const { data } = await apiClient.post<ApiResponse<DocumentListItem>>('/documents', request)
    if (!data.success || !data.data) throw new Error(data.message)
    return data.data
}

export async function getDocument(id: number, signal: AbortSignal): Promise<AccessibleDocument> {
    const { data } = await apiClient.get<ApiResponse<DocumentDetails>>(`/documents/${id}`, { signal })
    if (!data.success || !data.data) throw new Error(data.message)

    const document = data.data
    const userId = getSessionUserId()
    if (userId !== null) {
        const [spaces, capabilities] = await Promise.all([listWorkspaces(signal), getWorkspaceCapabilities(signal)])
        const isOwner = spaces.some(({ id, owner_user_id }) => id === document.space_work_id && owner_user_id === userId)
        return { ...document, canEdit: isOwner && capabilities.can_create }
    }

    return { ...document, canEdit: false }
}

export async function saveDocumentVersion(id: number, content: string): Promise<DocumentVersion> {
    const { data } = await apiClient.put<ApiResponse<DocumentVersion>>(`/documents/${id}`, { content })
    if (!data.success || !data.data) throw new Error(data.message)
    return data.data
}
