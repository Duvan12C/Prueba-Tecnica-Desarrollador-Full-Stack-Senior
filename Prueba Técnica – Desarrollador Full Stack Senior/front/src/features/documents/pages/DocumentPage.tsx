import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useBeforeUnload, useNavigate, useOutletContext, useParams } from 'react-router'
import type { WorkspaceOutletContext } from '@/app/WorkspaceLayout'
import { getSessionUserId } from '@/features/auth/session/sessionToken'
import CollaborationConflict from '@/features/collaboration/components/CollaborationConflict'
import CollaborationPresence from '@/features/collaboration/components/CollaborationPresence'
import { useDocumentCollaboration } from '@/features/collaboration/hooks/useDocumentCollaboration'
import ConfirmDeleteDocumentDialog from '@/features/documents/components/ConfirmDeleteDocumentDialog'
import DocumentEditor from '@/features/documents/components/DocumentEditor'
import { useDeleteDocument } from '@/features/documents/hooks/useDeleteDocument'
import { useDocument } from '@/features/documents/hooks/useDocument'
import DocumentPermissionsDialog from '@/features/permissions/components/DocumentPermissionsDialog'
import Breadcrumbs from '@/shared/components/Breadcrumbs'
import Button from '@/shared/components/Button'
import ConfirmDialog from '@/shared/components/ConfirmDialog'

