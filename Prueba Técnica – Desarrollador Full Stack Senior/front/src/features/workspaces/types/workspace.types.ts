export interface Workspace {
    id: number
    name: string
    description: string | null
    owner_user_id: number
}

export type CreateWorkspaceRequest = Pick<Workspace, 'name' | 'description'>

export interface WorkspaceCapabilities {
    can_create: boolean
}
