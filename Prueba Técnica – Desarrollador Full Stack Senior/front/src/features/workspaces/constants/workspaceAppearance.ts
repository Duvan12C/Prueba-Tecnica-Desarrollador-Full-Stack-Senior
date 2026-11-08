export const workspaceIcons = {
    folder: { label: 'Carpeta', icon: 'solar:folder-with-files-linear' },
    team: { label: 'Equipo', icon: 'tabler:users' },
    briefcase: { label: 'Portafolio', icon: 'tabler:briefcase' },
    document: { label: 'Documento', icon: 'solar:document-text-linear' },
    rocket: { label: 'Proyecto', icon: 'tabler:rocket' },
} as const

export const workspaceColors = {
    blue: { label: 'Azul', solid: 'bg-primary-600', soft: 'bg-primary-100', text: 'text-primary-700' },
    green: { label: 'Verde', solid: 'bg-tertiary-700', soft: 'bg-success-bg', text: 'text-tertiary-700' },
    amber: { label: 'Ámbar', solid: 'bg-warning-text', soft: 'bg-warning-bg', text: 'text-warning-text' },
    slate: { label: 'Pizarra', solid: 'bg-secondary-800', soft: 'bg-neutral-50', text: 'text-secondary-800' },
} as const
