import { isAxiosError } from 'axios'
import { refreshAuthSession, revokeAuthSession } from '@/features/auth/api/auth.api'
import type { AuthToken } from '@/features/auth/types/auth.types'
import { clearAccessToken, getSession, saveSession } from './sessionToken'

let pending: { sessionId: string; active: boolean; promise: Promise<AuthToken | null> } | undefined

export function getActiveSession(): AuthToken | null {
    const session = getSession()
    if (session && session.idle_expires_at * 1000 <= Date.now()) {
        clearAccessToken()
        return null
    }
    return session
}

export function renewSession(active: boolean): Promise<AuthToken | null> {
    const session = getActiveSession()
    if (!session) return Promise.resolve(null)
    const sessionId = session.session_id

    if (pending?.sessionId === sessionId) {
        return active && !pending.active
            ? pending.promise.then((result) => result ? renewSession(true) : null)
            : pending.promise
    }

    const promise = refreshAuthSession(sessionId, active)
        .then((renewed) => {
            if (getSession()?.session_id !== sessionId) return null
            saveSession(renewed)
            return renewed
        })
        .catch((error: unknown) => {
            if (isAxiosError(error) && error.response?.status === 401) {
                if (getSession()?.session_id === sessionId) clearAccessToken()
                return null
            }
            throw error
        })
        .finally(() => {
            if (pending?.promise === promise) pending = undefined
        })
    pending = { sessionId, active, promise }
    return promise
}

export function signOut(): void {
    const session = getSession()
    clearAccessToken()
    if (session) void revokeAuthSession(session.session_id).catch(() => {
        // The local session is already closed. The server still enforces its expiry.
    })
}
