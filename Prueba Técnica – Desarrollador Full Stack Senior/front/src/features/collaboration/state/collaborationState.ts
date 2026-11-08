import type { CollaborationEvent, DocumentSnapshot, Participant, PendingEdit, VersionActivity } from '@/features/collaboration/types/collaboration.types'

export interface CollaborationState {
    status: 'connecting' | 'connected' | 'reconnecting' | 'denied'
    snapshot: DocumentSnapshot | null
    participants: Participant[]
    draft: string | null
    pending: PendingEdit | null
    publishing: string | null
    activity: VersionActivity | null
    conflict: boolean
    error: string | null
    syncFailed: boolean
}

export const initialCollaborationState: CollaborationState = {
    status: 'connecting', snapshot: null, participants: [], draft: null, pending: null,
    publishing: null, activity: null, conflict: false, error: null, syncFailed: false,
}

type Action =
    | CollaborationEvent
    | { type: 'draft'; content: string }
    | { type: 'sent'; edit: PendingEdit }
    | { type: 'publishing'; requestId: string }
    | { type: 'clear_activity' }
    | { type: 'disconnected' }
    | { type: 'denied'; message: string }
    | { type: 'apply_draft' }
    | { type: 'discard_draft' }

function synchronize(state: CollaborationState, snapshot: DocumentSnapshot): CollaborationState {
    if (state.snapshot && (snapshot.revision < state.snapshot.revision || snapshot.version < state.snapshot.version)) return state
    const arrivedAfterReconnect = state.status !== 'connected'
    const changed = state.snapshot !== null && snapshot.revision > state.snapshot.revision
    const acknowledged = state.pending !== null
        && snapshot.revision === state.pending.base_revision + 1
        && snapshot.content === state.pending.content
    const draft = state.draft === snapshot.content ? null : state.draft
    return {
        ...state,
        status: 'connected',
        snapshot,
        draft,
        pending: arrivedAfterReconnect || acknowledged ? null : state.pending,
        conflict: draft !== null && (state.conflict || (changed && !acknowledged)),
        syncFailed: !arrivedAfterReconnect && state.syncFailed,
        error: arrivedAfterReconnect ? null : state.error,
    }
}

export function collaborationReducer(state: CollaborationState, action: Action): CollaborationState {
    switch (action.type) {
        case 'document':
            return synchronize(state, action)
        case 'presence':
            return { ...state, participants: action.participants }
        case 'draft': {
            const draft = !state.pending && action.content === state.snapshot?.content ? null : action.content
            return { ...state, draft, conflict: draft !== null && state.conflict, syncFailed: false, error: null }
        }
        case 'sent':
            return { ...state, pending: action.edit, syncFailed: false, error: null }
        case 'publishing':
            return { ...state, publishing: action.requestId, error: null }
        case 'draft_synced': {
            if (!state.snapshot || state.pending?.request_id !== action.request_id) return state
            if (action.revision < state.snapshot.revision) {
                return { ...state, pending: null, conflict: state.draft !== null }
            }
            return {
                ...state,
                snapshot: {
                    ...state.snapshot,
                    revision: action.revision,
                    content: state.pending.content,
                    has_unpublished_changes: action.has_unpublished_changes,
                },
                draft: state.draft === state.pending.content ? null : state.draft,
                pending: null,
                conflict: false,
                error: null,
                syncFailed: false,
            }
        }
        case 'version_published':
            if (!state.snapshot || state.publishing !== action.request_id) return state
            return {
                ...state,
                publishing: null,
                snapshot: action.version < state.snapshot.version ? state.snapshot : {
                    ...state.snapshot,
                    version: action.version,
                    has_unpublished_changes: action.revision === state.snapshot.revision
                        ? false : state.snapshot.has_unpublished_changes,
                },
            }
        case 'version_activity':
            return { ...state, activity: action.status === 'cancelled' ? null : action }
        case 'clear_activity':
            return { ...state, activity: null }
        case 'conflict': {
            const publishing = state.publishing === action.request_id
            if (!publishing && state.pending?.request_id !== action.request_id) return state
            const synced = synchronize(state, action)
            return {
                ...synced, pending: null, publishing: null, syncFailed: false,
                conflict: synced.draft !== null,
                error: publishing ? 'El borrador compartido cambió. Revísalo y vuelve a guardar la versión.' : null,
            }
        }
        case 'error':
            return action.request_id && action.request_id !== state.pending?.request_id && action.request_id !== state.publishing
                ? state
                : { ...state, pending: null, publishing: null, syncFailed: state.publishing === null, error: action.message }
        case 'disconnected':
            return { ...state, status: 'reconnecting', participants: [], publishing: null, activity: null }
        case 'denied':
            return { ...state, status: 'denied', participants: [], pending: null, publishing: null, activity: null, error: action.message }
        case 'apply_draft':
            return { ...state, conflict: false, syncFailed: false, error: null }
        case 'discard_draft':
            return { ...state, draft: null, conflict: false, syncFailed: false, error: null }
        default:
            return state
    }
}
