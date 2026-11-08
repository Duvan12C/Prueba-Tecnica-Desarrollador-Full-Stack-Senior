import { Icon } from '@iconify/react'
import DashboardPanel from '@/features/dashboard/components/DashboardPanel'
import type { ReceivedInvitation } from '@/features/invitations/types/invitation.types'

interface DashboardInvitationsProps {
    invitations: ReceivedInvitation[] | null
    error: string | null
}

export default function DashboardInvitations({ invitations, error }: DashboardInvitationsProps) {
    return (
        <DashboardPanel title="Invitaciones recibidas" to="/invitations" action="Abrir bandeja">
            {error && <p role="alert" className="rounded-lg bg-danger-bg p-3 text-sm text-danger-text">{error}</p>}
            {!invitations && !error && <p role="status" className="text-sm text-secondary-700">Cargando invitaciones…</p>}
            {invitations?.length === 0 && <p className="rounded-xl bg-neutral-50 p-4 text-sm text-secondary-700">Estás al día con tus invitaciones.</p>}
            {!!invitations?.length && (
                <ul className="space-y-2">
                    {invitations.slice(0, 4).map((invitation) => (
                        <li key={invitation.id} className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3">
                            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-100 text-primary-700">
                                <Icon icon="tabler:mail" width="17" aria-hidden="true" />
                            </span>
                            <div className="min-w-0 wrap-anywhere">
                                <p className="text-sm font-semibold text-secondary-950">{invitation.workspace_name}</p>
                                <p className="mt-1 text-xs text-secondary-700">Te invitó {invitation.inviter_name}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </DashboardPanel>
    )
}
