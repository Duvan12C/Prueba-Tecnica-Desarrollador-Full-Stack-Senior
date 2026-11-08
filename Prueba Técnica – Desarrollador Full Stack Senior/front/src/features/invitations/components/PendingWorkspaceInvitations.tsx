import { useState } from 'react'
import { Icon } from '@iconify/react'
import WorkspaceInvitationDialog from '@/features/invitations/components/WorkspaceInvitationDialog'
import { usePendingWorkspaceInvitations } from '@/features/invitations/hooks/usePendingWorkspaceInvitations'
import type { WorkspaceInvitation } from '@/features/invitations/types/invitation.types'
import { formatInvitationExpiry } from '@/features/invitations/utils/formatInvitationExpiry'
import Button from '@/shared/components/Button'
import Card from '@/shared/components/Card'
import ConfirmDialog from '@/shared/components/ConfirmDialog'

interface PendingWorkspaceInvitationsProps {
    workspaceId: number
    workspaceName: string
}

export default function PendingWorkspaceInvitations({ workspaceId, workspaceName }: PendingWorkspaceInvitationsProps) {
    const { invitations, loadError, isLoading, cancellingId, cancelError, cancelStatus, cancel, reload } = usePendingWorkspaceInvitations(workspaceId)
    const [inviteOpen, setInviteOpen] = useState(false)
    const [invitationToCancel, setInvitationToCancel] = useState<WorkspaceInvitation | null>(null)

    return (
        <section aria-labelledby="pending-invitations-title" className="space-y-3">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 id="pending-invitations-title" className="font-heading text-xl font-semibold text-secondary-950">
                        Invitaciones pendientes
                    </h2>
                    <p className="mt-1 text-sm text-secondary-700">Invitaciones de este espacio que aún pueden aceptarse.</p>
                </div>
                <Button onClick={() => setInviteOpen(true)} disabled={cancellingId !== null}
                    startIcon={<Icon icon="tabler:user-plus" width="19" />}>
                    Invitar personas
                </Button>
            </header>
            {cancelError && <p role="alert" className="rounded-xl bg-danger-bg p-3 text-sm text-danger-text">{cancelError}</p>}
            {cancelStatus && <p role="status" className="rounded-xl bg-success-bg p-3 text-sm text-success-text">{cancelStatus}</p>}
            <Card className="rounded-2xl border border-neutral-100 bg-white p-2">
                {isLoading && <p role="status" className="p-3 text-sm text-secondary-700">Cargando invitaciones…</p>}
                {loadError && (
                    <div className="flex flex-wrap items-center gap-3 p-3">
                        <p role="alert" className="text-sm text-danger-text">{loadError}</p>
                        <Button variant="outline" size="sm" onClick={reload}>Reintentar</Button>
                    </div>
                )}
                {invitations?.length === 0 && <p className="p-3 text-sm text-secondary-700">Este espacio no tiene invitaciones pendientes.</p>}
                {!!invitations?.length && (
                    <ul className="divide-y divide-neutral-100">
                        {invitations.map((invitation) => (
                            <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-100 text-primary-700">
                                        <Icon icon="tabler:mail" width="19" aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0 wrap-anywhere">
                                        <p className="text-sm font-semibold text-secondary-950">{invitation.email}</p>
                                        <p className="mt-1 text-xs text-secondary-700">Vence el {formatInvitationExpiry(invitation.expires_at)}</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" disabled={cancellingId !== null}
                                    loading={cancellingId === invitation.id} loadingText="Cancelando…"
                                    aria-label={`Cancelar invitación a ${invitation.email}`}
                                    onClick={() => setInvitationToCancel(invitation)}>
                                    Cancelar invitación
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
            {inviteOpen && (
                <WorkspaceInvitationDialog workspaceId={workspaceId} workspaceName={workspaceName} afterCreation={false}
                    dismissLabel="Volver a miembros" onSent={reload} onDismiss={() => setInviteOpen(false)} />
            )}
            <ConfirmDialog open={invitationToCancel !== null} title="¿Cancelar esta invitación?"
                description={`La invitación para ${invitationToCancel?.email ?? ''} dejará de estar disponible para esa cuenta.`}
                confirmLabel="Cancelar invitación" cancelLabel="Conservar invitación"
                destructive icon={<Icon icon="tabler:mail-off" width="22" />}
                onCancel={() => setInvitationToCancel(null)}
                onConfirm={() => {
                    if (invitationToCancel) void cancel(invitationToCancel)
                    setInvitationToCancel(null)
                }} />
        </section>
    )
}
