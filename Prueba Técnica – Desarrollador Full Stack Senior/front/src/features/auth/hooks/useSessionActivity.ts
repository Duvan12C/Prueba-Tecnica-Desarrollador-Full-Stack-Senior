import { useEffect } from 'react'
import { getActiveSession, renewSession } from '@/features/auth/session/sessionLifecycle'
import { subscribeToSession } from '@/features/auth/session/sessionToken'

const ACTIVITY_SYNC_INTERVAL = 30_000
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'input', 'wheel'] as const

export function useSessionActivity(): void {
    useEffect(() => {
        let idleTimer: number | undefined
        let activityTimer: number | undefined
        let lastSync = 0

        function checkExpiry() {
            window.clearTimeout(idleTimer)
            const session = getActiveSession()
            if (session) {
                idleTimer = window.setTimeout(checkExpiry, session.idle_expires_at * 1000 - Date.now())
            } else {
                window.clearTimeout(activityTimer)
                activityTimer = undefined
                lastSync = 0
            }
        }

        function recordActivity(event: Event) {
            if (!event.isTrusted || document.hidden || activityTimer !== undefined || !getActiveSession()) return
            activityTimer = window.setTimeout(() => {
                activityTimer = undefined
                lastSync = Date.now()
                void renewSession(true).catch(() => {
                    // A connection failure does not extend the confirmed session deadline.
                })
            }, Math.max(0, lastSync + ACTIVITY_SYNC_INTERVAL - Date.now()))
        }

        const unsubscribe = subscribeToSession(checkExpiry)
        checkExpiry()
        ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, recordActivity, { passive: true }))
        document.addEventListener('visibilitychange', checkExpiry)

        return () => {
            unsubscribe()
            window.clearTimeout(idleTimer)
            window.clearTimeout(activityTimer)
            ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, recordActivity))
            document.removeEventListener('visibilitychange', checkExpiry)
        }
    }, [])
}
