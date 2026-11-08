export interface DocumentVersion {
    id: number
    document_id: number
    version_number: number
    content: string
    created_by_user_id: number
    restored_from_version_id: number | null
    change_summary: string | null
    created_at: string
}

export interface VersionComparison {
    document_id: number
    from_version: number
    to_version: number
    unified_diff: string
}
