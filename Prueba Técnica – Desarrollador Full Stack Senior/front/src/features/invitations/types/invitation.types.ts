export interface WorkspaceInvitation {
    id: number
    space_work_id: number
    email: string
    expires_at: string
    token: string | null
}

export interface InvitationCandidate {
    id: number
    name: string
    email: string
}

export interface ReceivedInvitation {
    id: number
    space_work_id: number
    workspace_name: string
    inviter_name: string
    expires_at: string
}
