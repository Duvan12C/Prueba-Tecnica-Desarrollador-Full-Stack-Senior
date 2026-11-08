import { useState } from 'react'
import { useSearchParams } from 'react-router'
import AuditDateFilters from '@/features/audit/components/AuditDateFilters'
import AuditEvent from '@/features/audit/components/AuditEvent'
import { useAuditLog } from '@/features/audit/hooks/useAuditLog'
import type { AuditDateRange } from '@/features/audit/types/audit.types'
import { getSessionUserId } from '@/features/auth/session/sessionToken'
import { useWorkspaces } from '@/features/workspaces/hooks/useWorkspaces'
import Button from '@/shared/components/Button'
import Card from '@/shared/components/Card'

function WorkspaceAuditLog({ workspaceId, dates }: { workspaceId: number; dates: AuditDateRange }) {
    const { page, setPage, isLoading, error, entries, hasNext, total, pageCount } = useAuditLog(workspaceId, dates)

    return (
        <Card className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
            {error && <p role="alert" className="bg-danger-bg p-4 text-sm text-danger-text">{error}</p>}
            {isLoading && <p role="status" className="p-4 text-sm text-secondary-700">Cargando actividad…</p>}
            {entries?.length === 0 && <p className="p-4 text-sm text-secondary-700">No hay actividad para mostrar con estas fechas.</p>}
            {!!entries?.length && (
                <ul aria-label="Eventos de auditoría" className="divide-y divide-neutral-100">
                    {entries.map((entry) => <AuditEvent key={entry.id} entry={entry} />)}
                </ul>
            )}
            {(page > 0 || !!total) && (
                <nav aria-label="Páginas de la bitácora" className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 p-3">
                    <span className="text-xs text-secondary-700">
                        Página {page + 1}{pageCount ? ` de ${pageCount} · ${total} ${total === 1 ? 'evento' : 'eventos'}` : ''}
                    </span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page === 0 || isLoading}
                            onClick={() => setPage(page - 1)}>Anterior</Button>
                        <Button variant="outline" size="sm" disabled={!hasNext || isLoading}
                            onClick={() => setPage(page + 1)}>Siguiente</Button>
                    </div>
                </nav>
            )}
        </Card>
    )
}

export default function AuditPage() {
    const [params] = useSearchParams()
    const { workspaces, error } = useWorkspaces()
    const [selectedId, setSelectedId] = useState(() => Number(params.get('espacio')))
    const [dates, setDates] = useState<AuditDateRange>({})
    const userId = getSessionUserId()
    const ownedWorkspaces = workspaces?.filter(({ owner_user_id }) => owner_user_id === userId)
    const workspaceId = ownedWorkspaces?.find(({ id }) => id === selectedId)?.id ?? ownedWorkspaces?.[0]?.id

    return (
        <section aria-labelledby="audit-title" className="mx-auto max-w-6xl space-y-5">
            <header>
                <h1 id="audit-title" className="font-heading text-3xl font-bold tracking-tight text-secondary-950 md:text-4xl">
                    Auditoría
                </h1>
                <p className="mt-2 text-sm text-secondary-700">Consulta la actividad registrada en los espacios que administras.</p>
            </header>
            {error && <p role="alert" className="rounded-xl bg-danger-bg p-4 text-sm text-danger-text">{error}</p>}
            {!workspaces && !error && <p role="status" className="text-sm text-secondary-700">Cargando espacios de trabajo…</p>}
            {ownedWorkspaces?.length === 0 && (
                <Card className="rounded-2xl border border-neutral-100 bg-white p-5 text-sm text-secondary-700">
                    Aquí aparecerá la actividad de tus espacios de trabajo activos.
                </Card>
            )}
            {workspaceId !== undefined && (
                <>
                    <label className="grid w-full max-w-sm gap-2 text-sm font-medium text-secondary-950">
                        Espacio de trabajo
                        <select value={workspaceId} onChange={(event) => setSelectedId(Number(event.target.value))}
                            className="w-full min-w-0 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
                            {ownedWorkspaces?.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
                        </select>
                    </label>
                    <AuditDateFilters onApply={setDates} />
                    <WorkspaceAuditLog key={`${workspaceId}:${dates.startDate ?? ''}:${dates.endDate ?? ''}`} workspaceId={workspaceId} dates={dates} />
                </>
            )}
        </section>
    )
}
