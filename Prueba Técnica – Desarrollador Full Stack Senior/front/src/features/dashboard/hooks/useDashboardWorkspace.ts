import { useEffect, useState } from 'react'
import { listAuditLogs } from '@/features/audit/api/audit.api'
import type { AuditLogEntry } from '@/features/audit/types/audit.types'
import { listWorkspaceDocuments } from '@/features/documents/api/documents.api'
import type { DocumentListItem } from '@/features/documents/types/document.types'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'

const RECENT_ACTIVITY_LIMIT = 5

function localDate(now: Date): string {
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${now.getFullYear()}-${month}-${day}`
}

interface DashboardActivity {
    recent: AuditLogEntry[]
    todayCount: number
}

export function useDashboardWorkspace(workspaceId: number, canManage: boolean) {
    const [documents, setDocuments] = useState<DocumentListItem[] | null>(null)
    const [documentsError, setDocumentsError] = useState<string | null>(null)
    const [activity, setActivity] = useState<DashboardActivity | null>(null)
    const [activityError, setActivityError] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        listWorkspaceDocuments(workspaceId, controller.signal)
            .then((result) => {
                if (!controller.signal.aborted) setDocuments(result)
            })
            .catch((error: unknown) => {
                if (!controller.signal.aborted) {
                    setDocumentsError(getProtectedApiErrorMessage(error, 'No se pudieron consultar los documentos.'))
                }
            })
        return () => controller.abort()
    }, [workspaceId])

    useEffect(() => {
        if (!canManage) return
        const controller = new AbortController()
        const { signal } = controller
        const today = localDate(new Date())
        Promise.all([
            listAuditLogs(workspaceId, {}, RECENT_ACTIVITY_LIMIT, 0, signal),
            listAuditLogs(workspaceId, { startDate: today, endDate: today }, 1, 0, signal),
        ])
            .then(([recent, daily]) => {
                if (!signal.aborted) setActivity({ recent: recent.entries, todayCount: daily.pagination.total })
            })
            .catch((error: unknown) => {
                if (!signal.aborted) {
                    setActivityError(getProtectedApiErrorMessage(error, 'No se pudo consultar la actividad.'))
                }
            })
        return () => controller.abort()
    }, [workspaceId, canManage])

    return { documents, documentsError, activity, activityError }
}
