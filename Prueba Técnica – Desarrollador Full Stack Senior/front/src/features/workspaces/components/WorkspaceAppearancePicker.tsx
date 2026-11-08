import { Icon } from '@iconify/react'
import { workspaceColors, workspaceIcons } from '@/features/workspaces/constants/workspaceAppearance'
import type { WorkspaceAppearance } from '@/features/workspaces/types/workspace.types'
import Button from '@/shared/components/Button'

interface WorkspaceAppearancePickerProps {
    appearance: WorkspaceAppearance
    onChange: (appearance: WorkspaceAppearance) => void
    disabled: boolean
}

const iconKeys = Object.keys(workspaceIcons) as WorkspaceAppearance['icon_key'][]
const colorKeys = Object.keys(workspaceColors) as WorkspaceAppearance['color_key'][]

export default function WorkspaceAppearancePicker({ appearance, onChange, disabled }: WorkspaceAppearancePickerProps) {
    return (
        <div className="flex flex-wrap gap-x-6 gap-y-4 rounded-xl bg-neutral-50 p-3">
            <fieldset>
                <legend className="mb-1.5 text-xs font-semibold text-secondary-900">Icono del espacio</legend>
                <div className="flex flex-wrap gap-1">
                    {iconKeys.map((key) => (
                        <Button key={key} variant="custom" size="icon" disabled={disabled}
                            title={workspaceIcons[key].label} aria-label={workspaceIcons[key].label}
                            aria-pressed={appearance.icon_key === key}
                            className="text-primary-700 hover:bg-white aria-pressed:bg-primary-100 aria-pressed:ring-1 aria-pressed:ring-primary-600"
                            onClick={() => onChange({ ...appearance, icon_key: key })}>
                            <Icon icon={workspaceIcons[key].icon} width="20" aria-hidden="true" />
                        </Button>
                    ))}
                </div>
            </fieldset>
            <fieldset>
                <legend className="mb-1.5 text-xs font-semibold text-secondary-900">Color del espacio</legend>
                <div className="flex flex-wrap gap-1">
                    {colorKeys.map((key) => (
                        <Button key={key} variant="custom" size="icon" disabled={disabled}
                            title={workspaceColors[key].label} aria-label={workspaceColors[key].label}
                            aria-pressed={appearance.color_key === key}
                            className="hover:bg-white aria-pressed:ring-1 aria-pressed:ring-primary-600"
                            onClick={() => onChange({ ...appearance, color_key: key })}>
                            <span className={`grid size-6 place-items-center rounded-full text-white ${workspaceColors[key].solid}`}>
                                {appearance.color_key === key && <Icon icon="tabler:check" width="15" aria-hidden="true" />}
                            </span>
                        </Button>
                    ))}
                </div>
            </fieldset>
        </div>
    )
}
