import { apiClient } from '@/shared/api/client'
import type { ApiResponse } from '@/shared/api/api.types'
import type { DocumentVersion, VersionComparison } from '@/features/versions/types/version.types'

export async function listVersions(documentId: number, signal: AbortSignal): Promise<DocumentVersion[]> {
    const { data } = await apiClient.get<ApiResponse<DocumentVersion[]>>(`/documents/${documentId}/versions`, { signal })
    if (!data.success || !data.data) throw new Error(data.message)
    return data.data
}

export async function compareVersions(documentId: number, fromVersion: number, toVersion: number): Promise<VersionComparison> {
    const { data } = await apiClient.get<ApiResponse<VersionComparison>>(`/documents/${documentId}/versions/compare`, {
        params: { from_version: fromVersion, to_version: toVersion },
    })
    if (!data.success || !data.data) throw new Error(data.message)
    return data.data
}

export async function restoreVersion(documentId: number, versionNumber: number): Promise<DocumentVersion> {
    const { data } = await apiClient.post<ApiResponse<DocumentVersion>>(
        `/documents/${documentId}/versions/${versionNumber}/restore`,
    )
    if (!data.success || !data.data) throw new Error(data.message)
    return data.data
}
