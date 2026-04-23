'use server'

import { rankSellerIntent } from '@/lib/intelligence/seller-intent'
import { rankBuyersForProperty } from '@/lib/intelligence/buyer-fit'
import { getMyAgency } from '@/app/actions/team'
import { createClient } from '@/lib/supabase/server'

export async function getTopSellers(opts: { limit?: number; persist?: boolean } = {}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { agency } = await getMyAgency()
  if (!agency) return { error: 'Sin agencia' }

  try {
    const results = await rankSellerIntent(agency.id, opts)
    return { success: true, results }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function getTopBuyersForProperty(
  propertyId: string,
  opts: { limit?: number; persist?: boolean } = {}
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  try {
    const results = await rankBuyersForProperty(propertyId, opts)
    return { success: true, results }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function getContactDossier(contactId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const [{ data: contact }, { data: docs }, { data: interactions }, { data: scores }] = await Promise.all([
    supabase.from('contacts').select('*').eq('id', contactId).single(),
    supabase
      .from('contact_documents')
      .select('id, original_name, summary, ingested_at')
      .eq('contact_id', contactId)
      .order('ingested_at', { ascending: false }),
    supabase
      .from('contact_interactions')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('seller_intent_scores')
      .select('*')
      .eq('contact_id', contactId)
      .order('computed_at', { ascending: false })
      .limit(5),
  ])

  if (!contact) return { error: 'Contacto no encontrado' }

  return {
    success: true,
    contact,
    documents: docs ?? [],
    interactions: interactions ?? [],
    scores: scores ?? [],
  }
}
