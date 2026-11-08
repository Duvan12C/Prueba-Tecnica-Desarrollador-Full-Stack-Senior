import { useCurrentUserProfile } from '@/features/auth/hooks/useCurrentUserProfile'

export default function CurrentUserSummary() {
  const { profile, error } = useCurrentUserProfile()

  return (
    <div className="min-w-0 max-w-64 border-l border-neutral-200 pl-2 sm:pl-3" role="group" aria-label="Cuenta activa">
      {profile ? (
        <>
          <p className="truncate text-xs font-semibold text-secondary-950 sm:text-sm" title={profile.name}>{profile.name}</p>
          <p className="text-xs text-secondary-700">{profile.role_name}</p>
        </>
      ) : (
        <p role="status" className="truncate text-xs text-secondary-700" title={error ?? undefined}>
          {error ? 'Cuenta' : 'Cargando cuenta…'}
        </p>
      )}
    </div>
  )
}
