import { useEffect, useState } from 'react'
import { listAuditLogs } from '@/features/audit/api/audit.api'
import type { AuditDateRange } from '@/features/audit/types/audit.types'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'

const PAGE_SIZE = 20

interface AuditResult {
    page: number
    data?: Awaited<ReturnType<typeof listAuditLogs>>
    error?: string
}

export function useAuditLog(workspaceId: number, dates: AuditDateRange) {
    const [page, setPage] = useState(0)
    const [result, setResult] = useState<AuditResult | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        const { signal } = controller
        listAuditLogs(workspaceId, dates, PAGE_SIZE, page * PAGE_SIZE, signal)
            .then((data) => {
                if (!signal.aborted) setResult({ page, data })
            })
            .catch((error: unknown) => {
                if (!signal.aborted) {
                    setResult({ page, error: getProtectedApiErrorMessage(error, 'No se pudo cargar la bitácora.') })
                }
            })
        return () => controller.abort()
    }, [workspaceId, dates, page])

    const current = result?.page === page ? result : null
    const pagination = current?.data?.pagination
    return {
        page,
        setPage,
        isLoading: current === null,
        error: current?.error,
        entries: current?.data?.entries,
        total: pagination?.total,
        pageCount: pagination ? Math.ceil(pagination.total / pagination.limit) : undefined,
        hasNext: !!pagination && pagination.offset + pagination.limit < pagination.total,
    }
}
