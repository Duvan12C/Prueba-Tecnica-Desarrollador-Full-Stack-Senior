import { useState } from 'react'
import type { DocumentMemberAccess, DocumentPermission } from '@/features/permissions/types/permission.types'
import Button from '@/shared/components/Button'

const permissionLabels: Record<DocumentPermission, string> = {
    read: 'Lectura',
    edit: 'Edición',
    admin: 'Administración',
}

interface DocumentAccessRowProps {
    member: DocumentMemberAccess
    isCurrentUser: boolean
    savingId: number | null
    onSave: (member: DocumentMemberAccess, permission: DocumentPermission | null) => void
}

export default function DocumentAccessRow({ member, isCurrentUser, savingId, onSave }: DocumentAccessRowProps) {
    const [selected, setSelected] = useState<DocumentPermission | ''>(member.permission ?? '')
    const canChange = !member.is_owner && !isCurrentUser
    const permissionLabel = member.permission ? permissionLabels[member.permission] : 'Sin acceso'

    return (
        <li className="flex flex-wrap items-center justify-between gap-2 px-1 py-3">
            <div className="min-w-0 wrap-anywhere">
                <p className="text-sm font-semibold text-secondary-950">{member.name}{isCurrentUser ? ' (tú)' : ''}</p>
                <p className="text-xs text-secondary-700">{member.email}</p>
            </div>
            {canChange ? (
                <div className="flex flex-wrap items-center gap-2">
                    <select value={selected} aria-label={`Permiso de ${member.name}`} disabled={savingId !== null}
                        onChange={(event) => setSelected(event.target.value as DocumentPermission | '')}
                        className="h-9 max-w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2 text-sm text-secondary-950 focus-visible:outline-2 focus-visible:outline-primary-500">
                        <option value="">Sin acceso</option>
                        {Object.entries(permissionLabels).map(([permission, label]) => (
                            <option key={permission} value={permission}>{label}</option>
                        ))}
                    </select>
                    <Button size="sm" disabled={savingId !== null || selected === (member.permission ?? '')}
                        loading={savingId === member.user_id} aria-label={`Guardar permiso de ${member.name}`}
                        onClick={() => onSave(member, selected || null)}>
                        Guardar
                    </Button>
                </div>
            ) : (
                <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-800">
                    {member.is_owner ? 'Propietario' : permissionLabel}
                </span>
            )}
        </li>
    )
}
