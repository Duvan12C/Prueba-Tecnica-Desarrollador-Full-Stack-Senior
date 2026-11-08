import { Icon } from '@iconify/react'
import WorkspaceIcon from '@/features/workspaces/components/WorkspaceIcon'
import { workspaceColors } from '@/features/workspaces/constants/workspaceAppearance'
import type { WorkspaceAppearance } from '@/features/workspaces/types/workspace.types'
import Card from '@/shared/components/Card'

interface WorkspacePreviewProps {
    name: string
    description: string
    appearance: WorkspaceAppearance
}

export default function WorkspacePreview({ name, description, appearance }: WorkspacePreviewProps) {
    const color = workspaceColors[appearance.color_key]

    return (
        <Card className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-secondary-950">
                <Icon icon="solar:eye-linear" width="19" className="text-primary-600" aria-hidden="true" />
                Vista previa
            </h2>
            <div className={`mt-4 rounded-xl p-5 ${color.soft}`}>
                <WorkspaceIcon {...appearance} solid />
                <p className={`mt-4 text-xs font-semibold ${color.text}`}>Espacio de trabajo</p>
                <h3 className="mt-1 font-heading text-lg font-bold wrap-anywhere text-secondary-950">
                    {name || 'Nombre de tu espacio'}
                </h3>
                <p className="mt-2 line-clamp-4 text-sm leading-relaxed wrap-anywhere text-secondary-700">
                    {description || 'La descripción aparecerá aquí.'}
                </p>
                <div className="mt-4 flex items-center gap-2 border-t border-neutral-200 pt-3 text-xs text-secondary-700">
                    <Icon icon="solar:document-text-linear" width="16" aria-hidden="true" />
                    0 documentos
                </div>
            </div>
        </Card>
    )
}
