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
}

export type CreateWorkspaceRequest = WorkspaceAppearance & Pick<Workspace, 'name' | 'description'>

export interface WorkspaceCapabilities {
    can_create: boolean
}
