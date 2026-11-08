import { Icon } from '@iconify/react'
import type { AuditLogEntry } from '@/features/audit/types/audit.types'

const dateFormat = new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium', timeStyle: 'short' })

const actionLabels: Record<string, string> = {
    'document.created': 'Documento creado',
    'document.updated': 'Nueva versión guardada',
    'document.restored': 'Versión restaurada',
    'document.deleted': 'Documento eliminado',
    'document.permission_changed': 'Permiso asignado o actualizado',
    'document.permission_revoked': 'Permiso retirado',
    'space_work.created': 'Espacio creado',
    'space_work.archived': 'Espacio archivado',
    'space_work.member_removed': 'Miembro retirado',
    'invitation.created': 'Invitación enviada',
    'invitation.accepted': 'Invitación aceptada',
    'invitation.cancelled': 'Invitación cancelada',
}

const resourceLabels: Record<string, string> = {
    document: 'Documento',
    space_work: 'Espacio',
    space_work_user: 'Membresía',
    space_work_invitation: 'Invitación',
}

export default function AuditEvent({ entry }: { entry: AuditLogEntry }) {
    const resource = entry.resource_name ?? resourceLabels[entry.entity_type] ?? entry.entity_type
    const actor = entry.actor_name ?? 'Usuario no disponible'

    return (
        <li className="flex flex-wrap items-start justify-between gap-x-5 gap-y-2 p-4 sm:px-5">
            <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-100 text-primary-700">
                    <Icon icon="tabler:history" width="20" aria-hidden="true" />
                </span>
                <div className="min-w-0 wrap-anywhere">
                    <p className="text-sm font-semibold text-secondary-950">{actionLabels[entry.action] ?? entry.action}</p>
                    {entry.description && <p className="mt-1 text-sm text-secondary-700">{entry.description}</p>}
                    <p className="mt-1 text-xs text-secondary-700">{actor} · {resource}</p>
                </div>
            </div>
            <time dateTime={entry.created_at} className="ml-13 text-xs text-secondary-700 sm:ml-0">
                {dateFormat.format(new Date(entry.created_at))}
            </time>
        </li>
    )
}
