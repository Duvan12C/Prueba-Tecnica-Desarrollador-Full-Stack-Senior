import { Icon } from '@iconify/react'
import { useParams } from 'react-router'
import { useWorkspaceMembers } from '@/features/workspaces/hooks/useWorkspaceMembers'
import Breadcrumbs from '@/shared/components/Breadcrumbs'
import Card from '@/shared/components/Card'

function WorkspaceMembers({ workspaceId }: { workspaceId: number }) {
    const { result, error } = useWorkspaceMembers(workspaceId)

    return (
        <section aria-labelledby="members-title" className="mx-auto max-w-5xl space-y-5">
            <Breadcrumbs items={[
                { label: 'Espacios de trabajo', to: '/workspaces' },
                ...(result ? [{ label: result.workspace.name, to: `/workspaces/${workspaceId}` }] : []),
                { label: 'Miembros' },
            ]} />
            <header>
                <h1 id="members-title" className="font-heading text-3xl font-bold tracking-tight text-secondary-950 md:text-4xl">
                    Miembros del espacio
                </h1>
                <p className="mt-2 text-sm text-secondary-700">Personas que forman parte de este espacio de trabajo.</p>
            </header>
            {error && <p role="alert" className="rounded-xl bg-danger-bg p-4 text-sm text-danger-text">{error}</p>}
            {!result && !error && <p role="status" className="text-sm text-secondary-700">Cargando miembros…</p>}
            {result && (
                <Card className="rounded-2xl border border-neutral-100 bg-white p-2">
                    {result.members.length === 0 && <p className="p-3 text-sm text-secondary-700">Aún no hay miembros activos.</p>}
                    <ul className="divide-y divide-neutral-100">
                        {result.members.map((member) => (
                            <li key={member.user_id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-100 text-primary-700">
                                        <Icon icon="tabler:user" width="19" aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0 wrap-anywhere">
                                        <p className="text-sm font-semibold text-secondary-950">{member.name}</p>
                                        <p className="text-xs text-secondary-700">{member.email}</p>
                                    </div>
                                </div>
                                <span className="rounded-full bg-neutral-50 px-2.5 py-1 text-xs font-medium text-secondary-800">
                                    {member.user_id === result.workspace.owner_user_id ? 'Propietario' : member.role_name}
                                </span>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}
        </section>
    )
}

export default function WorkspaceMembersPage() {
    const workspaceId = Number(useParams().workspaceId)
    if (!Number.isSafeInteger(workspaceId) || workspaceId <= 0) {
        return <p role="alert" className="text-sm text-danger-text">El espacio indicado no es válido.</p>
    }
    return <WorkspaceMembers key={workspaceId} workspaceId={workspaceId} />
}
