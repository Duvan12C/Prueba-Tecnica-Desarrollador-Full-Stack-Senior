import type { InvitationCandidate, ReceivedInvitation, WorkspaceInvitation } from '@/features/invitations/types/invitation.types'
import type { ApiResponse } from '@/shared/api/api.types'
import { apiClient } from '@/shared/api/client'

export async function searchInvitationCandidates(workspaceId: number, query: string, signal: AbortSignal): Promise<InvitationCandidate[]> {
    const { data } = await apiClient.get<ApiResponse<InvitationCandidate[]>>('/invitations/candidates', {
        params: { space_work_id: workspaceId, q: query },
        signal,
    })
    if (!data.success || !data.data) throw new Error(data.message)
    return data.data
}

export async function sendInvitations(workspaceId: number, userIds: number[]): Promise<number> {
    const { data } = await apiClient.post<ApiResponse<{ sent_count: number }>>('/invitations/send', {
        space_work_id: workspaceId,
        user_ids: userIds,
    })
    if (!data.success || !data.data) throw new Error(data.message)
    return data.data.sent_count
}

export async function acceptInvitation(token: string): Promise<WorkspaceInvitation> {
    const { data } = await apiClient.post<ApiResponse<WorkspaceInvitation>>('/invitations/accept', { token })
    if (!data.success || !data.data) throw new Error(data.message)
    return data.data
}

export async function listReceivedInvitations(signal: AbortSignal): Promise<ReceivedInvitation[]> {
    const { data } = await apiClient.get<ApiResponse<ReceivedInvitation[]>>('/invitations/received', { signal })
    if (!data.success || !data.data) throw new Error(data.message)
    return data.data
}

export async function acceptReceivedInvitation(id: number): Promise<WorkspaceInvitation> {
    const { data } = await apiClient.post<ApiResponse<WorkspaceInvitation>>(`/invitations/${id}/accept`)
    if (!data.success || !data.data) throw new Error(data.message)
    return data.data
}
