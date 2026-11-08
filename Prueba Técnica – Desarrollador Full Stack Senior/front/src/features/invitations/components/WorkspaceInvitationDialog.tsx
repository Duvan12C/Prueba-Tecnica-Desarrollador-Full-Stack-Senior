import { useLayoutEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { motion, useReducedMotion } from 'motion/react'
import { MAX_INVITEES, useWorkspaceInvitation } from '@/features/invitations/hooks/useWorkspaceInvitation'
import Button from '@/shared/components/Button'
import Input from '@/shared/components/Input'

interface WorkspaceInvitationDialogProps {
    workspaceId: number
    workspaceName: string
    afterCreation: boolean
    dismissLabel?: string
    onSent?: () => void
    onDismiss: () => void
}

export default function WorkspaceInvitationDialog({ workspaceId, workspaceName, afterCreation, dismissLabel = 'Ir a documentos', onSent, onDismiss }: WorkspaceInvitationDialogProps) {
    const dialog = useRef<HTMLDialogElement>(null)
    const reducedMotion = useReducedMotion()
    const {
        search, updateSearch, selected, select, remove, invite, isSending, sentCount, error,
        candidates, searchError, isSearching,
    } = useWorkspaceInvitation(workspaceId)

    useLayoutEffect(() => {
        const element = dialog.current
        element?.showModal()
        return () => element?.close()
    }, [])

    return (
        <dialog ref={dialog} aria-labelledby="invite-workspace-title"
            onCancel={(event) => {
                event.preventDefault()
                if (!isSending) onDismiss()
            }}
            className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl bg-transparent p-0 backdrop:bg-secondary-950/55">
            <motion.div
                initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.2 }}
                className="space-y-4 rounded-2xl border border-neutral-100 bg-white p-5 shadow-xl sm:p-6"
            >
                <header className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-100 text-primary-700">
                        <Icon icon="tabler:user-plus" width="23" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold wrap-anywhere text-primary-700">
                            {afterCreation ? 'Espacio creado · Paso opcional' : workspaceName}
                        </p>
                        <h2 id="invite-workspace-title" className="mt-1 font-heading text-xl font-bold text-secondary-950">Invitar personas</h2>
                    </div>
                </header>
                <p className="text-sm leading-relaxed text-secondary-700">
                    Busca cuentas de DocSpace y selecciona a quienes quieras invitar a <strong className="wrap-anywhere">{workspaceName}</strong>.
                    Después podrás asignarles permisos por documento.
                </p>

                <div className="flex flex-wrap gap-2">
                    <Input id="workspace-invite-search" autoFocus type="search" autoComplete="off" maxLength={150}
                        aria-label="Buscar usuarios registrados" aria-describedby="workspace-invite-hint"
                        value={search} onChange={(event) => updateSearch(event.target.value)} disabled={isSending}
                        placeholder="Buscar usuarios…" containerClassName="w-full sm:w-auto sm:flex-1"
                        startIcon={<Icon icon="tabler:user-search" width="19" />} />
                    <Button onClick={async () => { if (await invite()) onSent?.() }}
                        disabled={!selected.length} loading={isSending} loadingText="Invitando…"
                        startIcon={<Icon icon="tabler:user-plus" width="19" />}>
                        {selected.length ? `Invitar (${selected.length})` : 'Invitar'}
                    </Button>
                </div>
                <p id="workspace-invite-hint" className="text-xs text-secondary-700">
                    Escribe al menos 2 caracteres del nombre o correo. Puedes invitar hasta {MAX_INVITEES} personas a la vez.
                </p>

                {selected.length > 0 && (
                    <ul aria-label="Usuarios seleccionados" className="flex flex-wrap gap-2">
                        {selected.map(({ id, name }) => (
                            <li key={id} className="min-w-0 max-w-full">
                                <Button variant="custom" size="sm" disabled={isSending} onClick={() => remove(id)}
                                    aria-label={`Quitar a ${name}`} endIcon={<Icon icon="tabler:x" width="16" />}
                                    className="max-w-full bg-primary-100! whitespace-normal! text-primary-700! hover:bg-primary-200!">
                                    <span className="min-w-0 wrap-anywhere">{name}</span>
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}

                {isSearching && <p role="status" className="text-sm text-secondary-700">Buscando cuentas…</p>}
                {searchError && <p role="alert" className="rounded-lg bg-danger-bg p-3 text-sm text-danger-text">{searchError}</p>}
                {search.trim().length >= 2 && !isSearching && !searchError && !candidates.length && (
                    <p role="status" className="text-sm text-secondary-700">No hay más cuentas disponibles para esa búsqueda.</p>
                )}
                {candidates.length > 0 && (
                    <ul aria-label="Resultados de búsqueda" className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-neutral-100 bg-neutral-50 p-1">
                        {candidates.map((candidate) => (
                            <li key={candidate.id}>
                                <Button variant="custom" fullWidth disabled={isSending || selected.length >= MAX_INVITEES}
                                    onClick={() => select(candidate)} endIcon={<Icon icon="tabler:plus" width="18" />}
                                    className="h-auto justify-between! whitespace-normal! px-3 py-2 text-left hover:bg-white">
                                    <span className="min-w-0 wrap-anywhere">
                                        <span className="block text-sm text-secondary-950">{candidate.name}</span>
                                        <span className="block text-xs font-normal text-secondary-700">{candidate.email}</span>
                                    </span>
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
                {error && <p role="alert" className="rounded-lg bg-danger-bg p-3 text-sm text-danger-text">{error}</p>}
                {sentCount !== null && (
                    <p role="status" className="rounded-lg bg-success-bg p-3 text-sm text-success-text">
                        {sentCount === 1 ? 'Invitación enviada a su cuenta de DocSpace.' : `${sentCount} invitaciones enviadas a sus cuentas de DocSpace.`}
                    </p>
                )}
                <div className="flex justify-end border-t border-neutral-100 pt-3">
                    <Button variant="outline" disabled={isSending} onClick={onDismiss}>
                        {afterCreation && sentCount === null ? 'Omitir por ahora' : dismissLabel}
                    </Button>
                </div>
            </motion.div>
        </dialog>
    )
}
