import { Icon } from '@iconify/react'
import Card from '@/shared/components/Card'

const accents = {
    primary: { icon: 'bg-primary-100 text-primary-700', line: 'bg-primary-500' },
    secondary: { icon: 'bg-secondary-100 text-secondary-800', line: 'bg-secondary-500' },
    tertiary: { icon: 'bg-tertiary-100 text-tertiary-800', line: 'bg-tertiary-600' },
}

interface DashboardMetricProps {
    label: string
    value?: number
    description: string
    icon: string
    accent: keyof typeof accents
}

const numberFormat = new Intl.NumberFormat('es-SV')

export default function DashboardMetric({ label, value, description, icon, accent }: DashboardMetricProps) {
    const colors = accents[accent]
    return (
        <Card className="flex min-w-0 flex-col rounded-2xl border border-neutral-100 bg-white p-3.5 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-2">
                <h2 className="min-w-0 pt-1 text-xs font-semibold tracking-wide wrap-anywhere text-secondary-700">{label}</h2>
                <span className={`grid size-8 shrink-0 place-items-center rounded-lg sm:size-10 ${colors.icon}`}>
                    <Icon icon={icon} width="19" aria-hidden="true" />
                </span>
            </div>
            <p className="mt-1 font-heading text-3xl font-bold tracking-tight text-secondary-950 tabular-nums">
                {value === undefined ? '—' : numberFormat.format(value)}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-secondary-700">{description}</p>
            <div aria-hidden="true" className="mt-auto pt-3">
                <div className={`h-1 w-9 rounded-full ${colors.line}`} />
            </div>
        </Card>
    )
}
