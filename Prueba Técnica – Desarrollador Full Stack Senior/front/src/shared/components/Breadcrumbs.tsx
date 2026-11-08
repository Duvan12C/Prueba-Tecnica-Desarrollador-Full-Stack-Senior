import { Link } from 'react-router'

interface BreadcrumbItem {
    label: string
    to?: string
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[]
    linksDisabled?: boolean
    onNavigate?: (path: string) => void
}

export default function Breadcrumbs({ items, linksDisabled = false, onNavigate }: BreadcrumbsProps) {
    return (
        <nav aria-label="Ruta de navegación">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs font-medium text-secondary-700">
                {items.map(({ label, to }, index) => {
                    const current = index === items.length - 1
                    return (
                        <li key={index} className="flex min-w-0 max-w-full items-center gap-2">
                            {index > 0 && <span aria-hidden="true" className="shrink-0 text-secondary-500">/</span>}
                            {current ? (
                                <span aria-current="page" className="rounded-full bg-primary-100 px-2.5 py-1 text-sm font-bold wrap-anywhere text-primary-700">
                                    {label}
                                </span>
                            ) : to && !linksDisabled ? (
                                <Link to={to}
                                    className="rounded-sm wrap-anywhere text-primary-700 hover:underline focus-visible:outline-2 focus-visible:outline-primary-500"
                                    onClick={(event) => {
                                        if (!onNavigate || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                                        event.preventDefault()
                                        onNavigate(to)
                                    }}>
                                    {label}
                                </Link>
                            ) : <span className="wrap-anywhere">{label}</span>}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}
