import { useState } from 'react'
import type { DocumentSnapshot } from '@/features/collaboration/types/collaboration.types'
import DocumentEditor from '@/features/documents/components/DocumentEditor'
import Button from '@/shared/components/Button'

interface CollaborationConflictProps {
    snapshot: DocumentSnapshot
    canApply: boolean
    onApply: () => void
    onDiscard: () => void
}

export default function CollaborationConflict({ snapshot, canApply, onApply, onDiscard }: CollaborationConflictProps) {
    const [showShared, setShowShared] = useState(false)

    return (
        <section aria-labelledby="collaboration-conflict-title" className="space-y-3 rounded-xl border border-warning/25 bg-warning-bg p-4">
            <div role="alert" className="text-sm text-warning-text">
                <h2 id="collaboration-conflict-title" className="font-semibold">Hay cambios de otra persona</h2>
                <p className="mt-1">Tu borrador sigue en el editor. Revisa el borrador compartido antes de aplicar tus cambios o reemplazarlos.</p>
            </div>
            <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" aria-expanded={showShared} onClick={() => setShowShared(!showShared)}>
                    {showShared ? 'Ocultar borrador compartido' : 'Ver borrador compartido'}
                </Button>
                <Button size="sm" variant="outline" onClick={onDiscard}>Usar borrador compartido</Button>
                {canApply && <Button size="sm" onClick={onApply}>Aplicar mi borrador</Button>}
            </div>
            {showShared && (
                <div className="rounded-xl border border-neutral-100 bg-white">
                    <p className="border-b border-neutral-100 px-4 py-2 text-xs font-semibold text-secondary-800">
                        Borrador compartido
                    </p>
                    <DocumentEditor content={snapshot.content} compact />
                </div>
            )}
        </section>
    )
}
