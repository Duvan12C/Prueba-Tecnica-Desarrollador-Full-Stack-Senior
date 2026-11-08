import { useState } from 'react'
import { Icon } from '@iconify/react'
import { Link, useNavigate } from 'react-router'
import { getSessionUserId } from '@/features/auth/session/sessionToken'
import WorkspaceIcon from '@/features/workspaces/components/WorkspaceIcon'
import WorkspaceCardActions from '@/features/workspaces/components/WorkspaceCardActions'
import WorkspaceMemberPreview from '@/features/workspaces/components/WorkspaceMemberPreview'
import { useWorkspaceCapabilities } from '@/features/workspaces/hooks/useWorkspaceCapabilities'
import { useWorkspaces } from '@/features/workspaces/hooks/useWorkspaces'
import type { Workspace } from '@/features/workspaces/types/workspace.types'
import Button from '@/shared/components/Button'
import Card from '@/shared/components/Card'
import ConfirmDialog from '@/shared/components/ConfirmDialog'

export default function WorkspacesPage() {
    const navigate = useNavigate()
    const { workspaces, error, archive, archiveError, archivingId } = useWorkspaces()
    const { canCreateWorkspace, error: permissionError } = useWorkspaceCapabilities()
    const userId = getSessionUserId()
    const [workspaceToArchive, setWorkspaceToArchive] = useState<Workspace | null>(null)

    return (
        <section aria-labelledby="workspaces-title" className="mx-auto max-w-7xl space-y-5">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 id="workspaces-title" className="font-heading text-3xl font-bold tracking-tight text-secondary-950 md:text-4xl">
                        Espacios de trabajo
                    </h1>
                    <p className="mt-2 text-sm text-secondary-700">Elige un espacio para ver sus documentos.</p>
                </div>
                {canCreateWorkspace && (
                    <Button onClick={() => navigate('/workspaces/new')} startIcon={<Icon icon="solar:folder-add-linear" width="20" />}>
                        Crear espacio de trabajo
                    </Button>
                )}
            </header>

            {error && <p role="alert" className="rounded-xl bg-danger-bg p-4 text-sm text-danger-text">{error}</p>}
            {archiveError && <p role="alert" className="rounded-xl bg-danger-bg p-4 text-sm text-danger-text">{archiveError}</p>}
            {archivingId !== null && <p role="status" className="text-sm text-secondary-700">Archivando espacio…</p>}
            {!error && permissionError && (
                <p role="alert" className="rounded-xl bg-warning-bg p-3 text-sm text-warning-text">{permissionError}</p>
            )}
            {!workspaces && !error && <p role="status" className="text-sm text-secondary-700">Cargando espacios de trabajo…</p>}
            {workspaces?.length === 0 && (
                <Card className="flex flex-col items-center rounded-2xl border border-neutral-100 bg-white p-10 text-center">
                    <span className="grid size-14 place-items-center rounded-2xl bg-primary-100 text-primary-700">
                        <Icon icon="solar:folder-linear" width="28" aria-hidden="true" />
                    </span>
                    <h2 className="mt-4 font-heading text-xl font-semibold text-secondary-950">Aún no tienes espacios de trabajo</h2>
                    <p className="mt-2 text-sm text-secondary-700">
                        {canCreateWorkspace
                            ? 'Crea un espacio para organizar los documentos de tu equipo.'
                            : 'Aquí aparecerán los espacios que compartan contigo.'}
                    </p>
                </Card>
            )}

            {!!workspaces?.length && (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {workspaces.map((workspace) => {
                        const isOwner = workspace.owner_user_id === userId
                        const canManage = isOwner && canCreateWorkspace
                        const hasActions = canManage || !!workspace.member_summary
                        return (
                            <li key={workspace.id} className="relative min-w-0">
                                <Link to={`/workspaces/${workspace.id}`} className="block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
                                    <Card className="flex h-full flex-col rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm hover:border-primary-300 motion-safe:transition-colors">
                                        <div className={`flex items-start justify-between gap-3 ${hasActions ? 'pr-10' : ''}`}>
                                            <WorkspaceIcon icon_key={workspace.icon_key} color_key={workspace.color_key} />
                                            <span className="rounded-full bg-neutral-50 px-2.5 py-1 text-xs font-medium text-secondary-700">
                                                {isOwner ? 'Propio' : 'Compartido contigo'}
                                            </span>
                                        </div>
                                        <h2 className="mt-4 font-heading text-lg font-semibold wrap-anywhere text-secondary-950">{workspace.name}</h2>
                                        {workspace.description && (
                                            <p className="mt-1 line-clamp-2 text-sm leading-relaxed wrap-anywhere text-secondary-700">{workspace.description}</p>
                                        )}
                                        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
                                            {workspace.member_summary && <WorkspaceMemberPreview {...workspace.member_summary} />}
                                            <span className="ml-auto flex items-center gap-2 text-sm font-semibold text-primary-700">
                                                Ver documentos
                                                <Icon icon="tabler:arrow-right" width="17" aria-hidden="true" />
                                            </span>
                                        </div>
                                    </Card>
                                </Link>
                                {hasActions && (
                                    <WorkspaceCardActions workspace={workspace} canManage={canManage}
                                        archiveDisabled={archivingId !== null} onArchive={() => setWorkspaceToArchive(workspace)} />
                                )}
                            </li>
                        )
                    })}
                </ul>
            )}
            <ConfirmDialog open={workspaceToArchive !== null} title="¿Archivar este espacio?"
                description={`«${workspaceToArchive?.name ?? ''}» dejará de estar disponible para sus miembros. Se conservarán sus documentos y versiones.`}
                confirmLabel="Archivar espacio" destructive icon={<Icon icon="tabler:archive" width="22" />}
                onCancel={() => setWorkspaceToArchive(null)}
                onConfirm={() => {
                    if (workspaceToArchive) void archive(workspaceToArchive.id)
                    setWorkspaceToArchive(null)
                }} />
        </section>
    )
}
