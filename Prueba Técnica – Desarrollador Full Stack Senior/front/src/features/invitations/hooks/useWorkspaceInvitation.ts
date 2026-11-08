import { useEffect, useState } from 'react'
import { searchInvitationCandidates, sendInvitations } from '@/features/invitations/api/invitations.api'
import type { InvitationCandidate } from '@/features/invitations/types/invitation.types'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'

export const MAX_INVITEES = 20

interface CandidateSearch {
    query: string
    candidates: InvitationCandidate[]
    error: string | null
}

export function useWorkspaceInvitation(workspaceId: number) {
    const [search, setSearch] = useState('')
    const [lookup, setLookup] = useState<CandidateSearch | null>(null)
    const [selected, setSelected] = useState<InvitationCandidate[]>([])
    const [sentCount, setSentCount] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isSending, setIsSending] = useState(false)
    const query = search.trim()
    const currentLookup = lookup?.query === query ? lookup : null

    useEffect(() => {
        if (query.length < 2) return

        const controller = new AbortController()
        const timer = window.setTimeout(() => {
            searchInvitationCandidates(workspaceId, query, controller.signal)
                .then((candidates) => {
                    if (!controller.signal.aborted) setLookup({ query, candidates, error: null })
                })
                .catch((error: unknown) => {
                    if (!controller.signal.aborted) {
                        setLookup({
                            query,
                            candidates: [],
                            error: getProtectedApiErrorMessage(error, 'No se pudieron buscar las cuentas.'),
                        })
                    }
                })
        }, 250)

        return () => {
            window.clearTimeout(timer)
            controller.abort()
        }
    }, [query, workspaceId])

    function updateSearch(value: string) {
        if (value.trim() !== query) setLookup(null)
        setSearch(value)
    }

    function select(candidate: InvitationCandidate) {
        setSelected((current) => current.length >= MAX_INVITEES || current.some(({ id }) => id === candidate.id)
            ? current
            : [...current, candidate])
        setSentCount(null)
        setError(null)
    }

    function remove(id: number) {
        setSelected((current) => current.filter((candidate) => candidate.id !== id))
        setError(null)
    }

    async function invite() {
        if (!selected.length || isSending) return false
        setIsSending(true)
        setSentCount(null)
        setError(null)
        try {
            const count = await sendInvitations(workspaceId, selected.map(({ id }) => id))
            setSelected([])
            updateSearch('')
            setSentCount(count)
            return true
        } catch (error) {
            setError(getProtectedApiErrorMessage(error, 'No se pudieron enviar las invitaciones.'))
            return false
        } finally {
            setIsSending(false)
        }
    }

    return {
        search, updateSearch, selected, select, remove, invite, isSending, sentCount, error,
        candidates: currentLookup?.candidates.filter((candidate) => !selected.some(({ id }) => id === candidate.id)) ?? [],
        searchError: currentLookup?.error ?? null,
        isSearching: query.length >= 2 && !currentLookup,
    }
}
