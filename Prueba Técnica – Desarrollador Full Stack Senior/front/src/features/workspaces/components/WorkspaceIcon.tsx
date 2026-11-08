import { Icon } from '@iconify/react'
import { workspaceColors, workspaceIcons } from '@/features/workspaces/constants/workspaceAppearance'
import type { WorkspaceAppearance } from '@/features/workspaces/types/workspace.types'

export default function WorkspaceIcon({ icon_key, color_key, solid = false }: WorkspaceAppearance & { solid?: boolean }) {
    const icon = workspaceIcons[icon_key] ?? workspaceIcons.folder
    const color = workspaceColors[color_key] ?? workspaceColors.blue
    const colorClasses = solid ? `${color.solid} text-white` : `${color.soft} ${color.text}`

    return (
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${colorClasses}`}>
            <Icon icon={icon.icon} width="23" aria-hidden="true" />
        </span>
    )
}