function OpenDocument({ documentId, readOnly }: { documentId: number; readOnly: boolean }) {
    const navigate = useNavigate()
    const { workspaceCapabilities } = useOutletContext<WorkspaceOutletContext>()
    const { document, loadError } = useDocument(documentId)
    const collaboration = useDocumentCollaboration(documentId, document !== null, readOnly)
    const { deletingId, deleteError, remove } = useDeleteDocument()
    const [pendingPath, setPendingPath] = useState<string | null>(null)
    const [sharingOpen, setSharingOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const permission = collaboration.snapshot?.permission ?? document?.permission
    const canEdit = permission === 'admin' || permission === 'edit'
    const isEditing = canEdit && !readOnly
    const isConnected = collaboration.status === 'connected'
    const accessDenied = collaboration.status === 'denied'
    const hasChanges = collaboration.draft !== null
    const isSaving = collaboration.publishing !== null
    const isSyncing = isConnected && collaboration.pending !== null
    const isDeleting = deletingId !== null
    const isBusy = isSaving || isSyncing || isDeleting
    const userId = getSessionUserId()
    const canDelete = workspaceCapabilities.canCreateWorkspace
        && userId !== null
        && !accessDenied
        && permission === 'admin'
        && document?.workspaceOwnerId === userId

    useBeforeUnload((event) => {
        if (hasChanges || isBusy) event.preventDefault()
    })

    function open(path: string) {
        if (hasChanges) {
            setPendingPath(path)
            return
        }
        navigate(path)
    }

    async function handleDelete() {
        setDeleteOpen(false)
        if (!canDelete || !document || isBusy) return
        if (await remove(documentId)) navigate(`/workspaces/${document.space_work_id}`, { replace: true })
    }

    if (loadError) {
        return (
            <div className="space-y-4">
                <Breadcrumbs items={[{ label: 'Espacios de trabajo', to: '/workspaces' }, { label: 'Documento' }]} />
                <p role="alert" className="rounded-xl bg-danger-bg p-4 text-sm text-danger-text">{loadError}</p>
            </div>
        )
    }
    if (!document) return <p role="status" className="text-sm text-secondary-700">Abriendo documento…</p>
    const versionStatus = isSaving ? 'Guardando versión…'
        : isSyncing ? 'Sincronizando…'
            : hasChanges ? 'Cambios locales'
                : collaboration.snapshot?.has_unpublished_changes ? 'Borrador sincronizado'
                    : isEditing ? 'Guardada' : 'Solo lectura'

    return (
        <section aria-labelledby="document-title" className="mx-auto max-w-6xl space-y-4">
            <Breadcrumbs
                items={[
                    { label: 'Espacios de trabajo', to: '/workspaces' },
                    { label: document.workspaceName ?? 'Espacio de trabajo', to: `/workspaces/${document.space_work_id}` },
                    ...(isEditing ? [
                        { label: document.title, to: `/document/${documentId}/view` },
                        { label: 'Edición de documento' },
                    ] : [{ label: document.title }]),
                ]}
                linksDisabled={isBusy}
                onNavigate={open}
            />
            <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-100 bg-white p-4 sm:p-5">
                <div className="min-w-0">
                    <h1 id="document-title" className="font-heading text-xl font-bold wrap-anywhere text-secondary-950 sm:text-2xl">
                        {document.title}
                    </h1>
                    <p className="mt-1 text-xs text-secondary-700" role="status">
                        Versión {collaboration.snapshot?.version ?? document.current_version_number}
                        {' · '}{versionStatus}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" disabled={isBusy} onClick={() => open(`/document/${documentId}/history`)}
                        startIcon={<Icon icon="tabler:history" width="18" />}>
                        Historial
                    </Button>
                    {permission === 'admin' && !accessDenied && (
                        <Button variant="outline" disabled={isBusy} onClick={() => setSharingOpen(true)}
                            startIcon={<Icon icon="tabler:share" width="18" />}>
                            Compartir
                        </Button>
                    )}
                    {canDelete && (
                        <Button variant="outline" disabled={isBusy} loading={isDeleting} loadingText="Eliminando…"
                            className="text-danger-text! hover:bg-danger-bg!" onClick={() => setDeleteOpen(true)}
                            startIcon={<Icon icon="tabler:trash" width="18" />}>
                            Eliminar documento
                        </Button>
                    )}
                    {isEditing && !accessDenied && (
                        <Button onClick={collaboration.saveVersion} disabled={!collaboration.canPublish || isDeleting} loading={isSaving} loadingText="Guardando…"
                            startIcon={<Icon icon="tabler:device-floppy" width="18" />}>
                            Guardar versión
                        </Button>
                    )}
                    {readOnly && canEdit && !accessDenied && (
                        <Button disabled={isBusy} onClick={() => open(`/document/${documentId}`)} startIcon={<Icon icon="tabler:pencil" width="18" />}>
                            Editar documento
                        </Button>
                    )}
                </div>
            </header>
            <CollaborationPresence status={collaboration.status} participants={collaboration.participants} />
            {collaboration.activity && (
                <p role="status" className="rounded-xl border border-primary-200 bg-primary-100 px-3 py-2 text-sm text-primary-800">
                    {collaboration.activity.status === 'saving'
                        ? `${collaboration.activity.name} está guardando una versión…`
                        : `${collaboration.activity.name} guardó la versión ${collaboration.activity.version}.`}
                </p>
            )}
            {collaboration.error && (
                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-danger-bg p-4 text-sm text-danger-text">
                    <p role="alert">{collaboration.error}</p>
                    {collaboration.syncFailed && collaboration.canSync && (
                        <Button size="sm" variant="outline" onClick={collaboration.syncDraft}>Reintentar sincronización</Button>
                    )}
                </div>
            )}
            {deleteError && <p role="alert" className="rounded-xl bg-danger-bg p-4 text-sm text-danger-text">{deleteError}</p>}
            {collaboration.conflict && collaboration.snapshot && !accessDenied && (
                <CollaborationConflict snapshot={collaboration.snapshot} canApply={isConnected && isEditing && !isBusy}
                    onApply={collaboration.applyDraft} onDiscard={collaboration.discardDraft} />
            )}
            {(!accessDenied || hasChanges) && (
                <DocumentEditor
                    content={collaboration.draft ?? collaboration.snapshot?.content ?? document.content}
                    editable={isEditing && !accessDenied} disabled={isDeleting || !isConnected}
                    onChange={isEditing ? collaboration.updateDraft : undefined}
                />
            )}
            {sharingOpen && permission === 'admin' && !accessDenied && (
                <DocumentPermissionsDialog documentId={documentId} documentTitle={document.title} onClose={() => setSharingOpen(false)} />
            )}
            <ConfirmDeleteDocumentDialog
                documentTitle={deleteOpen && canDelete ? document.title : null}
                hasChanges={hasChanges}
                onCancel={() => setDeleteOpen(false)}
                onConfirm={handleDelete}
            />
            <ConfirmDialog
                open={pendingPath !== null}
                title="¿Salir sin guardar?"
                description="Los cambios locales sin sincronizar se perderán. El borrador compartido seguirá disponible."
                confirmLabel="Salir sin guardar"
                icon={<Icon icon="tabler:alert-triangle" width="22" />}
                destructive
                onCancel={() => setPendingPath(null)}
                onConfirm={() => { if (pendingPath) navigate(pendingPath) }}
            />
        </section>
    )
}

export default function DocumentPage({ readOnly = false }: { readOnly?: boolean }) {
    const documentId = Number(useParams().documentId)
    if (!Number.isSafeInteger(documentId) || documentId <= 0) {
        return <p role="alert" className="text-sm text-danger-text">El documento indicado no es válido.</p>
    }
    return <OpenDocument key={`${documentId}-${readOnly ? 'view' : 'edit'}`} documentId={documentId} readOnly={readOnly} />
}
