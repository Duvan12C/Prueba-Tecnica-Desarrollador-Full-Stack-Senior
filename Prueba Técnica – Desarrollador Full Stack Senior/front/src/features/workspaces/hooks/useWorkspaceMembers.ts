import { useEffect, useState } from 'react'
import { listWorkspaceMembers, listWorkspaces, removeWorkspaceMember } from '@/features/workspaces/api/workspaces.api'
import type { Workspace, WorkspaceMember } from '@/features/workspaces/types/workspace.types'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'

export function useWorkspaceMembers(workspaceId: number) {
    const [result, setResult] = useState<{ workspace: Workspace; members: WorkspaceMember[] } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [removingId, setRemovingId] = useState<number | null>(null)
    const [removeError, setRemoveError] = useState<string | null>(null)
    const [removeStatus, setRemoveStatus] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        const { signal } = controller
        Promise.all([listWorkspaces(signal), listWorkspaceMembers(workspaceId, signal)])
            .then(([workspaces, members]) => {
                const workspace = workspaces.find(({ id }) => id === workspaceId)
                if (!workspace) throw new Error('Este espacio de trabajo no está disponible.')
                if (!signal.aborted) setResult({ workspace, members })
            })
            .catch((error: unknown) => {
                if (!signal.aborted) setError(getProtectedApiErrorMessage(error, 'No se pudieron consultar los miembros del espacio.'))
            })
        return () => controller.abort()
    }, [workspaceId])

    async function remove(member: WorkspaceMember) {
        if (removingId !== null) return
        setRemovingId(member.user_id)
        setRemoveError(null)
        setRemoveStatus(null)
        try {
            await removeWorkspaceMember(workspaceId, member.user_id)
            setResult((current) => current && {
                ...current,
                members: current.members.filter(({ user_id }) => user_id !== member.user_id),
            })
            setRemoveStatus(`${member.name} ya no es miembro de este espacio.`)
        } catch (error) {
            setRemoveError(getProtectedApiErrorMessage(error, 'No se pudo retirar al miembro del espacio.'))
        } finally {
            setRemovingId(null)
        }
    }

    return { result, error, remove, removingId, removeError, removeStatus }
}
