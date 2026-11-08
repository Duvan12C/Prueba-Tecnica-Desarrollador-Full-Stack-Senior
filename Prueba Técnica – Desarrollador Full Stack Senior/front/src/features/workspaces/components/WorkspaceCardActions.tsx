import { Icon } from '@iconify/react'
import { Link } from 'react-router'
import type { Workspace } from '@/features/workspaces/types/workspace.types'
import Button from '@/shared/components/Button'
import CardActions from '@/shared/components/CardActions'

interface WorkspaceCardActionsProps {
    workspace: Workspace
    canManage: boolean
    archiveDisabled: boolean
    onArchive: () => void
}

const linkClass = 'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-secondary-900 outline-none hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-primary-500'

export default function WorkspaceCardActions({ workspace, canManage, archiveDisabled, onArchive }: WorkspaceCardActionsProps) {
    const workspacePath = `/workspaces/${workspace.id}`

    return (
        <CardActions label={`Acciones de ${workspace.name}`} className="absolute right-4 top-4">
            <Link to={`${workspacePath}/members`} className={linkClass}>
                <Icon icon="tabler:users" width="18" aria-hidden="true" /> Miembros
            </Link>
            {canManage && (
                <>
                    <Link to={`${workspacePath}?invitar=1`} className={linkClass}>
                        <Icon icon="tabler:user-plus" width="18" aria-hidden="true" /> Invitar personas
                    </Link>
                    <Button variant="ghost" size="sm" fullWidth disabled={archiveDisabled}
                        className="justify-start! text-danger-text! hover:bg-danger-bg!"
                        onClick={onArchive} startIcon={<Icon icon="tabler:archive" width="18" />}>
                        Archivar espacio
                    </Button>
                </>
            )}
        </CardActions>
    )
}
