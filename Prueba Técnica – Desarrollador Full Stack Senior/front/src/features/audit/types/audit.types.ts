export interface AuditLogEntry {
    id: number
    actor_name: string | null
    action: string
    entity_type: string
    resource_name: string | null
    description: string | null
    created_at: string
}

export interface AuditDateRange {
    startDate?: string
    endDate?: string
}
