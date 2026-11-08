import { useState } from 'react'
import type { AuditDateRange } from '@/features/audit/types/audit.types'
import Button from '@/shared/components/Button'
import Input from '@/shared/components/Input'

export default function AuditDateFilters({ onApply }: { onApply: (dates: AuditDateRange) => void }) {
    const [dates, setDates] = useState<AuditDateRange>({})

    return (
        <form aria-label="Filtrar eventos por fecha" className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
                event.preventDefault()
                onApply(dates)
            }}>
            <label className="grid min-w-0 gap-1.5 text-sm font-medium text-secondary-950">
                Desde
                <Input type="date" value={dates.startDate ?? ''} max={dates.endDate || undefined}
                    onChange={(event) => setDates({ ...dates, startDate: event.target.value })} />
            </label>
            <label className="grid min-w-0 gap-1.5 text-sm font-medium text-secondary-950">
                Hasta
                <Input type="date" value={dates.endDate ?? ''} min={dates.startDate || undefined}
                    onChange={(event) => setDates({ ...dates, endDate: event.target.value })} />
            </label>
            <div className="flex flex-wrap gap-2">
                <Button type="submit">Filtrar</Button>
                <Button variant="outline" onClick={() => {
                    setDates({})
                    onApply({})
                }}>
                    Limpiar
                </Button>
            </div>
        </form>
    )
}
