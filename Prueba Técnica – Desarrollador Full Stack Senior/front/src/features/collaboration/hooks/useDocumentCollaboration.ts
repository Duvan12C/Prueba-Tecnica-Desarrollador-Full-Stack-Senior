import { useCallback, useEffect, useEffectEvent, useReducer, useRef } from 'react'
import { getActiveSession, renewSession } from '@/features/auth/session/sessionLifecycle'
import { openCollaborationSocket } from '@/features/collaboration/api/collaborationSocket'
import { collaborationReducer, initialCollaborationState } from '@/features/collaboration/state/collaborationState'
import type { CollaborationEvent, PendingEdit } from '@/features/collaboration/types/collaboration.types'

const SYNC_INTERVAL_MS = 220
const MAX_CONTENT_LENGTH = 250_000

export function useDocumentCollaboration(documentId: number, enabled: boolean, readOnly: boolean) {
    const [state, dispatch] = useReducer(collaborationReducer, initialCollaborationState)
    const socket = useRef<WebSocket | null>(null)
    const nextRequestId = useRef(0)
    const sending = useRef<string | null>(null)

    useEffect(() => {
        if (!enabled) return
        let stopped = false
        let retry = 0
        let timer: number | undefined

        function reconnect() {
            dispatch({ type: 'disconnected' })
            const delay = Math.min(5_000, 350 * 2 ** retry)
            retry += 1
            timer = window.setTimeout(connect, delay)
        }

        function connect() {
            let current: WebSocket
            try {
                current = openCollaborationSocket(documentId)
            } catch {
                reconnect()
                return
            }
            socket.current = current

            current.onopen = async () => {
                try {
                    let session = getActiveSession()
                    if (session && session.access_expires_at * 1000 <= Date.now() + 15_000) {
                        session = await renewSession(false)
                    }
                    if (stopped || current.readyState !== WebSocket.OPEN) return
                    if (!session) {
                        current.close(4401)
                        return
                    }
                    current.send(JSON.stringify({ type: 'authenticate', token: session.access_token }))
                } catch {
                    current.close()
                }
            }
            current.onmessage = ({ data }) => {
                if (stopped || typeof data !== 'string') return
                let event: CollaborationEvent
                try {
                    event = JSON.parse(data) as CollaborationEvent
                } catch {
                    return
                }
                if (event.type === 'document') retry = 0
                if ((event.type === 'draft_synced' || event.type === 'version_published' || event.type === 'conflict' || event.type === 'error')
                    && (!event.request_id || event.request_id === sending.current)) {
                    sending.current = null
                }
                dispatch(event)
            }
            current.onclose = ({ code }) => {
                if (stopped) return
                socket.current = null
                sending.current = null
                if (code === 4401 || code === 4404) {
                    dispatch({
                        type: 'denied',
                        message: code === 4401 ? 'Tu sesión ya no está activa.' : 'Ya no tienes acceso a este documento.',
                    })
                } else {
                    reconnect()
                }
            }
        }

        connect()
        return () => {
            stopped = true
            window.clearTimeout(timer)
            socket.current?.close()
            socket.current = null
            sending.current = null
        }
    }, [documentId, enabled])

    const { snapshot, draft, pending, publishing, conflict, status, syncFailed, activity } = state
    const canEdit = !readOnly && (snapshot?.permission === 'edit' || snapshot?.permission === 'admin')
    const ready = canEdit && status === 'connected' && !pending && !publishing && !conflict
    const canSync = ready && draft !== null
    const canPublish = ready && draft === null && snapshot?.has_unpublished_changes === true

    const syncDraft = useCallback(() => {
        const current = socket.current
        if (!canSync || !snapshot || draft === null || sending.current || current?.readyState !== WebSocket.OPEN) return
        if (draft.length > MAX_CONTENT_LENGTH && Array.from(draft).length > MAX_CONTENT_LENGTH) {
            dispatch({ type: 'error', message: 'El documento supera el límite de tamaño para sincronizar.' })
            return
        }
        const edit: PendingEdit = {
            request_id: String(++nextRequestId.current),
            base_revision: snapshot.revision,
            content: draft,
        }
        sending.current = edit.request_id
        dispatch({ type: 'sent', edit })
        try {
            current.send(JSON.stringify({ type: 'edit', ...edit }))
        } catch {
            sending.current = null
            dispatch({ type: 'error', message: 'No se pudo enviar el borrador. Vuelve a intentar sincronizarlo.' })
        }
    }, [canSync, snapshot, draft])

    const synchronize = useEffectEvent(syncDraft)
    const shouldSync = canSync && !syncFailed
    useEffect(() => {
        if (!shouldSync) return
        const timer = window.setTimeout(() => synchronize(), SYNC_INTERVAL_MS)
        return () => window.clearTimeout(timer)
    }, [shouldSync])

    useEffect(() => {
        if (!activity) return
        const timer = window.setTimeout(() => dispatch({ type: 'clear_activity' }), 5_000)
        return () => window.clearTimeout(timer)
    }, [activity])

    function saveVersion() {
        const current = socket.current
        if (!canPublish || !snapshot || sending.current || current?.readyState !== WebSocket.OPEN) return
        const requestId = String(++nextRequestId.current)
        sending.current = requestId
        dispatch({ type: 'publishing', requestId })
        try {
            current.send(JSON.stringify({ type: 'save_version', request_id: requestId, base_revision: snapshot.revision }))
        } catch {
            sending.current = null
            dispatch({ type: 'error', request_id: requestId, message: 'No se pudo guardar la versión. El borrador se conserva.' })
        }
    }

    return {
        ...state,
        canSync,
        canPublish,
        syncDraft,
        saveVersion,
        updateDraft: (content: string) => dispatch({ type: 'draft', content }),
        applyDraft: () => dispatch({ type: 'apply_draft' }),
        discardDraft: () => dispatch({ type: 'discard_draft' }),
    }
}
