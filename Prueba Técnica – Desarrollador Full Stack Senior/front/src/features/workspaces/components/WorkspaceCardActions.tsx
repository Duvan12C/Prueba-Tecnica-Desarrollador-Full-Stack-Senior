import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { Link } from 'react-router'
import type { Workspace } from '@/features/workspaces/types/workspace.types'
import Button from '@/shared/components/Button'

interface WorkspaceCardActionsProps {
    workspace: Workspace
    canManage: boolean
    archiveDisabled: boolean
    onArchive: () => void
}

const linkClass = 'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-secondary-900 outline-none hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-primary-500'

export default function WorkspaceCardActions({ workspace, canManage, archiveDisabled, onArchive }: WorkspaceCardActionsProps) {
    const [open, setOpen] = useState(false)
    const container = useRef<HTMLDivElement>(null)
    const trigger = useRef<HTMLButtonElement>(null)
    const actionsId = useId()
    const workspacePath = `/workspaces/${workspace.id}`

    useEffect(() => {
        if (!open) return
        function closeOutside(event: PointerEvent) {
            if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false)
        }
        window.addEventListener('pointerdown', closeOutside)
        return () => window.removeEventListener('pointerdown', closeOutside)
    }, [open])

    return (
        <div ref={container} className="absolute right-4 top-4 z-10"
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
            }}
            onKeyDown={(event) => {
                if (open && event.key === 'Escape') {
                    event.preventDefault()
                    setOpen(false)
                    trigger.current?.focus()
                }
            }}>
            <Button ref={trigger} size="icon" variant="ghost" aria-label={`Acciones de ${workspace.name}`}
                aria-expanded={open} aria-controls={open ? actionsId : undefined} onClick={() => setOpen(!open)}>
                <Icon icon="tabler:dots-vertical" width="20" aria-hidden="true" />
            </Button>
            {open && (
                <div id={actionsId} className="absolute right-0 top-full mt-1 w-48 space-y-0.5 rounded-xl border border-neutral-100 bg-white p-1 shadow-lg">
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
                                onClick={() => {
                                    trigger.current?.focus()
                                    setOpen(false)
                                    onArchive()
                                }}
                                startIcon={<Icon icon="tabler:archive" width="18" />}>
                                Archivar espacio
                            </Button>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
