import { Icon } from '@iconify/react'
import { Link } from 'react-router'
import DashboardPanel from '@/features/dashboard/components/DashboardPanel'
import type { DocumentListItem } from '@/features/documents/types/document.types'

const dateFormat = new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium' })
const RECENT_LIMIT = 5

function dateOf(document: DocumentListItem) {
    return document.updated_at ?? document.created_at
}

interface RecentDocumentsProps {
    workspaceId: number
    documents: DocumentListItem[] | null
    error: string | null
}

export default function RecentDocuments({ workspaceId, documents, error }: RecentDocumentsProps) {
    const recent = documents?.slice()
        .sort((first, second) => Date.parse(dateOf(second)) - Date.parse(dateOf(first)) || second.id - first.id)
        .slice(0, RECENT_LIMIT)

    return (
        <DashboardPanel title="Documentos recientes" to={`/workspaces/${workspaceId}`} action="Ver documentos">
            {error && <p role="alert" className="rounded-lg bg-danger-bg p-3 text-sm text-danger-text">{error}</p>}
            {!recent && !error && <p role="status" className="text-sm text-secondary-700">Cargando documentos…</p>}
            {recent?.length === 0 && <p className="rounded-xl bg-neutral-50 p-4 text-sm text-secondary-700">Aún no hay documentos disponibles en este espacio.</p>}
            {!!recent?.length && (
                <ul className="space-y-2">
                    {recent.map((document) => (
                        <li key={document.id}>
                            <Link to={`/document/${document.id}`} className="flex min-w-0 items-center gap-3 rounded-xl bg-neutral-50 p-3 hover:bg-primary-100 focus-visible:outline-2 focus-visible:outline-primary-500">
                                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-200 text-primary-700">
                                    <Icon icon="tabler:file-text" width="19" aria-hidden="true" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold wrap-anywhere text-secondary-950">{document.title}</p>
                                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-secondary-700">
                                        <time dateTime={dateOf(document)}>{dateFormat.format(new Date(dateOf(document)))}</time>
                                        <span className="rounded-full bg-white px-2 py-0.5 text-primary-700">Versión {document.current_version_number}</span>
                                    </p>
                                </div>
                                <Icon icon="tabler:chevron-right" width="16" className="shrink-0 text-secondary-600" aria-hidden="true" />
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </DashboardPanel>
    )
}
