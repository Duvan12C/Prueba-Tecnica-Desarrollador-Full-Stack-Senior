import { useId, type ReactNode } from 'react'
import { Icon } from '@iconify/react'
import { Link } from 'react-router'
import Card from '@/shared/components/Card'

interface DashboardPanelProps {
    title: string
    to: string
    action: string
    children: ReactNode
}

export default function DashboardPanel({ title, to, action, children }: DashboardPanelProps) {
    const titleId = useId()
    return (
        <section aria-labelledby={titleId} className="min-w-0">
            <Card className="space-y-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 id={titleId} className="flex items-center gap-2 font-heading text-lg font-semibold text-secondary-950">
                        <span className="h-4 w-1 shrink-0 rounded-full bg-primary-600" aria-hidden="true" />
                        {title}
                    </h2>
                    <Link to={to} className="inline-flex items-center gap-1 rounded text-xs font-semibold text-primary-700 hover:underline focus-visible:outline-2 focus-visible:outline-primary-500">
                        {action}<Icon icon="tabler:arrow-right" width="15" aria-hidden="true" />
                    </Link>
                </div>
                {children}
            </Card>
        </section>
    )
}
