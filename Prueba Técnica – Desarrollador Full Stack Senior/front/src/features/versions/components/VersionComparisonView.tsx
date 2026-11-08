import { useMemo } from 'react'
import { Icon } from '@iconify/react'
import DocumentEditor from '@/features/documents/components/DocumentEditor'
import type { DocumentHighlights } from '@/features/documents/utils/documentHighlights'
import type { DocumentVersion, VersionComparison } from '@/features/versions/types/version.types'
import { getVersionChanges } from '@/features/versions/utils/versionDiff'
import Card from '@/shared/components/Card'

interface VersionComparisonViewProps {
    current: DocumentVersion
    previous?: DocumentVersion
    comparison: VersionComparison | null
}

export default function VersionComparisonView({ current, previous, comparison }: VersionComparisonViewProps) {
    const highlights = useMemo(() => {
        if (!comparison || !previous) return null
        const changes = getVersionChanges(comparison.unified_diff, previous.content, current.content)
        return {
            current: { kind: 'addition', blocks: changes.added } satisfies DocumentHighlights,
            previous: { kind: 'removal', blocks: changes.removed } satisfies DocumentHighlights,
        }
    }, [comparison, current.content, previous])

    return (
        <div className="@container space-y-3">
            {comparison?.unified_diff === '' && (
                <p role="status" className="rounded-xl bg-white px-4 py-3 text-sm text-secondary-700">
                    Las dos versiones tienen el mismo contenido.
                </p>
            )}
            <Card className={`grid overflow-hidden rounded-2xl border border-neutral-100 bg-white ${previous ? '@lg:grid-cols-2' : ''}`}>
                <section aria-labelledby="current-version-title" className="min-w-0">
                    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 bg-primary-100 px-4 py-3">
                        <h3 id="current-version-title" className="flex items-center gap-2 text-sm font-semibold text-secondary-950">
                            <Icon icon="tabler:circle-check" width="18" className="text-success-text" aria-hidden="true" />
                            Versión actual · {current.version_number}
                        </h3>
                        {highlights && highlights.current.blocks.size > 0 && (
                            <span className="rounded-full bg-success-bg px-2 py-1 text-xs font-semibold text-success-text">
                                +{highlights.current.blocks.size} adiciones
                            </span>
                        )}
                    </header>
                    <DocumentEditor key={current.id} content={current.content} compact highlights={highlights?.current} />
                </section>
                {previous && (
                    <section aria-labelledby="previous-version-title" className="min-w-0 border-t border-neutral-100 @lg:border-t-0 @lg:border-l">
                        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 bg-neutral-50 px-4 py-3">
                            <h3 id="previous-version-title" className="flex items-center gap-2 text-sm font-semibold text-secondary-950">
                                <Icon icon="tabler:history" width="18" className="text-primary-700" aria-hidden="true" />
                                Versión anterior · {previous.version_number}
                            </h3>
                            {highlights && highlights.previous.blocks.size > 0 && (
                                <span className="rounded-full bg-danger-bg px-2 py-1 text-xs font-semibold text-danger-text">
                                    −{highlights.previous.blocks.size} eliminaciones
                                </span>
                            )}
                        </header>
                        <DocumentEditor key={previous.id} content={previous.content} compact highlights={highlights?.previous} />
                    </section>
                )}
            </Card>
        </div>
    )
}
