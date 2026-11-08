import { useState } from 'react'
import { Icon } from '@iconify/react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import emptyIllustration from '@/assets/Empty-amico.svg'
import ConfirmDeleteDocumentDialog from '@/features/documents/components/ConfirmDeleteDocumentDialog'
import CreateDocumentDialog from '@/features/documents/components/CreateDocumentDialog'
import { useDocuments } from '@/features/documents/hooks/useDocuments'
import { getSessionUserId } from '@/features/auth/session/sessionToken'
import WorkspaceInvitationDialog from '@/features/invitations/components/WorkspaceInvitationDialog'
import type { DocumentListItem } from '@/features/documents/types/document.types'
import { useWorkspaceCapabilities } from '@/features/workspaces/hooks/useWorkspaceCapabilities'
import Button from '@/shared/components/Button'
import Breadcrumbs from '@/shared/components/Breadcrumbs'
import Card from '@/shared/components/Card'
import CardActions from '@/shared/components/CardActions'
import Input from '@/shared/components/Input'

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'medium' })
const dayInMs = 24 * 60 * 60 * 1000
const selectClass = 'h-9 min-w-0 max-w-full rounded-lg border border-neutral-200 bg-primary-100 px-3 text-sm text-secondary-950'

function documentDate(document: DocumentListItem) {
    return new Date(document.updated_at ?? document.created_at)
}

