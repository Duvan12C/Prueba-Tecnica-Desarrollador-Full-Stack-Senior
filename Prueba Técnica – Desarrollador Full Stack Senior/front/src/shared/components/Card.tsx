import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps, type MotionStyle } from 'motion/react'

export type CardProps = Omit<HTMLMotionProps<'div'>, 'children'> &
    Pick<MotionStyle, 'width' | 'height' | 'maxWidth' | 'padding' | 'background' | 'borderRadius' | 'boxShadow'> & {
        children: ReactNode
    }

function Card({
    children,
    width,
    height,
    maxWidth,
    padding,
    background,
    borderRadius,
    boxShadow,
    style,
    ...motionProps
}: CardProps) {
    return (
        <motion.div
            {...motionProps}
            style={{ width, height, maxWidth, padding, background, borderRadius, boxShadow, ...style }}
        >
            {children}
        </motion.div>
    )
}

export default Card
