import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { compareVersions, listVersions, restoreVersion } from '@/features/versions/api/versions.api'
import type { DocumentVersion, VersionComparison } from '@/features/versions/types/version.types'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'

export function useVersionHistory(documentId: number) {
    const [versions, setVersions] = useState<DocumentVersion[] | null>(null)
    const [comparison, setComparison] = useState<VersionComparison | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [actionError, setActionError] = useState<string | null>(null)
    const [pending, setPending] = useState<'compare' | 'restore' | null>(null)
    const [restoreForbidden, setRestoreForbidden] = useState(false)

    useEffect(() => {
        const controller = new AbortController()
        listVersions(documentId, controller.signal)
            .then((result) => {
                if (!controller.signal.aborted) setVersions(result)
            })
            .catch((error: unknown) => {
                if (!controller.signal.aborted) {
                    setLoadError(getProtectedApiErrorMessage(error, 'No se pudo cargar el historial.'))
                }
            })
        return () => controller.abort()
    }, [documentId])

    function clearComparison() {
        setComparison(null)
        setActionError(null)
    }

    async function compare(from: number, to: number) {
        setPending('compare')
        clearComparison()
        try {
            setComparison(await compareVersions(documentId, from, to))
        } catch (error) {
            setActionError(getProtectedApiErrorMessage(error, 'No se pudieron comparar las versiones.'))
        } finally {
            setPending(null)
        }
    }

    async function restore(versionNumber: number) {
        setPending('restore')
        setActionError(null)
        try {
            const version = await restoreVersion(documentId, versionNumber)
            setVersions((current) => [version, ...(current ?? [])])
            setComparison(null)
            return version
        } catch (error) {
            if (isAxiosError(error) && error.response?.status === 403) setRestoreForbidden(true)
            setActionError(getProtectedApiErrorMessage(error, 'No se pudo restaurar la versión.'))
            return null
        } finally {
            setPending(null)
        }
    }

    return { versions, comparison, loadError, actionError, pending, restoreForbidden, clearComparison, compare, restore }
}
