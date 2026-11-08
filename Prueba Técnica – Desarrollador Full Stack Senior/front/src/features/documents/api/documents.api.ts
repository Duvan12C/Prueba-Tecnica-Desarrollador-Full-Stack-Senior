import { apiClient } from '@/shared/api/client'
import type { ApiResponse } from '@/shared/api/api.types'
import type { CreateDocumentRequest, DocumentCatalog, DocumentListItem } from '@/features/documents/types/document.types'
import { listWorkspaces } from '@/features/workspaces/api/workspaces.api'

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
