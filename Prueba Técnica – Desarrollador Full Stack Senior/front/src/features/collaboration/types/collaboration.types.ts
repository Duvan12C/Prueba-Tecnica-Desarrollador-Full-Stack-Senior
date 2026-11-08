import type { DocumentPermission } from '@/features/permissions/types/permission.types'

export interface Participant {
    user_id: number
    name: string
}

export interface DocumentSnapshot {
    version: number
    revision: number
    content: string
    permission: DocumentPermission
    has_unpublished_changes: boolean
}

export interface PendingEdit {
    request_id: string
    base_revision: number
    content: string
}

export interface VersionActivity {
    type: 'version_activity'
    status: 'saving' | 'saved' | 'cancelled'
    name: string
    version: number | null
}

export type CollaborationEvent =
    | ({ type: 'document' } & DocumentSnapshot)
    | { type: 'presence'; participants: Participant[] }
    | { type: 'draft_synced'; request_id: string; revision: number; has_unpublished_changes: boolean }
    | { type: 'version_published'; request_id: string; version: number; revision: number; created: boolean }
    | VersionActivity
    | ({ type: 'conflict'; request_id: string } & DocumentSnapshot)
    | { type: 'error'; request_id?: string; message: string }
