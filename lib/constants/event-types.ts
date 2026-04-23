import {
    Phone, Home, FileSignature, Building, DollarSign,
    CheckSquare, StickyNote, Users, Calendar, Eye
} from 'lucide-react'

export type EventTypeId =
    | 'prospecting_call'
    | 'valuation_visit'
    | 'listing_meeting'
    | 'buyer_call'
    | 'property_showing'
    | 'negotiation'
    | 'follow_up_call'
    | 'task'
    | 'note'
    | 'meeting'

export interface EventType {
    id: EventTypeId
    label: string
    icon: any
    color: string
    bgClass: string
    lightBg: string
    textClass: string
    borderClass: string
    category: 'acquisition' | 'sales' | 'general'
}

export const EVENT_TYPES: Record<EventTypeId, EventType> = {
    // ACQUISITION FUNNEL
    prospecting_call: {
        id: 'prospecting_call',
        label: 'Llamada Prospección',
        icon: Phone,
        color: 'blue',
        bgClass: 'bg-blue-500',
        lightBg: 'bg-blue-100',
        textClass: 'text-blue-700',
        borderClass: 'border-blue-200',
        category: 'acquisition'
    },
    valuation_visit: {
        id: 'valuation_visit',
        label: 'Visita Valoración',
        icon: Eye,
        color: 'violet',
        bgClass: 'bg-violet-500',
        lightBg: 'bg-violet-100',
        textClass: 'text-violet-700',
        borderClass: 'border-violet-200',
        category: 'acquisition'
    },
    listing_meeting: {
        id: 'listing_meeting',
        label: 'Cita de Encargo',
        icon: FileSignature,
        color: 'emerald',
        bgClass: 'bg-emerald-500',
        lightBg: 'bg-emerald-100',
        textClass: 'text-emerald-700',
        borderClass: 'border-emerald-200',
        category: 'acquisition'
    },

    // SALES FUNNEL
    buyer_call: {
        id: 'buyer_call',
        label: 'Llamada Cliente',
        icon: Phone,
        color: 'cyan',
        bgClass: 'bg-cyan-500',
        lightBg: 'bg-cyan-100',
        textClass: 'text-cyan-700',
        borderClass: 'border-cyan-200',
        category: 'sales'
    },
    property_showing: {
        id: 'property_showing',
        label: 'Visita a Propiedad',
        icon: Building,
        color: 'green',
        bgClass: 'bg-green-500',
        lightBg: 'bg-green-100',
        textClass: 'text-green-700',
        borderClass: 'border-green-200',
        category: 'sales'
    },
    negotiation: {
        id: 'negotiation',
        label: 'Negociación',
        icon: DollarSign,
        color: 'amber',
        bgClass: 'bg-amber-500',
        lightBg: 'bg-amber-100',
        textClass: 'text-amber-700',
        borderClass: 'border-amber-200',
        category: 'sales'
    },

    // GENERAL
    follow_up_call: {
        id: 'follow_up_call',
        label: 'Llamada Seguimiento',
        icon: Phone,
        color: 'indigo',
        bgClass: 'bg-indigo-500',
        lightBg: 'bg-indigo-100',
        textClass: 'text-indigo-700',
        borderClass: 'border-indigo-200',
        category: 'general'
    },
    task: {
        id: 'task',
        label: 'Tarea',
        icon: CheckSquare,
        color: 'slate',
        bgClass: 'bg-slate-500',
        lightBg: 'bg-slate-100',
        textClass: 'text-slate-700',
        borderClass: 'border-slate-200',
        category: 'general'
    },
    note: {
        id: 'note',
        label: 'Nota',
        icon: StickyNote,
        color: 'gray',
        bgClass: 'bg-gray-500',
        lightBg: 'bg-gray-100',
        textClass: 'text-gray-700',
        borderClass: 'border-gray-200',
        category: 'general'
    },
    meeting: {
        id: 'meeting',
        label: 'Reunión',
        icon: Users,
        color: 'purple',
        bgClass: 'bg-purple-500',
        lightBg: 'bg-purple-100',
        textClass: 'text-purple-700',
        borderClass: 'border-purple-200',
        category: 'general'
    }
}

// Helper to get event type by ID with fallback
export function getEventType(id: string): EventType {
    return EVENT_TYPES[id as EventTypeId] || EVENT_TYPES.task
}

// Group event types by category for UI
export const EVENT_TYPES_BY_CATEGORY = {
    acquisition: Object.values(EVENT_TYPES).filter(t => t.category === 'acquisition'),
    sales: Object.values(EVENT_TYPES).filter(t => t.category === 'sales'),
    general: Object.values(EVENT_TYPES).filter(t => t.category === 'general')
}
