import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { CreateDocumentRequest } from '@/features/documents/types/document.types'
import type { Workspace } from '@/features/workspaces/types/workspace.types'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'
import Button from '@/shared/components/Button'
import Input from '@/shared/components/Input'

interface CreateDocumentDialogProps {
    spaces: Workspace[]
    initialSpaceId: string
    onCreate: (request: CreateDocumentRequest) => Promise<void>
    onDismiss: () => void
}

export default function CreateDocumentDialog({ spaces, initialSpaceId, onCreate, onDismiss }: CreateDocumentDialogProps) {
    const dialog = useRef<HTMLDialogElement>(null)
    const [title, setTitle] = useState('')
    const [spaceId, setSpaceId] = useState(() => (
        spaces.find(({ id }) => String(id) === initialSpaceId) ?? spaces[0]
    ).id)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const element = dialog.current
        element?.showModal()
        return () => element?.close()
    }, [])

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const trimmedTitle = title.trim()
        if (isSaving || !trimmedTitle) return

        setIsSaving(true)
        setError('')
        try {
            await onCreate({ title: trimmedTitle, space_work_id: spaceId })
            onDismiss()
        } catch (error) {
            setError(getProtectedApiErrorMessage(error, 'No se pudo crear el documento.'))
            setIsSaving(false)
        }
    }

    return (
        <dialog
            ref={dialog}
            aria-labelledby="create-document-title"
            onCancel={(event) => {
                event.preventDefault()
                if (!isSaving) onDismiss()
            }}
            className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-neutral-100 bg-white p-6 shadow-xl backdrop:bg-secondary-950/50"
        >
            <h2 id="create-document-title" className="font-heading text-xl font-bold text-secondary-950">Nuevo documento</h2>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                    <label htmlFor="new-document-title" className="mb-1 block text-sm font-medium">Título</label>
                    <Input id="new-document-title" autoFocus required maxLength={255} disabled={isSaving}
                        placeholder="Escribe un título" value={title} onChange={(event) => setTitle(event.target.value)} />
                </div>
                <div>
                    <label htmlFor="new-document-space" className="mb-1 block text-sm font-medium">Espacio de trabajo</label>
                    <select id="new-document-space" value={spaceId} disabled={isSaving}
                        onChange={(event) => setSpaceId(Number(event.target.value))}
                        className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm">
                        {spaces.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
                    </select>
                </div>
                {error && <p role="alert" className="rounded-lg bg-danger-bg p-3 text-sm text-danger-text">{error}</p>}
                <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="ghost" onClick={onDismiss} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" disabled={!title.trim()} loading={isSaving} loadingText="Creando…">
                        Crear documento
                    </Button>
                </div>
            </form>
        </dialog>
    )
}
