export type PlanType = 'starter' | 'pro' | 'agency' | 'business'

// Centralized plan configuration
export const DEFAULT_PLAN: PlanType = 'starter'
export const VALID_PLANS: readonly PlanType[] = ['starter', 'pro', 'agency', 'business'] as const

// Mapping of Stripe Price IDs to internal Plan Types
export const STRIPE_PLANS = {
  [process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_pro_dummy']: 'pro',
  [process.env.NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID || 'price_agency_dummy']: 'agency',
  [process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID || 'price_business_dummy']: 'business',
} as const

export const PLAN_LIMITS = {
  starter: {
    label: 'Starter',
    maxContacts: 20,
    maxProperties: 2,
    maxUsers: 1,
    canUseAI: false, // <--- Bloqueado completamente para Starter
    canExport: false,
    canImportCSV: false, // <--- 🔒 NUEVO: Bloqueado
    canSeeAnalytics: false, // <--- 🔒 BLOQUEADO
  },
  pro: {
    label: 'Agente Pro',
    maxContacts: Infinity,
    maxProperties: Infinity,
    maxUsers: 1,
    canUseAI: true,
    canExport: true,
    canImportCSV: true, // <--- ✅ Permitido
    canSeeAnalytics: true, // <--- ✅ PERMITIDO
  },
  agency: {
    label: 'Agencia',
    maxContacts: Infinity,
    maxProperties: Infinity,
    maxUsers: 5,
    canUseAI: true,
    canExport: true,
    canImportCSV: true,
    canSeeAnalytics: true,
  },
  business: {
    label: 'Business',
    maxContacts: Infinity,
    maxProperties: Infinity,
    maxUsers: 3, // 3 Agentes
    canUseAI: true,
    canExport: true,
    canImportCSV: true,
    canSeeAnalytics: true,
  },
} as const

// Función auxiliar para saber si se ha alcanzado el límite
export function hasReachedLimit(currentCount: number, limit: number) {
  return limit !== Infinity && currentCount >= limit
}

