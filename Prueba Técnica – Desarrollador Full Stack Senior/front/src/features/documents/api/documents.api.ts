import { apiClient } from '@/shared/api/client'
import type { ApiResponse } from '@/shared/api/api.types'
import type { AccessibleDocument, CreateDocumentRequest, DocumentDetails, DocumentListItem, WorkspaceDocuments } from '@/features/documents/types/document.types'
import { listWorkspaces } from '@/features/workspaces/api/workspaces.api'

export async function loadWorkspaceDocuments(workspaceId: number, signal: AbortSignal): Promise<WorkspaceDocuments> {
    const spaces = await listWorkspaces(signal)
    const workspace = spaces.find(({ id }) => id === workspaceId)
    if (!workspace) throw new Error('Este espacio de trabajo no está disponible.')

    const documents = await listWorkspaceDocuments(workspaceId, signal)
    return { workspace, documents }
}

export async function listWorkspaceDocuments(workspaceId: number, signal: AbortSignal): Promise<DocumentListItem[]> {
    const { data } = await apiClient.get<ApiResponse<DocumentListItem[]>>('/documents', {
        params: { space_work_id: workspaceId },
        signal,
    })
    if (!data.success || !data.data) throw new Error(data.message)
    return data.data
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
    const spaces = await listWorkspaces(signal)
    const workspace = spaces.find(({ id }) => id === document.space_work_id)
    return {
        ...document,
        canEdit: document.permission === 'edit' || document.permission === 'admin',
        workspaceName: workspace?.name ?? null,
        workspaceOwnerId: workspace?.owner_user_id ?? null,
    }
}

export async function deleteDocument(id: number): Promise<void> {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/documents/${id}`)
    if (!data.success) throw new Error(data.message)
}
