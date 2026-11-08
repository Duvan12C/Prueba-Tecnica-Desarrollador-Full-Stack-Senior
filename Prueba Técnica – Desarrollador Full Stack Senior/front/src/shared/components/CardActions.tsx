import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Icon } from '@iconify/react'
import Button from '@/shared/components/Button'

interface CardActionsProps {
    label: string
    className: string
    disabled?: boolean
    children: ReactNode
}

export default function CardActions({ label, className, disabled, children }: CardActionsProps) {
    const [open, setOpen] = useState(false)
    const container = useRef<HTMLDivElement>(null)
    const trigger = useRef<HTMLButtonElement>(null)
    const actionsId = useId()

    useEffect(() => {
        if (!open) return
        function closeOutside(event: PointerEvent) {
            if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false)
        }
        window.addEventListener('pointerdown', closeOutside)
        return () => window.removeEventListener('pointerdown', closeOutside)
    }, [open])

    function close() {
        setOpen(false)
        trigger.current?.focus()
    }

    return (
        <div ref={container} className={`${className} ${open ? 'z-20' : 'z-10'}`}
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
            }}
            onKeyDown={(event) => {
                if (open && event.key === 'Escape') {
                    event.preventDefault()
                    close()
                }
            }}>
            <Button ref={trigger} size="icon" variant="ghost" aria-label={label} disabled={disabled}
                aria-expanded={open} aria-controls={open ? actionsId : undefined} onClick={() => setOpen(!open)}>
                <Icon icon="tabler:dots-vertical" width="20" aria-hidden="true" />
            </Button>
            {open && (
                <div id={actionsId} className="absolute right-0 top-full mt-1 w-48 space-y-0.5 rounded-xl border border-neutral-100 bg-white p-1 shadow-lg"
                    onClick={(event) => {
                        if (event.target instanceof Element && event.target.closest('a, button')) close()
                    }}>
                    {children}
                </div>
            )}
        </div>
    )
}
