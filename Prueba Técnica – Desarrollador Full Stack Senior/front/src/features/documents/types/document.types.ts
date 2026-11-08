import type { Workspace } from '@/features/workspaces/types/workspace.types'

export interface DocumentListItem {
    id: number
    title: string
    space_work_id: number
    created_at: string
    updated_at: string | null
    current_version_number: number
}

export interface DocumentDetails extends DocumentListItem {
    content: string
}

export interface AccessibleDocument extends DocumentDetails {
    canEdit: boolean
}

export interface CreateDocumentRequest {
    space_work_id: number
    title: string
}

export interface DocumentCatalog {
    spaces: Workspace[]
    documents: (DocumentListItem & { spaceName: string })[]
}
