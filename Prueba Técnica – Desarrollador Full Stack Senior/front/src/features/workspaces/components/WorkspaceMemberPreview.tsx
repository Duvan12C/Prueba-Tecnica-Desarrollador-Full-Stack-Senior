import type { WorkspaceMemberSummary } from '@/features/workspaces/types/workspace.types'

export default function WorkspaceMemberPreview({ count, names }: WorkspaceMemberSummary) {
    const remaining = count - names.length

    return (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className="flex -space-x-1.5" aria-hidden="true">
                {names.map((name, index) => (
                    <span key={`${name}-${index}`} title={name}
                        className="grid size-8 place-items-center rounded-full border-2 border-white bg-primary-100 text-xs font-bold text-primary-800">
                        {name.trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join('').toLocaleUpperCase()}
                    </span>
                ))}
                {remaining > 0 && (
                    <span className="grid size-8 place-items-center rounded-full border-2 border-white bg-neutral-100 text-xs font-semibold text-secondary-800">
                        +{remaining}
                    </span>
                )}
            </div>
            <span className="text-xs text-secondary-700">{count} {count === 1 ? 'miembro' : 'miembros'}</span>
        </div>
    )
}
