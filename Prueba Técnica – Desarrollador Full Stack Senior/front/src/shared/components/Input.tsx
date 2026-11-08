import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'

export type InputSize = 'sm' | 'md' | 'lg'
export type InputShape = 'square' | 'rounded' | 'pill'

export type InputProps = Omit<HTMLMotionProps<'input'>, 'children' | 'size'> & {
    size?: InputSize
    shape?: InputShape
    startIcon?: ReactNode
    endAdornment?: ReactNode
    containerClassName?: string
}

const sizeClasses: Record<InputSize, string> = {
    sm: 'h-9 text-sm',
    md: 'h-11 text-sm',
    lg: 'h-14 text-sm',
}

const shapeClasses: Record<InputShape, string> = {
    square: 'rounded-none',
    rounded: 'rounded-xl',
    pill: 'rounded-full',
}

function Input({
    size = 'md',
    shape = 'rounded',
    startIcon,
    endAdornment,
    containerClassName = '',
    className = '',
    ...inputProps
}: InputProps) {
    return (
        <div className={`relative ${containerClassName}`}>
            {startIcon && (
                <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 z-10 flex -translate-y-1/2 text-secondary-500">
                    {startIcon}
                </span>
            )}
            <motion.input
                {...inputProps}
                className={[
                    'w-full border border-neutral-200 bg-white text-secondary-950 outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger',
                    sizeClasses[size],
                    shapeClasses[shape],
                    startIcon ? 'pl-12' : 'pl-4',
                    endAdornment ? 'pr-12' : 'pr-4',
                    className,
                ].filter(Boolean).join(' ')}
            />
            {endAdornment && (
                <div className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2">
                    {endAdornment}
                </div>
            )}
        </div>
    )
}

export default Input
