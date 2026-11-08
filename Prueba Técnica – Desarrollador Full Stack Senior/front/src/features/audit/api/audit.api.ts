import type { AuditDateRange, AuditLogEntry } from '@/features/audit/types/audit.types'
import type { PaginatedApiResponse } from '@/shared/api/api.types'
import { apiClient } from '@/shared/api/client'

export async function listAuditLogs(workspaceId: number, dates: AuditDateRange, limit: number, offset: number, signal: AbortSignal) {
    const { data } = await apiClient.get<PaginatedApiResponse<AuditLogEntry>>('/audit', {
        params: {
            space_work_id: workspaceId,
            start_date: dates.startDate || undefined,
            end_date: dates.endDate || undefined,
            limit,
            offset,
        },
        signal,
    })
    if (!data.success || !data.data) throw new Error(data.message)
    return { entries: data.data, pagination: data.pagination }
}
