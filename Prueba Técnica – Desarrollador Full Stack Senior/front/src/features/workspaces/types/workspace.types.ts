import type { workspaceColors, workspaceIcons } from '@/features/workspaces/constants/workspaceAppearance'

export interface WorkspaceAppearance {
    icon_key: keyof typeof workspaceIcons
    color_key: keyof typeof workspaceColors
}

export interface Workspace extends WorkspaceAppearance {
    id: number
    name: string
    description: string | null
    owner_user_id: number
    member_summary: WorkspaceMemberSummary | null
}

export interface WorkspaceMemberSummary {
    count: number
    names: string[]
}

export interface WorkspaceMember {
    user_id: number
    name: string
    email: string
    role_name: string
    joined_at: string
}

export type CreateWorkspaceRequest = WorkspaceAppearance & Pick<Workspace, 'name' | 'description'>

export interface WorkspaceCapabilities {
    can_create: boolean
}