function WorkspaceDocuments({ workspaceId }: { workspaceId: number }) {
    const navigate = useNavigate()
    const { catalog, loadError, addDocument, removeDocument, deletingId, deleteError } = useDocuments(workspaceId)
    const { canCreateWorkspace, error: permissionError } = useWorkspaceCapabilities()
    const [searchParams, setSearchParams] = useSearchParams()
    const [query, setQuery] = useState('')
    const [period, setPeriod] = useState(0)
    const [now] = useState(Date.now)
    const [order, setOrder] = useState('recent')
    const [view, setView] = useState<'grid' | 'list'>('grid')
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [documentToDelete, setDocumentToDelete] = useState<DocumentListItem | null>(null)

    const workspace = catalog?.workspace
    const isOwner = !!workspace && workspace.owner_user_id === getSessionUserId()
    const canManage = isOwner && canCreateWorkspace
    const invitationStep = searchParams.get('invitar')
    const isCatalogEmpty = catalog?.documents.length === 0
    const search = query.trim().toLocaleLowerCase()
    const from = now - period * dayInMs
    const documents = (catalog?.documents ?? []).filter((document) =>
        document.title.toLocaleLowerCase().includes(search) &&
        (!period || documentDate(document).getTime() >= from),
    ).sort((first, second) => {
        if (order === 'name') return first.title.localeCompare(second.title, 'es')
        const difference = documentDate(second).getTime() - documentDate(first).getTime()
        return order === 'oldest' ? -difference : difference
    })

    function setInvitationOpen(open: boolean) {
        const params = new URLSearchParams(searchParams)
        if (open) params.set('invitar', '1')
        else params.delete('invitar')
        setSearchParams(params, { replace: true })
    }

    return (
        <section aria-labelledby="documents-title" className="mx-auto max-w-7xl space-y-5">
            <Breadcrumbs items={[
                { label: 'Espacios de trabajo', to: '/workspaces' },
                ...(workspace ? [{ label: workspace.name }] : []),
                { label: 'Documentos' },
            ]} />
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <h1 id="documents-title" className="font-heading text-3xl font-bold tracking-tight wrap-anywhere text-secondary-950 md:text-4xl">
                        {workspace?.name ?? 'Documentos'}
                    </h1>
                    {workspace?.description && (
                        <p className="mt-2 max-w-2xl text-sm wrap-anywhere text-secondary-700">{workspace.description}</p>
                    )}
                </div>
                {(canManage || workspace?.member_summary) && (
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => navigate(`/workspaces/${workspaceId}/members`)}
                            startIcon={<Icon icon="tabler:users" width="19" />}>
                            Miembros
                        </Button>
                        {canManage && (
                            <>
                                <Button variant="outline" onClick={() => setInvitationOpen(true)}
                                    startIcon={<Icon icon="tabler:user-plus" width="19" />}>
                                    Invitar personas
                                </Button>
                                <Button onClick={() => setShowCreateDialog(true)} startIcon={<Icon icon="solar:add-circle-linear" width="20" />}>
                                    Nuevo documento
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </header>

            {isOwner && permissionError && (
                <p role="alert" className="rounded-xl bg-warning-bg p-3 text-sm text-warning-text">{permissionError}</p>
            )}
            {catalog && !isCatalogEmpty && (
                <Card className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-100 bg-white p-3">
                    <Input
                        type="search"
                        size="sm"
                        aria-label="Filtrar documentos por nombre"
                        placeholder="Filtrar por nombre…"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        containerClassName="w-full sm:min-w-48 sm:flex-1"
                        startIcon={<Icon icon="solar:magnifer-linear" width="17" />}
                    />
                    <select
                        aria-label="Filtrar por fecha de modificación"
                        value={period}
                        onChange={(event) => setPeriod(Number(event.target.value))}
                        className={selectClass}
                    >
                        <option value={0}>Cualquier fecha</option>
                        <option value={7}>Últimos 7 días</option>
                        <option value={30}>Últimos 30 días</option>
                    </select>
                    <select aria-label="Ordenar documentos" value={order} onChange={(event) => setOrder(event.target.value)}
                        className={selectClass}>
                        <option value="recent">Más recientes</option>
                        <option value="oldest">Más antiguos</option>
                        <option value="name">Nombre (A–Z)</option>
                    </select>

                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <span role="status" className="text-xs text-secondary-700">
                            {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
                        </span>
                        <div role="group" aria-label="Vista de documentos" className="flex gap-1 rounded-lg bg-primary-100 p-1">
                            <Button variant="custom" size="icon" aria-label="Vista de cuadrícula" aria-pressed={view === 'grid'}
                                className="text-primary-700 aria-pressed:bg-white" onClick={() => setView('grid')}>
                                <Icon icon="solar:widget-linear" width="19" aria-hidden="true" />
                            </Button>
                            <Button variant="custom" size="icon" aria-label="Vista de lista" aria-pressed={view === 'list'}
                                className="text-primary-700 aria-pressed:bg-white" onClick={() => setView('list')}>
                                <Icon icon="solar:list-linear" width="19" aria-hidden="true" />
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {loadError && <p role="alert" className="rounded-xl bg-danger-bg p-4 text-sm text-danger-text">{loadError}</p>}
            {deleteError && <p role="alert" className="rounded-xl bg-danger-bg p-4 text-sm text-danger-text">{deleteError}</p>}
            {deletingId !== null && <p role="status" className="text-sm text-secondary-700">Eliminando documento…</p>}
            {!catalog && !loadError && <p role="status" className="text-sm text-secondary-700">Cargando documentos…</p>}
            {isCatalogEmpty && (
                <Card className="flex min-h-96 flex-col items-center justify-center rounded-2xl border border-neutral-100 bg-white px-6 py-10 text-center">
                    <img src={emptyIllustration} alt="" className="mb-5 w-64 max-w-full sm:w-80" />
                    <h2 className="font-heading text-xl font-semibold text-secondary-950">Este espacio aún no tiene documentos disponibles</h2>
                    <p className="mt-2 max-w-sm text-sm text-secondary-700">
                        {canManage
                            ? 'Crea el primer documento para empezar a organizar el trabajo del equipo.'
                            : 'Aquí aparecerán los documentos de este espacio a los que tengas acceso.'}
                    </p>
                    {canManage && (
                        <Button className="mt-5" onClick={() => setShowCreateDialog(true)} startIcon={<Icon icon="solar:add-circle-linear" width="20" />}>
                            Crear mi primer documento
                        </Button>
                    )}
                </Card>
            )}
            {catalog && !isCatalogEmpty && documents.length === 0 && (
                <Card className="rounded-xl border border-neutral-100 bg-white p-8 text-center text-sm text-secondary-700">
                    No hay documentos que coincidan con los filtros.
                </Card>
            )}

            {canManage && workspace && (invitationStep === 'nuevo' || invitationStep === '1') && (
                <WorkspaceInvitationDialog
                    workspaceId={workspace.id}
                    workspaceName={workspace.name}
                    afterCreation={invitationStep === 'nuevo'}
                    onDismiss={() => setInvitationOpen(false)}
                />
            )}

            {showCreateDialog && canManage && workspace && (
                <CreateDocumentDialog
                    workspaceName={workspace.name}
                    onDismiss={() => setShowCreateDialog(false)}
                    onCreate={async (title) => {
                        await addDocument(title)
                        setQuery('')
                        setPeriod(0)
                    }}
                />
            )}

            {documents.length > 0 && (
                <ul className={view === 'grid' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'grid gap-3'}>
                    {documents.map((document) => (
                        <li key={document.id} className="relative min-w-0">
                            <Link to={`/document/${document.id}`} className="block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
                                <Card className={`h-full rounded-xl border border-neutral-100 bg-white p-5 shadow-sm ${view === 'list' ? 'sm:flex sm:items-center sm:justify-between sm:gap-4' : ''} ${canManage && view === 'list' ? 'sm:pr-16' : ''}`}>
                                    <div className={`flex min-w-0 items-start gap-3 ${canManage ? 'pr-10' : ''} ${view === 'list' ? 'sm:pr-0' : ''}`}>
                                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-100 text-primary-700">
                                            <Icon icon="solar:document-text-linear" width="21" aria-hidden="true" />
                                        </span>
                                        <div className="min-w-0">
                                            <h2 className="break-words font-heading font-semibold text-secondary-950">{document.title}</h2>
                                        </div>
                                    </div>
                                    <div className={`flex flex-wrap items-center gap-2 text-xs text-secondary-700 ${view === 'grid' ? 'mt-5 border-t border-neutral-100 pt-3' : 'mt-3 sm:mt-0'}`}>
                                        <Icon icon="solar:clock-circle-linear" width="15" aria-hidden="true" />
                                        <span>{dateFormat.format(documentDate(document))}</span>
                                        <span className="rounded-full bg-primary-100 px-2 py-1 text-primary-700">
                                            Versión {document.current_version_number}
                                        </span>
                                    </div>
                                </Card>
                            </Link>
                            {canManage && (
                                <CardActions label={`Acciones de ${document.title}`} className="absolute right-3 top-3"
                                    disabled={deletingId !== null}>
                                    <Button variant="ghost" size="sm" fullWidth
                                        className="justify-start! text-danger-text! hover:bg-danger-bg!"
                                        startIcon={<Icon icon="tabler:trash" width="18" />}
                                        onClick={() => setDocumentToDelete(document)}>
                                        Eliminar
                                    </Button>
                                </CardActions>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            <ConfirmDeleteDocumentDialog
                documentTitle={canManage ? documentToDelete?.title ?? null : null}
                onCancel={() => setDocumentToDelete(null)}
                onConfirm={() => {
                    if (canManage && documentToDelete) void removeDocument(documentToDelete.id)
                    setDocumentToDelete(null)
                }}
            />
        </section>
    )
}

export default function WorkspaceDocumentsPage() {
    const workspaceId = Number(useParams().workspaceId)
    if (!Number.isSafeInteger(workspaceId) || workspaceId <= 0) {
        return (
            <div className="space-y-3">
                <Breadcrumbs items={[{ label: 'Espacios de trabajo', to: '/workspaces' }, { label: 'Documentos' }]} />
                <p role="alert" className="text-sm text-danger-text">El espacio de trabajo indicado no es válido.</p>
            </div>
        )
    }
    return <WorkspaceDocuments key={workspaceId} workspaceId={workspaceId} />
}
