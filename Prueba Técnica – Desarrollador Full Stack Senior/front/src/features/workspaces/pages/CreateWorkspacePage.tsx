import { useState, type FormEvent } from 'react'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router'
import WorkspaceAppearancePicker from '@/features/workspaces/components/WorkspaceAppearancePicker'
import WorkspacePreview from '@/features/workspaces/components/WorkspacePreview'
import { useCreateWorkspace } from '@/features/workspaces/hooks/useCreateWorkspace'
import { useWorkspaceCapabilities } from '@/features/workspaces/hooks/useWorkspaceCapabilities'
import type { WorkspaceAppearance } from '@/features/workspaces/types/workspace.types'
import Breadcrumbs from '@/shared/components/Breadcrumbs'
import Button from '@/shared/components/Button'
import Card from '@/shared/components/Card'
import Input from '@/shared/components/Input'

const MAX_NAME_LENGTH = 150

export default function CreateWorkspacePage() {
    const navigate = useNavigate()
    const { canCreateWorkspace, isLoading, error: permissionError } = useWorkspaceCapabilities()
    const { submit, isSaving, error: saveError } = useCreateWorkspace()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [appearance, setAppearance] = useState<WorkspaceAppearance>({ icon_key: 'folder', color_key: 'blue' })
    const trimmedName = name.trim()
    const trimmedDescription = description.trim()

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (isSaving || !canCreateWorkspace || !trimmedName || trimmedName.length > MAX_NAME_LENGTH) return

        const workspace = await submit({ name: trimmedName, description: trimmedDescription || null, ...appearance })
        if (workspace) navigate(`/workspaces/${workspace.id}?invitar=nuevo`, { replace: true })
    }

    return (
        <section aria-labelledby="create-workspace-title" className="mx-auto max-w-6xl space-y-5">
            <Breadcrumbs items={[{ label: 'Espacios de trabajo', to: '/workspaces' }, { label: 'Nuevo espacio' }]} linksDisabled={isSaving} />
            <Card className="rounded-2xl border border-neutral-100 bg-white p-5 sm:p-7">
                <h1 id="create-workspace-title" className="font-heading text-2xl font-bold text-secondary-950 sm:text-3xl">
                    Crear nuevo espacio de trabajo
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary-700">
                    Define un espacio para organizar los documentos de tu equipo en DocSpace.
                </p>
            </Card>

            {isLoading && <p role="status" className="text-sm text-secondary-700">Comprobando tus permisos…</p>}
            {permissionError && (
                <p role="alert" className="rounded-xl bg-danger-bg p-4 text-sm text-danger-text">{permissionError}</p>
            )}
            {!isLoading && !permissionError && !canCreateWorkspace && (
                <p role="alert" className="rounded-xl bg-warning-bg p-4 text-sm text-warning-text">
                    Solo un Gestor puede crear espacios de trabajo.
                </p>
            )}

            {canCreateWorkspace && (
                <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.55fr)]">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Card className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm sm:p-7">
                            <div className="mb-5 flex items-start gap-3 border-b border-neutral-100 pb-5">
                                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-600 text-white">
                                    <Icon icon="solar:folder-add-linear" width="21" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 className="font-heading font-semibold text-secondary-950">Información del espacio</h2>
                                    <p className="mt-1 text-sm text-secondary-700">Dale un nombre y explica para qué se usará.</p>
                                </div>
                            </div>
                            <div className="space-y-5">
                                <WorkspaceAppearancePicker appearance={appearance} onChange={setAppearance} disabled={isSaving} />
                                <div>
                                    <label htmlFor="workspace-name" className="mb-2 block text-sm font-semibold text-secondary-950">
                                        Nombre del espacio <span className="text-danger" aria-hidden="true">*</span>
                                    </label>
                                    <Input id="workspace-name" required maxLength={MAX_NAME_LENGTH} disabled={isSaving}
                                        aria-describedby="workspace-name-length" placeholder="Ej. Equipo de Producto"
                                        value={name} onChange={(event) => setName(event.target.value)}
                                        startIcon={<Icon icon="solar:folder-linear" width="19" />} />
                                    <p id="workspace-name-length" className="mt-2 text-right text-xs text-secondary-700">
                                        {name.length} / {MAX_NAME_LENGTH} caracteres
                                    </p>
                                </div>
                                <div>
                                    <label htmlFor="workspace-description" className="mb-2 block text-sm font-semibold text-secondary-950">
                                        Descripción <span className="font-normal text-secondary-600">(opcional)</span>
                                    </label>
                                    <textarea id="workspace-description" rows={5} disabled={isSaving}
                                        placeholder="Describe qué documentos o proyectos se organizarán aquí."
                                        value={description} onChange={(event) => setDescription(event.target.value)}
                                        className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-secondary-950 outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10 disabled:opacity-60" />
                                </div>
                            </div>
                        </Card>
                        {saveError && <p role="alert" className="rounded-xl bg-danger-bg p-4 text-sm text-danger-text">{saveError}</p>}
                        <div className="flex flex-wrap justify-end gap-3">
                            <Button variant="outline" disabled={isSaving} onClick={() => navigate('/workspaces')}>Cancelar</Button>
                            <Button type="submit" disabled={!trimmedName} loading={isSaving} loadingText="Creando espacio…"
                                endIcon={<Icon icon="solar:arrow-right-linear" width="18" />}>
                                Crear espacio de trabajo
                            </Button>
                        </div>
                    </form>
                    <WorkspacePreview name={trimmedName} description={trimmedDescription} appearance={appearance} />
                </div>
            )}
            {!canCreateWorkspace && !isLoading && (
                <Button variant="outline" onClick={() => navigate('/workspaces')}>Volver a espacios de trabajo</Button>
            )}
        </section>
    )
}
