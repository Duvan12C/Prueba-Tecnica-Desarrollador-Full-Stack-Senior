import { Icon } from '@iconify/react'
import type { CollaborationState } from '@/features/collaboration/state/collaborationState'

const statusLabels: Record<CollaborationState['status'], string> = {
    connecting: 'Conectando…',
    connected: 'En línea',
    reconnecting: 'Reconectando…',
    denied: 'Conexión cerrada',
}

export default function CollaborationPresence({ status, participants }: Pick<CollaborationState, 'status' | 'participants'>) {
    return (
        <div className="flex flex-wrap items-center gap-2 text-xs text-secondary-700" aria-live="polite">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${status === 'connected'
                ? 'bg-tertiary-100 text-tertiary-800' : 'bg-neutral-50 text-secondary-700'}`}>
                <span aria-hidden="true" className={`size-1.5 rounded-full ${status === 'connected' ? 'bg-tertiary-600' : 'bg-secondary-500'}`} />
                {statusLabels[status]}
            </span>
            {participants.length > 0 && (
                <ul aria-label="Personas conectadas" className="flex min-w-0 flex-wrap gap-1.5">
                    {participants.map((participant) => (
                        <li key={participant.user_id} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-primary-100 px-2.5 py-1 text-primary-800">
                            <Icon icon="tabler:user" width="14" className="shrink-0" aria-hidden="true" />
                            <span className="wrap-anywhere">{participant.name}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
