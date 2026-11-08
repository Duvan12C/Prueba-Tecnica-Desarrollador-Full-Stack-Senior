import { useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react'
import Button from './Button'

interface ConfirmDialogProps {
    open: boolean
    title: string
    description: string
    confirmLabel: string
    cancelLabel?: string
    icon: ReactNode
    destructive?: boolean
    onCancel: () => void
    onConfirm: () => void
}

function DialogContent({ title, description, confirmLabel, cancelLabel = 'Cancelar', icon, destructive, onCancel, onConfirm }: Omit<ConfirmDialogProps, 'open'>) {
    const dialog = useRef<HTMLDialogElement>(null)
    const cancelButton = useRef<HTMLButtonElement>(null)
    const titleId = useId()
    const descriptionId = useId()
    const reducedMotion = useReducedMotion()
    const isPresent = useIsPresent()

    useLayoutEffect(() => {
        const element = dialog.current
        element?.showModal()
        cancelButton.current?.focus()
        return () => element?.close()
    }, [])

    return (
        <motion.dialog
            ref={dialog}
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            onCancel={(event) => {
                event.preventDefault()
                if (isPresent) onCancel()
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.16 }}
            className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-auto bg-secondary-950/55 p-0 backdrop:bg-transparent"
        >
            <div
                className="grid min-h-full place-items-center p-4"
                onClick={(event) => {
                    if (isPresent && event.target === event.currentTarget) onCancel()
                }}
            >
                <motion.div
                    initial={{ scale: reducedMotion ? 1 : 0.96, y: reducedMotion ? 0 : 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: reducedMotion ? 1 : 0.98 }}
                    transition={{ duration: reducedMotion ? 0 : 0.2, ease: 'easeOut' }}
                    className="w-full max-w-md rounded-2xl border border-neutral-100 bg-white p-6 shadow-2xl"
                >
                    <span aria-hidden="true" className={`mb-4 grid size-11 place-items-center rounded-xl ${destructive ? 'bg-danger-bg text-danger-text' : 'bg-primary-100 text-primary-700'}`}>
                        {icon}
                    </span>
                    <h2 id={titleId} className="font-heading text-xl font-bold text-secondary-950">{title}</h2>
                    <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-secondary-700">{description}</p>
                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                        <Button ref={cancelButton} variant="outline" disabled={!isPresent} onClick={onCancel}>{cancelLabel}</Button>
                        <Button variant={destructive ? 'danger' : 'primary'} disabled={!isPresent} onClick={onConfirm}>{confirmLabel}</Button>
                    </div>
                </motion.div>
            </div>
        </motion.dialog>
    )
}

export default function ConfirmDialog({ open, ...props }: ConfirmDialogProps) {
    return <AnimatePresence>{open && <DialogContent {...props} />}</AnimatePresence>
}
