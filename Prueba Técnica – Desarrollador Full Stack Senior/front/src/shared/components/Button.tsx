import type { CSSProperties, ReactNode } from 'react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'

export type ButtonVariant =
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'success'
    | 'danger'
    | 'custom'

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export type ButtonProps = Omit<
    HTMLMotionProps<'button'>,
    'children' | 'size' | 'style' | 'color' | 'whileHover' | 'whileTap'
> & {
    children?: ReactNode
    variant?: ButtonVariant
    size?: ButtonSize
    startIcon?: ReactNode
    endIcon?: ReactNode
    loading?: boolean
    loadingText?: ReactNode
    fullWidth?: boolean
    motionEnabled?: boolean
    hoverScale?: number
    tapScale?: number
    backgroundColor?: CSSProperties['backgroundColor']
    textColor?: CSSProperties['color']
    borderColor?: CSSProperties['borderColor']
    borderWidth?: CSSProperties['borderWidth']
    borderRadius?: CSSProperties['borderRadius']
    style?: CSSProperties
    whileHover?: HTMLMotionProps<'button'>['whileHover']
    whileTap?: HTMLMotionProps<'button'>['whileTap']
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'border-primary-700/25 bg-primary-600 text-white shadow-xs hover:bg-primary-700 active:bg-primary-800',
    secondary: 'border-secondary-200 bg-secondary-100 text-secondary-900 hover:bg-secondary-200',
    outline: 'border-neutral-200 bg-white text-secondary-800 shadow-xs hover:border-primary-300 hover:bg-neutral-50',
    ghost: 'border-transparent bg-transparent text-secondary-700 hover:bg-neutral-100',
    success: 'border-success/30 bg-success-bg text-success-text hover:bg-success/15',
    danger: 'border-danger/25 bg-danger-bg text-danger-text hover:border-danger/40 hover:bg-danger/15',
    custom: 'border-transparent bg-transparent text-inherit',
}

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'min-h-10 px-2.5 py-1.5 text-xs sm:min-h-8',
    md: 'min-h-11 px-3 py-1.5 text-sm sm:min-h-9',
    lg: 'min-h-11 px-4 py-2 text-sm sm:min-h-10',
    icon: 'size-11 shrink-0 p-0 sm:size-9',
}

function Button({
    children,
    variant = 'primary',
    size = 'md',
    startIcon,
    endIcon,
    loading = false,
    loadingText,
    fullWidth = false,
    motionEnabled = true,
    hoverScale = 1.02,
    tapScale = 0.98,
    backgroundColor,
    textColor,
    borderColor,
    borderWidth,
    borderRadius,
    className = '',
    style,
    type = 'button',
    disabled = false,
    whileHover,
    whileTap,
    transition,
    ...buttonProps
}: ButtonProps) {
    const prefersReducedMotion = useReducedMotion()
    const isDisabled = disabled || loading
    const shouldAnimate = motionEnabled && !prefersReducedMotion && !isDisabled
    const customStyle: CSSProperties = {
        ...(backgroundColor !== undefined && { backgroundColor }),
        ...(textColor !== undefined && { color: textColor }),
        ...(borderColor !== undefined && { borderColor }),
        ...(borderWidth !== undefined && { borderWidth }),
        ...(borderRadius !== undefined && { borderRadius }),
        ...style,
    }

    return (
        <motion.button
            {...buttonProps}
            type={type}
            disabled={isDisabled}
            className={[
                'inline-flex max-w-full items-center justify-center gap-1.5 rounded-md border text-center font-semibold wrap-anywhere outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 motion-reduce:transition-none',
                sizeClasses[size],
                variantClasses[variant],
                fullWidth && 'w-full',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
            style={customStyle}
            whileHover={shouldAnimate ? whileHover ?? { scale: hoverScale } : undefined}
            whileTap={shouldAnimate ? whileTap ?? { scale: tapScale } : undefined}
            transition={transition ?? { type: 'spring', stiffness: 420, damping: 28 }}
        >
            {loading ? (
                <span
                    aria-hidden="true"
                    className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                />
            ) : (
                startIcon && <span aria-hidden="true" className="inline-flex shrink-0">{startIcon}</span>
            )}
            {loading && loadingText ? loadingText : children}
            {!loading && endIcon && <span aria-hidden="true" className="inline-flex shrink-0">{endIcon}</span>}
        </motion.button>
    )
}

export default Button
