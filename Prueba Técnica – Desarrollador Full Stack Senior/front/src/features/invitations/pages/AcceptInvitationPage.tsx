import { useSyncExternalStore } from 'react'
import { Icon } from '@iconify/react'
import { Link, useLocation, useNavigate } from 'react-router'
import { signOut } from '@/features/auth/session/sessionLifecycle'
import { getSessionId, subscribeToSession } from '@/features/auth/session/sessionToken'
import { useAcceptInvitation } from '@/features/invitations/hooks/useAcceptInvitation'
import { readInvitationToken } from '@/features/invitations/utils/invitationLink'
import Button from '@/shared/components/Button'
import Card from '@/shared/components/Card'

function InvitationActions({ token }: { token: string }) {
    const navigate = useNavigate()
    const sessionId = useSyncExternalStore(subscribeToSession, getSessionId)
    const { accept, error, isAccepting } = useAcceptInvitation()
    const state = { invitationToken: token }

    async function handleAccept() {
        if (isAccepting) return
        const invitation = await accept(token)
        if (invitation) navigate(`/workspaces/${invitation.space_work_id}`, { replace: true })
    }

    return (
        <div className="mt-5 space-y-4">
            <p className="text-sm leading-relaxed text-secondary-700">
                Usa la cuenta registrada con el correo al que se envió la invitación para unirte al espacio.
            </p>
            {sessionId ? (
                <>
                    {error && <p role="alert" className="rounded-lg bg-danger-bg p-3 text-sm text-danger-text">{error}</p>}
                    <Button fullWidth loading={isAccepting} loadingText="Aceptando…" onClick={handleAccept}>
                        Aceptar invitación
                    </Button>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link to="/workspaces" className="text-sm font-medium text-primary-700 hover:underline">Ir a mis espacios</Link>
                        <Button variant="ghost" size="sm" disabled={isAccepting} onClick={() => {
                            signOut()
                            navigate('/login', { state, replace: true })
                        }}>
                            Cambiar de cuenta
                        </Button>
                    </div>
                </>
            ) : (
                <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={() => navigate('/login', { state })}>Iniciar sesión</Button>
                    <Link to="/register" state={state} className="text-sm font-medium text-primary-700 hover:underline">Crear cuenta</Link>
                </div>
            )}
        </div>
    )
}

export default function AcceptInvitationPage() {
    const { hash } = useLocation()
    const token = readInvitationToken(hash)

    return (
        <main className="grid min-h-dvh place-items-center bg-neutral-50 p-4">
            <Card className="w-full max-w-md rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm sm:p-8">
                <span className="grid size-12 place-items-center rounded-xl bg-primary-100 text-primary-700">
                    <Icon icon="tabler:mail-opened" width="24" aria-hidden="true" />
                </span>
                <h1 className="mt-4 font-heading text-2xl font-bold text-secondary-950">Invitación a un espacio de trabajo</h1>
                {token ? (
                    <InvitationActions key={token} token={token} />
                ) : (
                    <p role="alert" className="mt-4 rounded-lg bg-danger-bg p-3 text-sm text-danger-text">
                        El enlace de invitación es inválido. Solicita un nuevo enlace al Gestor del espacio.
                    </p>
                )}
            </Card>
        </main>
    )
}
