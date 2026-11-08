import { useId, useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { motion, useReducedMotion } from 'motion/react'
import { getSessionUserId } from '@/features/auth/session/sessionToken'
import DocumentAccessRow from '@/features/permissions/components/DocumentAccessRow'
import { useDocumentAccess } from '@/features/permissions/hooks/useDocumentAccess'
import Button from '@/shared/components/Button'
import Input from '@/shared/components/Input'

interface DocumentPermissionsDialogProps {
    documentId: number
    documentTitle: string
    onClose: () => void
}

export default function DocumentPermissionsDialog({ documentId, documentTitle, onClose }: DocumentPermissionsDialogProps) {
    const dialog = useRef<HTMLDialogElement>(null)
    const titleId = useId()
    const reducedMotion = useReducedMotion()
    const [query, setQuery] = useState('')
    const { members, error, status, savingId, save } = useDocumentAccess(documentId)
    const currentUserId = getSessionUserId()
    const search = query.trim().toLocaleLowerCase()
    const visibleMembers = members?.filter(({ name, email }) =>
        name.toLocaleLowerCase().includes(search) || email.toLocaleLowerCase().includes(search),
    ).sort((first, second) => Number(second.is_owner) - Number(first.is_owner))

    useLayoutEffect(() => {
        const element = dialog.current
        element?.showModal()
        return () => element?.close()
    }, [])

    return (
        <dialog ref={dialog} aria-labelledby={titleId}
            onCancel={(event) => {
                event.preventDefault()
                if (savingId === null) onClose()
            }}
            className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl bg-transparent p-0 backdrop:bg-secondary-950/55">
            <motion.div initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}
                className="space-y-4 rounded-2xl border border-neutral-100 bg-white p-5 shadow-xl sm:p-6">
                <header className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold wrap-anywhere text-primary-700">{documentTitle}</p>
                        <h2 id={titleId} className="mt-1 font-heading text-xl font-bold text-secondary-950">Compartir documento</h2>
                    </div>
                    <Button size="icon" variant="ghost" aria-label="Cerrar" disabled={savingId !== null} onClick={onClose}>
                        <Icon icon="tabler:x" width="20" aria-hidden="true" />
                    </Button>
                </header>
                <p className="text-sm text-secondary-700">Asigna acceso a los miembros del espacio para este documento.</p>
                <Input autoFocus type="search" value={query} onChange={(event) => setQuery(event.target.value)}
                    aria-label="Buscar miembros por nombre o correo" placeholder="Buscar miembros…"
                    startIcon={<Icon icon="tabler:user-search" width="19" />} />
                {error && <p role="alert" className="rounded-lg bg-danger-bg p-3 text-sm text-danger-text">{error}</p>}
                {status && <p role="status" className="text-sm text-tertiary-800">{status}</p>}
                {!members && !error && <p role="status" className="text-sm text-secondary-700">Cargando permisos…</p>}
                {visibleMembers?.length === 0 && <p className="text-sm text-secondary-700">No hay miembros para mostrar.</p>}
                {!!visibleMembers?.length && (
                    <ul aria-label="Acceso por miembro" className="max-h-72 divide-y divide-neutral-100 overflow-y-auto">
                        {visibleMembers.map((member) => (
                            <DocumentAccessRow key={member.user_id} member={member}
                                isCurrentUser={member.user_id === currentUserId} savingId={savingId} onSave={save} />
                        ))}
                    </ul>
                )}
                <dl className="grid gap-2 rounded-xl bg-primary-100 p-3 text-xs text-secondary-800 sm:grid-cols-3">
                    <div><dt className="font-semibold">Lectura</dt><dd>Ver el documento y su historial.</dd></div>
                    <div><dt className="font-semibold">Edición</dt><dd>Guardar versiones y restaurarlas.</dd></div>
                    <div><dt className="font-semibold">Administración</dt><dd>Editar y gestionar accesos.</dd></div>
                </dl>
            </motion.div>
        </dialog>
    )
}
