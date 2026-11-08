import { useEffect, useState } from 'react'
import { getCurrentUserProfile } from '@/features/auth/api/auth.api'
import type { CurrentUserProfile } from '@/features/auth/types/auth.types'
import { getProtectedApiErrorMessage } from '@/shared/api/getProtectedApiErrorMessage'

export function useCurrentUserProfile() {
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    getCurrentUserProfile(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setProfile(result)
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setError(getProtectedApiErrorMessage(error, 'No se pudo cargar el perfil.'))
        }
      })
    return () => controller.abort()
  }, [])

  return { profile, error }
}
