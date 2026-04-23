/**
 * Dado un conjunto de hints extraídos por el clasificador, encuentra el
 * contacto de la agencia más probable por email/teléfono/nombre.
 */

import { createAdminClient } from '@/lib/supabase/admin'

export interface ContactHints {
  name?: string
  email?: string
  phone?: string
}

export async function findContactByHints(
  agencyId: string,
  hints: ContactHints
): Promise<{ id: string } | null> {
  const supabase = createAdminClient()

  if (hints.email) {
    const { data } = await supabase
      .from('contacts')
      .select('id')
      .eq('agency_id', agencyId)
      .ilike('email', hints.email)
      .maybeSingle()
    if (data) return data
  }

  if (hints.phone) {
    const normalized = hints.phone.replace(/[^\d+]/g, '')
    const { data } = await supabase
      .from('contacts')
      .select('id')
      .eq('agency_id', agencyId)
      .ilike('phone', `%${normalized.slice(-9)}%`)
      .maybeSingle()
    if (data) return data
  }

  if (hints.name) {
    const parts = hints.name.trim().split(/\s+/)
    const first = parts[0]
    const last = parts.slice(1).join(' ')
    if (first && last) {
      const { data } = await supabase
        .from('contacts')
        .select('id')
        .eq('agency_id', agencyId)
        .ilike('first_name', first)
        .ilike('last_name', `%${last}%`)
        .maybeSingle()
      if (data) return data
    }
  }

  return null
}
