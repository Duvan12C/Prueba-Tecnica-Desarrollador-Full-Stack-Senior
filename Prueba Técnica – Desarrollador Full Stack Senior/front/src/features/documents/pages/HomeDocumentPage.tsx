import { useState } from 'react'
import { Icon } from '@iconify/react'
import emptyIllustration from '@/assets/Empty-amico.svg'
import CreateDocumentDialog from '@/features/documents/components/CreateDocumentDialog'
import { useDocuments } from '@/features/documents/hooks/useDocuments'
import { getSessionUserId } from '@/features/auth/session/sessionToken'
import Button from '@/shared/components/Button'
import Card from '@/shared/components/Card'
import Input from '@/shared/components/Input'

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'medium' })

export default function HomeDocumentPage() {
    const { catalog, loadError, addDocument } = useDocuments()
    const [query, setQuery] = useState('')
    const [space, setSpace] = useState('')
    const [view, setView] = useState<'grid' | 'list'>('grid')
    const [showCreateDialog, setShowCreateDialog] = useState(false)

    const userId = getSessionUserId()
    const ownedSpaces = catalog?.spaces.filter(({ owner_user_id }) => owner_user_id === userId) ?? []
    const canCreate = ownedSpaces.length > 0
    const isCatalogEmpty = catalog?.documents.length === 0
    const search = query.trim().toLocaleLowerCase()
    const documents = (catalog?.documents ?? []).filter((document) =>
        (!space || String(document.space_work_id) === space) &&
        document.title.toLocaleLowerCase().includes(search),
    )

    return (
        <section aria-labelledby="documents-title" className="mx-auto max-w-7xl space-y-5">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 id="documents-title" className="font-heading text-3xl font-bold tracking-tight text-secondary-950 md:text-4xl">
                        Documentos
                    </h1>
                    <p className="mt-2 text-sm text-secondary-700">
                        Consulta y organiza los documentos a los que tienes acceso en tus espacios de trabajo.
                    </p>
                </div>
                {canCreate && (
                    <Button onClick={() => setShowCreateDialog(true)} startIcon={<Icon icon="solar:add-circle-linear" width="20" />}>
                        Nuevo documento
                    </Button>
                )}
            </header>

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
                    aria-label="Filtrar por espacio"
                    value={space}
                    onChange={(event) => setSpace(event.target.value)}
                    className="h-9 min-w-0 max-w-full rounded-lg border border-neutral-200 bg-primary-100 px-3 text-sm text-secondary-950"
                >
                    <option value="">Todos los espacios</option>
                    {catalog?.spaces.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
                </select>

                <div className="ml-auto flex flex-wrap items-center gap-2">
                    {catalog && (
                        <span role="status" className="text-xs text-secondary-700">
                            {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
                        </span>
                    )}
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

            {loadError && <p role="alert" className="rounded-xl bg-danger-bg p-4 text-sm text-danger-text">{loadError}</p>}
            {!catalog && !loadError && <p role="status" className="text-sm text-secondary-700">Cargando documentos…</p>}
            {isCatalogEmpty && (
                <Card className="flex min-h-96 flex-col items-center justify-center rounded-2xl border border-neutral-100 bg-white px-6 py-10 text-center">
                    <img src={emptyIllustration} alt="" className="mb-5 w-64 max-w-full sm:w-80" />
                    <h2 className="font-heading text-xl font-semibold text-secondary-950">Aún no tienes documentos</h2>
                    <p className="mt-2 max-w-sm text-sm text-secondary-700">
                        {canCreate
                            ? 'Crea tu primer documento y empieza a organizar tus ideas en un espacio de trabajo.'
                            : 'Aquí aparecerán los documentos a los que tengas acceso.'}
                    </p>
                    {canCreate && (
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

            {showCreateDialog && canCreate && (
                <CreateDocumentDialog
                    spaces={ownedSpaces}
                    initialSpaceId={space}
                    onDismiss={() => setShowCreateDialog(false)}
                    onCreate={async (request) => {
                        await addDocument(request)
                        setQuery('')
                        setSpace('')
                    }}
                />
            )}

            {documents.length > 0 && (
                <ul className={view === 'grid' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'grid gap-3'}>
                    {documents.map((document) => (
                        <li key={document.id} className="min-w-0">
                            <Card className={`h-full rounded-xl border border-neutral-100 bg-white p-5 shadow-sm ${view === 'list' ? 'sm:flex sm:items-center sm:justify-between sm:gap-4' : ''}`}>
                                <div className="flex min-w-0 items-start gap-3">
                                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-100 text-primary-700">
                                        <Icon icon="solar:document-text-linear" width="21" aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="break-words text-xs font-medium text-primary-700">{document.spaceName}</p>
                                        <h2 className="mt-1 break-words font-heading font-semibold text-secondary-950">{document.title}</h2>
                                    </div>
                                </div>
                                <div className={`flex flex-wrap items-center gap-2 text-xs text-secondary-700 ${view === 'grid' ? 'mt-5 border-t border-neutral-100 pt-3' : 'mt-3 sm:mt-0'}`}>
                                    <Icon icon="solar:clock-circle-linear" width="15" aria-hidden="true" />
                                    <span>{dateFormat.format(new Date(document.updated_at ?? document.created_at))}</span>
                                    <span className="rounded-full bg-primary-100 px-2 py-1 text-primary-700">
                                        Versión {document.current_version_number}
                                    </span>
                                </div>
                            </Card>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}
