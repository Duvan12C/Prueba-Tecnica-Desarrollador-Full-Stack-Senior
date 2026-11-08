import { apiClient } from '@/shared/api/client'
import type { ApiResponse } from '@/shared/api/api.types'
import type { CreateWorkspaceRequest, Workspace, WorkspaceCapabilities, WorkspaceMember } from '@/features/workspaces/types/workspace.types'

export async function listWorkspaces(signal: AbortSignal): Promise<Workspace[]> {
    const { data } = await apiClient.get<ApiResponse<Workspace[]>>('/space_work', { signal })
    if (!data.success || !data.data) throw new Error(data.message)
    return data.data
}

export async function listWorkspaceMembers(workspaceId: number, signal: AbortSignal): Promise<WorkspaceMember[]> {
    const { data } = await apiClient.get<ApiResponse<WorkspaceMember[]>>(`/space_work/${workspaceId}/members`, { signal })
    if (!data.success || !data.data) throw new Error(data.message)
    return data.data
}

export async function removeWorkspaceMember(workspaceId: number, userId: number): Promise<void> {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/space_work/${workspaceId}/members/${userId}`)
    if (!data.success) throw new Error(data.message)
}

export async function archiveWorkspace(workspaceId: number): Promise<void> {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/space_work/${workspaceId}`)
    if (!data.success) throw new Error(data.message)
}

export async function getWorkspaceCapabilities(signal: AbortSignal): Promise<WorkspaceCapabilities> {
    const { data } = await apiClient.get<ApiResponse<WorkspaceCapabilities>>('/space_work/capabilities', { signal })
    if (!data.success || !data.data) throw new Error(data.message)
    return data.data
}

export async function createWorkspace(request: CreateWorkspaceRequest): Promise<Workspace> {
    const { data } = await apiClient.post<ApiResponse<Workspace>>('/space_work/create', request)
    if (!data.success || !data.data) throw new Error(data.message)
    return data.data
}
