export type DocumentPermission = 'read' | 'edit' | 'admin'

export interface DocumentMemberAccess {
    user_id: number
    name: string
    email: string
    permission: DocumentPermission | null
    is_owner: boolean
}
