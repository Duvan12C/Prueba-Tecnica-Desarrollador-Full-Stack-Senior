import { apiClient } from '@/shared/api/client'
import type { ApiResponse } from '@/shared/api/api.types'
import type { CreateDocumentRequest, DocumentCatalog, DocumentListItem } from '@/features/documents/types/document.types'
import type { Workspace } from '@/features/workspaces/types/workspace.types'

export async function loadDocuments(signal: AbortSignal): Promise<DocumentCatalog> {
    const { data: spacesResponse } = await apiClient.get<ApiResponse<Workspace[]>>('/space_work', { signal })
    if (!spacesResponse.success || !spacesResponse.data) throw new Error(spacesResponse.message)

    const spaces = spacesResponse.data
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
