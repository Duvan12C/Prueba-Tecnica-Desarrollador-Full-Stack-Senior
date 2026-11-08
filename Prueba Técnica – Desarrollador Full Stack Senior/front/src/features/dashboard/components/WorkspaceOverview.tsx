import AuditEvent from '@/features/audit/components/AuditEvent'
import DashboardInvitations from '@/features/dashboard/components/DashboardInvitations'
import DashboardMetric from '@/features/dashboard/components/DashboardMetric'
import DashboardPanel from '@/features/dashboard/components/DashboardPanel'
import RecentDocuments from '@/features/dashboard/components/RecentDocuments'
import { useDashboardWorkspace } from '@/features/dashboard/hooks/useDashboardWorkspace'
import type { ReceivedInvitation } from '@/features/invitations/types/invitation.types'
import type { Workspace } from '@/features/workspaces/types/workspace.types'

interface WorkspaceOverviewProps {
    workspace: Workspace
    spacesCount: number
    isManager: boolean
    canManage: boolean
    invitations: ReceivedInvitation[] | null
    invitationError: string | null
}

export default function WorkspaceOverview({ workspace, spacesCount, isManager, canManage, invitations, invitationError }: WorkspaceOverviewProps) {
    const { documents, documentsError, activity, activityError } = useDashboardWorkspace(workspace.id, canManage)

    return (
        <>
            <section aria-label="Resumen del espacio" className="grid grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-4">
                <DashboardMetric label={canManage ? 'Documentos del espacio' : 'Documentos accesibles'}
                    value={documents?.length} description="En el espacio seleccionado" icon="tabler:files" accent="primary" />
                <DashboardMetric label={isManager ? 'Espacios propios' : 'Espacios asignados'}
                    value={spacesCount} description={isManager ? 'Espacios que administras' : 'Espacios a los que perteneces'}
                    icon="tabler:folders" accent="secondary" />
                {canManage ? (
                    <>
                        <DashboardMetric label="Miembros del espacio" value={workspace.member_summary?.count}
                            description="Personas con membresía activa" icon="tabler:users" accent="tertiary" />
                        <DashboardMetric label="Actividades hoy" value={activity?.todayCount}
                            description="Eventos de auditoría del espacio" icon="tabler:activity" accent="primary" />
                    </>
                ) : (
                    <>
                        <DashboardMetric label="Versiones disponibles" value={documents?.reduce((total, document) => total + document.current_version_number, 0)}
                            description="En tus documentos accesibles" icon="tabler:history" accent="tertiary" />
                        <DashboardMetric label="Invitaciones pendientes" value={invitations?.length}
                            description="Recibidas en tu cuenta" icon="tabler:mail" accent="primary" />
                    </>
                )}
            </section>
            <div className="grid items-start gap-4 lg:gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <RecentDocuments workspaceId={workspace.id} documents={documents} error={documentsError} />
                {canManage ? (
                    <DashboardPanel title="Actividad reciente" to={`/audit?espacio=${workspace.id}`} action="Ver auditoría">
                        {activityError && <p role="alert" className="rounded-lg bg-danger-bg p-3 text-sm text-danger-text">{activityError}</p>}
                        {!activity && !activityError && <p role="status" className="text-sm text-secondary-700">Cargando actividad…</p>}
                        {activity?.recent.length === 0 && <p className="rounded-xl bg-neutral-50 p-4 text-sm text-secondary-700">Todavía no hay eventos en este espacio.</p>}
                        {!!activity?.recent.length && (
                            <ul className="divide-y divide-neutral-100">
                                {activity.recent.map((entry) => <AuditEvent key={entry.id} entry={entry} compact />)}
                            </ul>
                        )}
                    </DashboardPanel>
                ) : <DashboardInvitations invitations={invitations} error={invitationError} />}
            </div>
        </>
    )
}
