import { Icon } from '@iconify/react'
import Card from '@/shared/components/Card'

interface WorkspacePreviewProps {
    name: string
    description: string
}

export default function WorkspacePreview({ name, description }: WorkspacePreviewProps) {
    return (
        <Card className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-secondary-950">
                <Icon icon="solar:eye-linear" width="19" className="text-primary-600" aria-hidden="true" />
                Vista previa
            </h2>
            <div className="mt-4 rounded-xl bg-primary-100 p-5">
                <span className="grid size-11 place-items-center rounded-xl bg-primary-600 text-white">
                    <Icon icon="solar:folder-with-files-linear" width="23" aria-hidden="true" />
                </span>
                <p className="mt-4 text-xs font-semibold text-primary-700">Espacio de trabajo</p>
                <h3 className="mt-1 font-heading text-lg font-bold wrap-anywhere text-secondary-950">
                    {name || 'Nombre de tu espacio'}
                </h3>
                <p className="mt-2 line-clamp-4 text-sm leading-relaxed wrap-anywhere text-secondary-700">
                    {description || 'La descripción aparecerá aquí.'}
                </p>
                <div className="mt-4 flex items-center gap-2 border-t border-primary-200 pt-3 text-xs text-secondary-700">
                    <Icon icon="solar:document-text-linear" width="16" aria-hidden="true" />
                    0 documentos
                </div>
            </div>
        </Card>
    )
}
