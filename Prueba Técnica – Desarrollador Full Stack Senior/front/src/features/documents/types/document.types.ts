import type { Workspace } from '@/features/workspaces/types/workspace.types'
import type { DocumentPermission } from '@/features/permissions/types/permission.types'

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
    permission: DocumentPermission
}

export interface AccessibleDocument extends DocumentDetails {
    canEdit: boolean
    workspaceName: string | null
}

export interface CreateDocumentRequest {
    space_work_id: number
    title: string
}

export interface WorkspaceDocuments {
    workspace: Workspace
    documents: DocumentListItem[]
}
