import { Icon } from '@iconify/react'
import { useNavigate, useOutletContext } from 'react-router'
import type { InvitationInbox } from '@/features/invitations/hooks/useReceivedInvitations'
import { formatInvitationExpiry } from '@/features/invitations/utils/formatInvitationExpiry'
import Button from '@/shared/components/Button'
import Card from '@/shared/components/Card'

export default function ReceivedInvitationsPage() {
    const { invitations, loadError, acceptError, accepting, accept } = useOutletContext<InvitationInbox>()
    const navigate = useNavigate()

    async function handleAccept(id: number) {
        const invitation = await accept(id)
        if (invitation) navigate(`/workspaces/${invitation.space_work_id}`)
    }

    return (
        <section aria-labelledby="received-invitations-title" className="mx-auto max-w-4xl space-y-5">
            <header>
                <h1 id="received-invitations-title" className="font-heading text-3xl font-bold text-secondary-950">
                    Invitaciones recibidas
                </h1>
                <p className="mt-2 text-sm text-secondary-700">Acepta una invitación para unirte a un espacio de trabajo.</p>
            </header>
            {loadError && <p role="alert" className="rounded-xl bg-danger-bg p-4 text-sm text-danger-text">{loadError}</p>}
            {acceptError && <p role="alert" className="rounded-xl bg-danger-bg p-4 text-sm text-danger-text">{acceptError}</p>}
            {!invitations && !loadError && <p role="status" className="text-sm text-secondary-700">Cargando invitaciones…</p>}
            {invitations?.length === 0 && (
                <Card className="rounded-2xl border border-neutral-100 bg-white p-8 text-center text-sm text-secondary-700">
                    No tienes invitaciones pendientes.
                </Card>
            )}
            {!!invitations?.length && (
                <ul className="space-y-3">
                    {invitations.map((invitation) => (
                        <li key={invitation.id}>
                            <Card className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-100 bg-white p-5">
                                <div className="flex min-w-0 items-start gap-3">
                                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-100 text-primary-700">
                                        <Icon icon="tabler:mail" width="22" aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="font-heading font-semibold wrap-anywhere text-secondary-950">{invitation.workspace_name}</h2>
                                        <p className="mt-1 text-sm wrap-anywhere text-secondary-700">Te invitó {invitation.inviter_name}</p>
                                        <p className="mt-1 text-xs text-secondary-600">Vence el {formatInvitationExpiry(invitation.expires_at)}</p>
                                    </div>
                                </div>
                                <Button loading={accepting === invitation.id} loadingText="Aceptando…"
                                    disabled={accepting !== null} onClick={() => handleAccept(invitation.id)}>
                                    Aceptar invitación
                                </Button>
                            </Card>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}
