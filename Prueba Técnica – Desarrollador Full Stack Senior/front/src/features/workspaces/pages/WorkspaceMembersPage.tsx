import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useParams } from 'react-router'
import { getSessionUserId } from '@/features/auth/session/sessionToken'
import PendingWorkspaceInvitations from '@/features/invitations/components/PendingWorkspaceInvitations'
import { useWorkspaceCapabilities } from '@/features/workspaces/hooks/useWorkspaceCapabilities'
import { useWorkspaceMembers } from '@/features/workspaces/hooks/useWorkspaceMembers'
import type { WorkspaceMember } from '@/features/workspaces/types/workspace.types'
import Breadcrumbs from '@/shared/components/Breadcrumbs'
import Button from '@/shared/components/Button'
import Card from '@/shared/components/Card'
import ConfirmDialog from '@/shared/components/ConfirmDialog'

function WorkspaceMembers({ workspaceId }: { workspaceId: number }) {
    const { result, error, remove, removingId, removeError, removeStatus } = useWorkspaceMembers(workspaceId)
    const { canCreateWorkspace, error: capabilitiesError } = useWorkspaceCapabilities()
    const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(null)
    const isOwner = result?.workspace.owner_user_id === getSessionUserId()
    const canManage = isOwner && canCreateWorkspace

    return (
        <section aria-labelledby="members-title" className="mx-auto max-w-5xl space-y-5">
            <Breadcrumbs items={[
                { label: 'Espacios de trabajo', to: '/workspaces' },
                ...(result ? [{ label: result.workspace.name, to: `/workspaces/${workspaceId}` }] : []),
                { label: 'Miembros' },
            ]} />
            <header>
                <h1 id="members-title" className="font-heading text-3xl font-bold tracking-tight text-secondary-950 md:text-4xl">
                    Miembros del espacio
                </h1>
                <p className="mt-2 text-sm text-secondary-700">Personas que forman parte de este espacio de trabajo.</p>
            </header>
            {error && <p role="alert" className="rounded-xl bg-danger-bg p-4 text-sm text-danger-text">{error}</p>}
            {isOwner && capabilitiesError && <p role="alert" className="rounded-xl bg-danger-bg p-4 text-sm text-danger-text">{capabilitiesError}</p>}
            {!result && !error && <p role="status" className="text-sm text-secondary-700">Cargando miembros…</p>}
            {result && (
                <section aria-labelledby="active-members-title" className="space-y-3">
                    <h2 id="active-members-title" className="font-heading text-xl font-semibold text-secondary-950">Miembros activos</h2>
                    {removeError && <p role="alert" className="rounded-xl bg-danger-bg p-3 text-sm text-danger-text">{removeError}</p>}
                    {removeStatus && <p role="status" className="rounded-xl bg-success-bg p-3 text-sm text-success-text">{removeStatus}</p>}
                    <Card className="rounded-2xl border border-neutral-100 bg-white p-2">
                        {result.members.length === 0 && <p className="p-3 text-sm text-secondary-700">Aún no hay miembros activos.</p>}
                        <ul className="divide-y divide-neutral-100">
                            {result.members.map((member) => {
                                const isOwnerMember = member.user_id === result.workspace.owner_user_id
                                return (
                                    <li key={member.user_id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-100 text-primary-700">
                                                <Icon icon="tabler:user" width="19" aria-hidden="true" />
                                            </span>
                                            <div className="min-w-0 wrap-anywhere">
                                                <p className="text-sm font-semibold text-secondary-950">{member.name}</p>
                                                <p className="text-xs text-secondary-700">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-neutral-50 px-2.5 py-1 text-xs font-medium text-secondary-800">
                                                {isOwnerMember ? 'Propietario' : member.role_name}
                                            </span>
                                            {canManage && !isOwnerMember && (
                                                <Button variant="outline" size="sm" disabled={removingId !== null}
                                                    loading={removingId === member.user_id} loadingText="Retirando…"
                                                    aria-label={`Retirar a ${member.name}`} onClick={() => setMemberToRemove(member)}>
                                                    Retirar
                                                </Button>
                                            )}
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </Card>
                </section>
            )}
            {result && canManage && (
                <PendingWorkspaceInvitations workspaceId={workspaceId} workspaceName={result.workspace.name} />
            )}
            <ConfirmDialog open={memberToRemove !== null} title="¿Retirar a este miembro?"
                description={`${memberToRemove?.name ?? ''} dejará de pertenecer al espacio y perderá el acceso a sus documentos.`}
                confirmLabel="Retirar miembro" destructive icon={<Icon icon="tabler:user-minus" width="22" />}
                onCancel={() => setMemberToRemove(null)}
                onConfirm={() => {
                    if (memberToRemove) void remove(memberToRemove)
                    setMemberToRemove(null)
                }} />
        </section>
    )
}

export default function WorkspaceMembersPage() {
    const workspaceId = Number(useParams().workspaceId)
    if (!Number.isSafeInteger(workspaceId) || workspaceId <= 0) {
        return <p role="alert" className="text-sm text-danger-text">El espacio indicado no es válido.</p>
    }
    return <WorkspaceMembers key={workspaceId} workspaceId={workspaceId} />
}
