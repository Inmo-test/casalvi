import { OCCUPANCY_COLORS, type OccupancyStatus } from './design-tokens'
import { cn } from '@/lib/cn'

interface OccupancyBadgeProps {
    status: OccupancyStatus
    className?: string
    showLabel?: boolean
}

export function OccupancyBadge({ status, className, showLabel = true }: OccupancyBadgeProps) {
    const config = OCCUPANCY_COLORS[status] || OCCUPANCY_COLORS.unknown

    return (
        <div
            className={cn(
                'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border',
                config.bg,
                config.text,
                config.border,
                className
            )}
        >
            <div className={cn('h-2 w-2 rounded-full', config.dot)} />
            {showLabel && <span>{config.label}</span>}
        </div>
    )
}
