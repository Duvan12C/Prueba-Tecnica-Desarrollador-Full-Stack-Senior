const dateFormat = new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium', timeStyle: 'short' })

export function formatInvitationExpiry(value: string) {
    const utcValue = /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`
    return dateFormat.format(new Date(utcValue))
}
