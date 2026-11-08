import { apiClient } from '@/shared/api/client'
import type { ApiResponse } from '@/shared/api/api.types'
import type { AccessibleDocument, CreateDocumentRequest, DocumentDetails, DocumentListItem, WorkspaceDocuments } from '@/features/documents/types/document.types'
import type { DocumentVersion } from '@/features/versions/types/version.types'
import { getWorkspaceCapabilities, listWorkspaces } from '@/features/workspaces/api/workspaces.api'
import { getSessionUserId } from '@/features/auth/session/sessionToken'

export async function loadWorkspaceDocuments(workspaceId: number, signal: AbortSignal): Promise<WorkspaceDocuments> {
    const spaces = await listWorkspaces(signal)
    const workspace = spaces.find(({ id }) => id === workspaceId)
    if (!workspace) throw new Error('Este espacio de trabajo no está disponible.')

    const { data } = await apiClient.get<ApiResponse<DocumentListItem[]>>('/documents', {
        params: { space_work_id: workspaceId },
        signal,
    })
    if (!data.success || !data.data) throw new Error(data.message)
    return { workspace, documents: data.data }
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
        const workspace = spaces.find(({ id }) => id === document.space_work_id)
        return {
            ...document,
            canEdit: workspace?.owner_user_id === userId && capabilities.can_create,
            workspaceName: workspace?.name ?? null,
        }
    }

    return { ...document, canEdit: false, workspaceName: null }
}

export async function saveDocumentVersion(id: number, content: string): Promise<DocumentVersion> {
    const { data } = await apiClient.put<ApiResponse<DocumentVersion>>(`/documents/${id}`, { content })
    if (!data.success || !data.data) throw new Error(data.message)
    return data.data
}
