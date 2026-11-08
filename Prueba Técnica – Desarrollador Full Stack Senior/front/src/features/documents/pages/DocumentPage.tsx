import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useBeforeUnload, useNavigate, useParams } from 'react-router'
import DocumentEditor from '@/features/documents/components/DocumentEditor'
import { useDocument } from '@/features/documents/hooks/useDocument'
import Button from '@/shared/components/Button'
import ConfirmDialog from '@/shared/components/ConfirmDialog'

function OpenDocument({ documentId }: { documentId: number }) {
    const navigate = useNavigate()
    const { document, loadError, saveError, isSaving, save } = useDocument(documentId)
    const [draft, setDraft] = useState<string | null>(null)
    const [pendingPath, setPendingPath] = useState<string | null>(null)
    const hasChanges = draft !== null && draft !== document?.content

    useBeforeUnload((event) => {
        if (hasChanges || isSaving) event.preventDefault()
    })

    function open(path: string) {
        if (hasChanges) {
            setPendingPath(path)
            return
        }
        navigate(path)
    }

    async function handleSave() {
        if (draft === null || isSaving || !hasChanges) return
        if (await save(draft)) setDraft((current) => current === draft ? null : current)
    }

    if (loadError) {
        return (
            <div className="space-y-4">
                <p role="alert" className="rounded-xl bg-danger-bg p-4 text-sm text-danger-text">{loadError}</p>
                <Button variant="outline" onClick={() => navigate('/document')}>Volver a documentos</Button>
            </div>
        )
    }
    if (!document) return <p role="status" className="text-sm text-secondary-700">Abriendo documento…</p>

    return (
        <section aria-labelledby="document-title" className="mx-auto max-w-6xl space-y-4">
            <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-100 bg-white p-4 sm:p-5">
                <div className="flex min-w-0 items-center gap-3">
                    <Button variant="ghost" size="icon" aria-label="Volver a documentos" disabled={isSaving}
                        onClick={() => open(`/document?space=${document.space_work_id}`)}>
                        <Icon icon="tabler:arrow-left" width="20" aria-hidden="true" />
                    </Button>
                    <div className="min-w-0">
                        <h1 id="document-title" className="font-heading text-xl font-bold wrap-anywhere text-secondary-950 sm:text-2xl">
                            {document.title}
                        </h1>
                        <p className="mt-1 text-xs text-secondary-700" role="status">
                            Versión {document.current_version_number}
                            {hasChanges ? ' · Cambios sin guardar' : document.canEdit ? ' · Guardada' : ' · Solo lectura'}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" disabled={isSaving} onClick={() => open(`/document/${documentId}/history`)}
                        startIcon={<Icon icon="tabler:history" width="18" />}>
                        Historial
                    </Button>
                    {document.canEdit && (
                        <Button onClick={handleSave} disabled={!hasChanges} loading={isSaving} loadingText="Guardando…"
                            startIcon={<Icon icon="tabler:device-floppy" width="18" />}>
                            Guardar versión
                        </Button>
                    )}
                </div>
            </header>
            {saveError && <p role="alert" className="rounded-xl bg-danger-bg p-4 text-sm text-danger-text">{saveError}</p>}
            <DocumentEditor content={document.content} editable={document.canEdit} disabled={isSaving} onChange={setDraft} />
            <ConfirmDialog
                open={pendingPath !== null}
                title="¿Salir sin guardar?"
                description="Perderás los cambios que todavía no has guardado. La última versión guardada seguirá disponible."
                confirmLabel="Salir sin guardar"
                icon={<Icon icon="tabler:alert-triangle" width="22" />}
                destructive
                onCancel={() => setPendingPath(null)}
                onConfirm={() => { if (pendingPath) navigate(pendingPath) }}
            />
        </section>
    )
}

export default function DocumentPage() {
    const documentId = Number(useParams().documentId)
    if (!Number.isSafeInteger(documentId) || documentId <= 0) {
        return <p role="alert" className="text-sm text-danger-text">El documento indicado no es válido.</p>
    }
    return <OpenDocument key={documentId} documentId={documentId} />
}
