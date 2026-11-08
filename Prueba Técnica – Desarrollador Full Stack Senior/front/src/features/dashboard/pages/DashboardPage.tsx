import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useNavigate, useOutletContext } from 'react-router'
import type { WorkspaceOutletContext } from '@/app/WorkspaceLayout'
import { getSessionUserId } from '@/features/auth/session/sessionToken'
import DashboardInvitations from '@/features/dashboard/components/DashboardInvitations'
import WorkspaceOverview from '@/features/dashboard/components/WorkspaceOverview'
import { createDocument } from '@/features/documents/api/documents.api'
import CreateDocumentDialog from '@/features/documents/components/CreateDocumentDialog'
import { useWorkspaces } from '@/features/workspaces/hooks/useWorkspaces'
import Button from '@/shared/components/Button'
import Card from '@/shared/components/Card'

export default function DashboardPage() {
    const navigate = useNavigate()
    const { profile, invitations, loadError: invitationError, workspaceCapabilities } = useOutletContext<WorkspaceOutletContext>()
    const { workspaces, error } = useWorkspaces()
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [showCreate, setShowCreate] = useState(false)
    const userId = getSessionUserId()
    const isManager = workspaceCapabilities.canCreateWorkspace
    const owned = workspaces?.filter((workspace) => workspace.owner_user_id === userId)
    const workspace = workspaces?.find(({ id }) => id === selectedId) ?? (isManager ? owned?.[0] : undefined) ?? workspaces?.[0]
    const canManage = isManager && workspace?.owner_user_id === userId
    const firstName = profile?.name.trim().split(/\s+/)[0]

    return (
        <section aria-labelledby="dashboard-title" className="mx-auto max-w-7xl space-y-5 sm:space-y-6">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <h1 id="dashboard-title" className="font-heading text-3xl font-bold tracking-tight wrap-anywhere text-secondary-950 md:text-4xl">
                        {firstName ? `Hola, ${firstName}` : 'Inicio'}
                    </h1>
                    <p className="mt-2 text-sm text-secondary-700">
                        {isManager ? 'Consulta el estado de tus espacios de trabajo.' : 'Encuentra tus espacios, documentos e invitaciones.'}
                    </p>
                </div>
                {!!workspace && (
                    <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
                        <label className="relative min-w-0 max-w-full">
                            <span className="sr-only">Espacio del dashboard</span>
                            <Icon icon="tabler:folder" width="17" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-primary-700" aria-hidden="true" />
                            <select value={workspace.id} onChange={(event) => setSelectedId(Number(event.target.value))}
                                className="h-9 max-w-full rounded-lg border border-neutral-100 bg-white pr-2 pl-9 text-sm text-secondary-950 focus-visible:outline-2 focus-visible:outline-primary-500 sm:max-w-64">
                                {workspaces?.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
                            </select>
                        </label>
                        {canManage && (
                            <Button size="sm" onClick={() => setShowCreate(true)} startIcon={<Icon icon="tabler:plus" width="17" />}>
                                Nuevo documento
                            </Button>
                        )}
                    </div>
                )}
            </header>
            {error && <p role="alert" className="rounded-xl bg-danger-bg p-4 text-sm text-danger-text">{error}</p>}
            {!error && workspaceCapabilities.error && (
                <p role="alert" className="rounded-xl bg-warning-bg p-3 text-sm text-warning-text">{workspaceCapabilities.error}</p>
            )}
            {!error && (!workspaces || workspaceCapabilities.isLoading) && (
                <p role="status" className="text-sm text-secondary-700">Cargando resumen…</p>
            )}
            {workspace && !workspaceCapabilities.isLoading && (
                <WorkspaceOverview key={`${workspace.id}:${canManage}`} workspace={workspace} isManager={isManager} canManage={canManage}
                    spacesCount={(isManager ? owned?.length : workspaces?.length) ?? 0}
                    invitations={invitations} invitationError={invitationError} />
            )}
            {workspaces?.length === 0 && !workspaceCapabilities.isLoading && (
                <div className="grid items-start gap-4 lg:grid-cols-2">
                    <Card className="space-y-3 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
                        <span className="grid size-10 place-items-center rounded-xl bg-primary-100 text-primary-700">
                            <Icon icon="tabler:folders" width="21" aria-hidden="true" />
                        </span>
                        <h2 className="font-heading text-lg font-semibold text-secondary-950">Aún no tienes espacios de trabajo</h2>
                        <p className="text-sm text-secondary-700">
                            {isManager ? 'Crea un espacio para empezar a organizar los documentos de tu equipo.' : 'Cuando aceptes una invitación, podrás ver aquí el espacio y sus documentos.'}
                        </p>
                        {isManager && <Button size="sm" onClick={() => navigate('/workspaces/new')}>Crear espacio de trabajo</Button>}
                    </Card>
                    <DashboardInvitations invitations={invitations} error={invitationError} />
                </div>
            )}
            {showCreate && workspace && canManage && (
                <CreateDocumentDialog workspaceName={workspace.name} onDismiss={() => setShowCreate(false)}
                    onCreate={async (title) => {
                        const document = await createDocument({ space_work_id: workspace.id, title })
                        navigate(`/document/${document.id}`)
                    }} />
            )}
        </section>
    )
}
