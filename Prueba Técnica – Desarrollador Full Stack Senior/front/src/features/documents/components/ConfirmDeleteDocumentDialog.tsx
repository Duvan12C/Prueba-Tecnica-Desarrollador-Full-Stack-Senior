import { Icon } from '@iconify/react'
import ConfirmDialog from '@/shared/components/ConfirmDialog'

interface ConfirmDeleteDocumentDialogProps {
    documentTitle: string | null
    hasChanges?: boolean
    onCancel: () => void
    onConfirm: () => void
}

export default function ConfirmDeleteDocumentDialog({ documentTitle, hasChanges, onCancel, onConfirm }: ConfirmDeleteDocumentDialogProps) {
    return (
        <ConfirmDialog
            open={documentTitle !== null}
            title="¿Eliminar documento?"
            description={`«${documentTitle ?? ''}» dejará de estar disponible. Sus versiones se conservarán y la eliminación quedará en la bitácora.${hasChanges ? ' Perderás los cambios sin guardar.' : ''}`}
            confirmLabel="Eliminar documento"
            icon={<Icon icon="tabler:trash" width="22" />}
            destructive
            onCancel={onCancel}
            onConfirm={onConfirm}
        />
    )
}
