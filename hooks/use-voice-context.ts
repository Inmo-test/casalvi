'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'

export type VoiceContextType = 
  | 'property_detail'
  | 'property_list'
  | 'contact_detail'
  | 'contact_list'
  | 'dashboard'
  | 'calendar'
  | 'unknown'

export type VoiceCapability = 
  | 'filter_top_buyers'
  | 'filter_top_properties'
  | 'generate_email'
  | 'schedule_visit'
  | 'create_group'
  | 'suggest_action'
  | 'bulk_action'
  | 'navigate_to'
  | 'create_contact'
  | 'create_activity'
  | 'update_contact'

export type VoiceContext = {
  type: VoiceContextType
  capabilities: VoiceCapability[]
  currentData?: {
    id?: string
    name?: string
    type?: string
    [key: string]: any
  }
  filters?: Record<string, any>
  metadata?: {
    totalItems?: number
    selectedItems?: string[]
    [key: string]: any
  }
}

/**
 * Hook to detect current page context and available voice capabilities
 * Used by floating voice recorder to provide contextual AI assistance
 */
export function useVoiceContext(): VoiceContext {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Extract route segments
  const segments = pathname.split('/').filter(Boolean)

  // ============================================
  // PROPERTY DETAIL PAGE
  // ============================================
  if (segments[0] === 'dashboard' && segments[1] === 'properties' && segments[2]) {
    const propertyId = segments[2]
    
    return {
      type: 'property_detail',
      capabilities: [
        'filter_top_buyers',      // "Muéstrame los 10 mejores compradores"
        'generate_email',          // "Envía email a los filtered"
        'schedule_visit',          // "Programa visita para mañana"
        'create_activity',         // "Registra una visita"
        'suggest_action'           // "¿Qué hago con esta propiedad?"
      ],
      currentData: {
        id: propertyId,
        type: 'property'
      }
    }
  }

  // ============================================
  // PROPERTIES LIST PAGE
  // ============================================
  if (segments[0] === 'dashboard' && segments[1] === 'properties' && !segments[2]) {
    return {
      type: 'property_list',
      capabilities: [
        'create_contact',          // "Nuevo propietario María García"
        'filter_top_properties',   // "Muestra las 5 mejores para compradores"
        'bulk_action',             // "Marca todas como publicadas"
        'navigate_to'              // "Llévame a la propiedad de Calle Mayor"
      ],
      filters: Object.fromEntries(searchParams.entries())
    }
  }

  // ============================================
  // CONTACT DETAIL PAGE
  // ============================================
  if (segments[0] === 'dashboard' && segments[1] === 'contacts' && segments[2]) {
    const contactId = segments[2]
    
    return {
      type: 'contact_detail',
      capabilities: [
        'create_activity',         // "Registra una llamada"
        'update_contact',          // "Cambiar a comprador"
        'suggest_action',          // "¿Qué le digo a este contacto?"
        'filter_top_properties',   // "Muestra propiedades que le puedan gustar"
        'generate_email'           // "Envíale un email"
      ],
      currentData: {
        id: contactId,
        type: 'contact'
      }
    }
  }

  // ============================================
  // CONTACTS LIST PAGE
  // ============================================
  if (segments[0] === 'dashboard' && segments[1] === 'contacts' && !segments[2]) {
    return {
      type: 'contact_list',
      capabilities: [
        'create_contact',          // "Nuevo contacto Juan López"
        'create_group',            // "Crea grupo de propietarios en Chamartín"
        'filter_top_buyers',       // "Filtra compradores con presupuesto >300k"
        'bulk_action',             // "Envía email a todos los seleccionados"
        'navigate_to'              // "Llévame al contacto María"
      ],
      filters: Object.fromEntries(searchParams.entries())
    }
  }

  // ============================================
  // DASHBOARD HOME
  // ============================================
  if (segments[0] === 'dashboard' && segments.length === 1) {
    return {
      type: 'dashboard',
      capabilities: [
        'create_contact',
        'create_activity',
        'navigate_to',
        'suggest_action'           // "¿Qué debería hacer hoy?"
      ]
    }
  }

  // ============================================
  // CALENDAR PAGE
  // ============================================
  if (segments[0] === 'dashboard' && segments[1] === 'calendar') {
    return {
      type: 'calendar',
      capabilities: [
        'schedule_visit',          // "Programa visita con Ana mañana a las 10"
        'create_activity',         // "Registra llamada con Pedro"
        'suggest_action'           // "¿Qué tengo pendiente esta semana?"
      ]
    }
  }

  // ============================================
  // FALLBACK: UNKNOWN
  // ============================================
  return {
    type: 'unknown',
    capabilities: [
      'create_contact',
      'create_activity',
      'navigate_to'
    ]
  }
}

/**
 * Get human-readable description of current context
 */
export function getContextDescription(context: VoiceContext): string {
  const descriptions: Record<VoiceContextType, string> = {
    property_detail: 'Estás viendo una propiedad. Puedes filtrar compradores, programar visitas, o generar emails.',
    property_list: 'Estás en la lista de propiedades. Puedes filtrar, crear contactos, o navegar.',
    contact_detail: 'Estás viendo un contacto. Puedes registrar actividades, sugerir acciones, o buscar propiedades.',
    contact_list: 'Estás en la lista de contactos. Puedes crear grupos, filtrar, o enviar emails masivos.',
    dashboard: 'Estás en el dashboard. Puedes crear contactos, actividades, o navegar.',
    calendar: 'Estás en el calendario. Puedes programar visitas o ver tu agenda.',
    unknown: 'Puedes crear contactos, registrar actividades, o navegar.'
  }

  return descriptions[context.type] || descriptions.unknown
}

/**
 * Check if a capability is available in current context
 */
export function hasCapability(context: VoiceContext, capability: VoiceCapability): boolean {
  return context.capabilities.includes(capability)
}
