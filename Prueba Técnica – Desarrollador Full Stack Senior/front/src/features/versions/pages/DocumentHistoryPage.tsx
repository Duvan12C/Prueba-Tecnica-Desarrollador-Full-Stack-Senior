import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useNavigate, useParams } from 'react-router'
import { useDocument } from '@/features/documents/hooks/useDocument'
import VersionComparisonView from '@/features/versions/components/VersionComparisonView'
import { useVersionHistory } from '@/features/versions/hooks/useVersionHistory'
import Button from '@/shared/components/Button'
import Card from '@/shared/components/Card'
import ConfirmDialog from '@/shared/components/ConfirmDialog'

const dateFormat = new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium', timeStyle: 'short' })
const selectClass = 'mt-1 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm'

function DocumentHistory({ documentId }: { documentId: number }) {
    const navigate = useNavigate()
    const { document, loadError: documentError } = useDocument(documentId)
    const { versions, comparison, loadError, actionError, pending, restoreForbidden, clearComparison, compare, restore } = useVersionHistory(documentId)
    const [previousNumber, setPreviousNumber] = useState<number | null>(null)
    const [restoredNumber, setRestoredNumber] = useState<number | null>(null)
    const [showRestoreDialog, setShowRestoreDialog] = useState(false)
    const latest = versions?.[0]
    const previousVersions = versions?.slice(1) ?? []
    const previous = previousVersions.find((version) => version.version_number === previousNumber) ?? previousVersions[0]
    const canRestore = document?.canEdit && !restoreForbidden && !!previous

    function selectPrevious(version: number) {
        setPreviousNumber(version)
        clearComparison()
    }

    async function handleRestore() {
        if (!previous || pending || !canRestore) return
        setShowRestoreDialog(false)
        const version = await restore(previous.version_number)
        if (version) {
            setRestoredNumber(version.version_number)
            setPreviousNumber(previous.version_number)
        }
    }

    return (
        <section aria-labelledby="history-title" className="mx-auto max-w-7xl space-y-4">
            <header className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-4 sm:p-5">
                <Button variant="ghost" size="icon" aria-label="Volver al documento" disabled={pending === 'restore'}
                    onClick={() => navigate(`/document/${documentId}`)}>
                    <Icon icon="tabler:arrow-left" width="20" aria-hidden="true" />
                </Button>
                <div className="min-w-0">
                    {document && <p className="text-sm wrap-anywhere text-secondary-700">{document.title}</p>}
                    <h1 id="history-title" className="font-heading text-xl font-bold text-secondary-950 sm:text-2xl">
                        Historial de versiones
                    </h1>
                </div>
            </header>

            {(documentError || loadError) && (
                <p role="alert" className="rounded-xl bg-danger-bg p-4 text-sm text-danger-text">{documentError || loadError}</p>
            )}
            {!documentError && !loadError && (!document || !versions) && (
                <p role="status" className="text-sm text-secondary-700">Cargando historial…</p>
            )}
            {document && versions && !versions.length && (
                <p role="status" className="rounded-xl bg-white p-4 text-sm text-secondary-700">El documento todavía no tiene versiones.</p>
            )}

            {document && versions && latest && (
                <div className="grid items-start gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
                    <Card className="rounded-2xl border border-neutral-100 bg-white p-4">
                        <h2 className="text-sm font-semibold text-secondary-950">Línea de tiempo</h2>
                        <p className="mt-1 text-xs text-secondary-700">{versions.length} {versions.length === 1 ? 'versión' : 'versiones'}</p>
                        <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto">
                            {versions.map((version) => {
                                const isCurrent = version.id === latest.id
                                const entry = (
                                    <span>
                                        <span className="block text-sm text-secondary-950">
                                            Versión {version.version_number}{isCurrent && ' · Actual'}
                                        </span>
                                        <span className="mt-1 block text-xs font-normal text-secondary-700">
                                            Usuario #{version.created_by_user_id} · {dateFormat.format(new Date(version.created_at))}
                                        </span>
                                        {version.change_summary && (
                                            <span className="mt-1 block text-xs font-normal wrap-anywhere text-secondary-700">{version.change_summary}</span>
                                        )}
                                    </span>
                                )
                                return (
                                    <li key={version.id}>
                                        {isCurrent ? (
                                            <div className="rounded-lg bg-neutral-50 px-3 py-2 font-semibold">{entry}</div>
                                        ) : (
                                            <Button variant="custom" fullWidth disabled={pending !== null} aria-pressed={version.id === previous?.id}
                                                onClick={() => selectPrevious(version.version_number)}
                                                className="h-auto min-h-0 justify-start! whitespace-normal! rounded-lg px-3 py-2 text-left hover:bg-neutral-50 aria-pressed:bg-primary-100">
                                                {entry}
                                            </Button>
                                        )}
                                    </li>
                                )
                            })}
                        </ul>
                    </Card>

                    <div className="min-w-0 space-y-4">
                        <Card className="grid items-end gap-3 rounded-2xl border border-neutral-100 bg-white p-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
                            <div className="text-xs font-medium text-secondary-700">
                                Versión actual
                                <p className="mt-1 flex h-10 items-center gap-2 rounded-lg bg-primary-100 px-3 text-sm font-semibold text-primary-700">
                                    <Icon icon="tabler:circle-check" width="18" aria-hidden="true" />
                                    Versión {latest.version_number}
                                </p>
                            </div>
                            <label className="text-xs font-medium text-secondary-700">
                                Comparar con
                                <select className={selectClass} value={previous?.version_number ?? ''} disabled={pending !== null || !previous}
                                    onChange={(event) => selectPrevious(Number(event.target.value))}>
                                    {!previous && <option value="">Sin versiones anteriores</option>}
                                    {previousVersions.map((version) => (
                                        <option key={version.id} value={version.version_number}>Versión {version.version_number}</option>
                                    ))}
                                </select>
                            </label>
                            <Button disabled={pending === 'restore' || !previous} loading={pending === 'compare'}
                                loadingText="Comparando…" onClick={() => { if (previous) void compare(previous.version_number, latest.version_number) }}>
                                Comparar versiones
                            </Button>
                        </Card>
                        {versions.length === 1 && (
                            <p className="text-sm text-secondary-700">Guarda otra versión en el editor para poder comparar.</p>
                        )}
                        {actionError && <p role="alert" className="rounded-xl bg-danger-bg p-4 text-sm text-danger-text">{actionError}</p>}
                        {restoredNumber !== null && (
                            <p role="status" className="rounded-xl bg-success-bg p-4 text-sm text-success-text">
                                Contenido restaurado como versión {restoredNumber}.
                            </p>
                        )}
                        <VersionComparisonView current={latest} previous={previous} comparison={comparison} />
                        {canRestore && previous && (
                            <Card className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary-100 p-4">
                                <p className="text-sm text-secondary-900">
                                    Restaurar la versión {previous.version_number} creará otra versión con su contenido.
                                </p>
                                <Button variant="outline" disabled={pending === 'compare'} loading={pending === 'restore'}
                                    loadingText="Restaurando…" onClick={() => setShowRestoreDialog(true)}>
                                    Restaurar versión {previous.version_number}
                                </Button>
                            </Card>
                        )}
                    </div>
                </div>
            )}
            {previous && (
                <ConfirmDialog
                    open={showRestoreDialog}
                    title={`¿Restaurar la versión ${previous.version_number}?`}
                    description="Su contenido se guardará como una nueva versión. Podrás seguir consultando todas las versiones anteriores."
                    confirmLabel="Restaurar versión"
                    icon={<Icon icon="tabler:history" width="22" />}
                    onCancel={() => setShowRestoreDialog(false)}
                    onConfirm={() => { void handleRestore() }}
                />
            )}
        </section>
    )
}

export default function DocumentHistoryPage() {
    const documentId = Number(useParams().documentId)
    if (!Number.isSafeInteger(documentId) || documentId <= 0) {
        return <p role="alert" className="text-sm text-danger-text">El documento indicado no es válido.</p>
    }
    return <DocumentHistory key={documentId} documentId={documentId} />
}
