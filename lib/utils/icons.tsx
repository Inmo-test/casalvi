/**
 * Icon State Utilities
 * 
 * Provides consistent filled vs outline icon pattern for active/inactive states
 * Following iOS design patterns
 */

import * as LucideIcons from 'lucide-react'
import { LucideProps } from 'lucide-react'

/**
 * Icon pair configuration for active/inactive states
 * 
 * Usage:
 * const iconPair = getIconPair('home')
 * const Icon = isActive ? iconPair.filled : iconPair.outline
 */

export type IconName =
    | 'home'
    | 'users'
    | 'building'
    | 'calendar'
    | 'chart'
    | 'mic'
    | 'search'
    | 'plus'
    | 'bell'
    | 'settings'
    | 'map'
    | 'tools'

interface IconPair {
    filled: React.ComponentType<LucideProps>
    outline: React.ComponentType<LucideProps>
}

/**
 * Maps icon names to filled/outline pairs
 * Lucide doesn't have native filled variants, so we simulate with strokeWidth
 */
export const iconPairs: Record<IconName, IconPair> = {
    home: {
        filled: LucideIcons.Home,
        outline: LucideIcons.Home,
    },
    users: {
        filled: LucideIcons.Users,
        outline: LucideIcons.Users,
    },
    building: {
        filled: LucideIcons.Building2,
        outline: LucideIcons.Building2,
    },
    calendar: {
        filled: LucideIcons.Calendar,
        outline: LucideIcons.Calendar,
    },
    chart: {
        filled: LucideIcons.BarChart3,
        outline: LucideIcons.BarChart3,
    },
    mic: {
        filled: LucideIcons.Mic,
        outline: LucideIcons.Mic,
    },
    search: {
        filled: LucideIcons.Search,
        outline: LucideIcons.Search,
    },
    plus: {
        filled: LucideIcons.PlusCircle,
        outline: LucideIcons.Plus,
    },
    bell: {
        filled: LucideIcons.Bell,
        outline: LucideIcons.Bell,
    },
    settings: {
        filled: LucideIcons.Settings,
        outline: LucideIcons.Settings,
    },
    tools: {
        filled: LucideIcons.Wrench,
        outline: LucideIcons.Wrench,
    },
    map: {
        filled: LucideIcons.Map,
        outline: LucideIcons.Map,
    },
}

/**
 * Get icon pair for active/inactive states
 */
export function getIconPair(name: IconName): IconPair {
    return iconPairs[name]
}

/**
 * Icon component with automatic state handling
 * 
 * @example
 * <StateIcon name="home" active={isActive} className="h-6 w-6" />
 */
interface StateIconProps extends Omit<LucideProps, 'ref'> {
    name: IconName
    active?: boolean
}

export function StateIcon({ name, active = false, className = '', ...props }: StateIconProps) {
    const pair = getIconPair(name)
    const Icon = active ? pair.filled : pair.outline

    // Active icons: thicker stroke or fill effect
    const activeClasses = active
        ? 'stroke-[2.5] text-primary'
        : 'stroke-[2] text-muted-foreground'

    return <Icon className={`${activeClasses} ${className}`} {...props} />
}

/**
 * Re-export all Lucide icons for convenience
 */
export * from 'lucide-react'
