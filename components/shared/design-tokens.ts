// Design tokens for unified UI consistency across calendar/activity components

export const SPACING = {
    eventCard: 'p-3 rounded-xl',
    eventCardHover: 'hover:bg-muted transition-colors cursor-pointer',
    timeline: 'pl-4 border-l-2 border-primary/20',
    timelineDot: 'absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border-2 border-background',
    badge: 'px-2 py-1 text-xs rounded-md font-medium',
    container: 'space-y-4',
    containerTight: 'space-y-2',
    sectionGap: 'space-y-6'
} as const

export const TYPOGRAPHY = {
    eventTitle: 'font-medium text-sm text-foreground mb-1',
    eventTime: 'text-xs text-muted-foreground font-medium',
    eventType: 'text-xs font-bold uppercase tracking-wider',
    eventDescription: 'text-xs text-muted-foreground line-clamp-1',
    sectionTitle: 'text-lg font-medium',
    cardTitle: 'font-medium tracking-tight text-lg'
} as const

export const ANIMATIONS = {
    hover: 'hover:bg-muted transition-colors cursor-pointer',
    hoverScale: 'hover:scale-[1.02] transition-transform',
    loading: 'animate-pulse',
    fadeIn: 'animate-in fade-in zoom-in-95',
    slideIn: 'animate-in slide-in-from-bottom-4'
} as const

export const COLORS = {
    cardBackground: 'bg-card',
    cardBackgroundHover: 'bg-muted/30',
    border: 'border',
    borderSubtle: 'border-primary/20',
    textPrimary: 'text-foreground',
    textSecondary: 'text-muted-foreground',
    textMuted: 'text-muted-foreground/70'
} as const

// Occupancy status colors
export const OCCUPANCY_COLORS = {
    owner_occupied: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
        label: 'Vive Propietario'
    },
    vacant: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-200',
        dot: 'bg-green-500',
        label: 'Vacío'
    },
    rented: {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        label: 'Alquilado'
    },
    other_agency: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-200',
        dot: 'bg-red-500',
        label: 'Otra Agencia'
    },
    unknown: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-200',
        dot: 'bg-gray-500',
        label: 'Desconocido'
    }
} as const

export type OccupancyStatus = keyof typeof OCCUPANCY_COLORS
