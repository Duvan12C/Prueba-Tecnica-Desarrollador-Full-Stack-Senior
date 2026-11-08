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
    primary: 'border border-transparent bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'border border-transparent bg-secondary-950 text-white hover:bg-secondary-900',
    outline: 'border border-neutral-200 bg-white text-secondary-900 hover:border-neutral-300 hover:bg-neutral-50',
    ghost: 'border border-transparent bg-transparent text-secondary-700 hover:bg-neutral-100',
    success: 'border border-transparent bg-tertiary-700 text-white hover:bg-tertiary-800',
    danger: 'border border-transparent bg-danger text-white hover:opacity-90',
    custom: 'border border-transparent bg-transparent text-inherit',
}

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'min-h-9 gap-2 rounded-md px-3 text-sm',
    md: 'min-h-11 gap-2 rounded-lg px-4 text-sm',
    lg: 'min-h-12 gap-2 rounded-xl px-5 text-base',
    icon: 'size-10 rounded-lg p-0',
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
                'inline-flex items-center justify-center whitespace-nowrap font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
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
