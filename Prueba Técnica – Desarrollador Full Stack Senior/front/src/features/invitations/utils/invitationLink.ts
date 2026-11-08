function isInvitationToken(value: unknown): value is string {
    return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value)
}

export function readInvitationToken(hash: string): string | null {
    const token = new URLSearchParams(hash.slice(1)).get('token')
    return isInvitationToken(token) ? token : null
}

export function getInvitationPath(token: string): string {
    return `/invitations/accept#token=${encodeURIComponent(token)}`
}

export function getInvitationReturnPath(state: unknown): string | null {
    if (!state || typeof state !== 'object' || !('invitationToken' in state)) return null
    return isInvitationToken(state.invitationToken) ? getInvitationPath(state.invitationToken) : null
}
