'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getMyAgency } from '@/app/actions/team'

export interface DashboardStats {
  kpi: {
    totalContacts: number
    hotLeads: number
    buyers: number
    owners: number
  }
  aiAlerts: Array<{
    id: string
    ai_summary: string | null
    ai_sentiment: string | null
    created_at: string
    type: string
    contact?: {
      first_name: string
      last_name: string | null
    }
  }>
}

export async function getDashboardStats(): Promise<DashboardStats | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const agencyId = (user?.app_metadata?.agency_id as string) || null
  if (!agencyId) return null

  const [
    contactsCountResult,
    hotLeadsResult,
    buyersResult,
    ownersResult,
    aiAlertsResult,
  ] = await Promise.all([
    supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId),
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .gte('conversion_probability', 60),
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('role', 'buyer'),
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('role', 'owner'),
    supabase
      .from('activities')
      .select(`
        id, ai_summary, ai_sentiment, created_at, type,
        contact:contacts(first_name, last_name)
      `)
      .eq('agency_id', agencyId)
      .in('ai_sentiment', ['urgent', 'positive'])
      .order('created_at', { ascending: false })
      .limit(4),
  ])

  const aiAlertsData = Array.isArray(aiAlertsResult.data) ? aiAlertsResult.data : []
  const aiAlerts = aiAlertsData.map((alert: any) => {
    const contactData = Array.isArray(alert?.contact) ? alert.contact[0] : alert?.contact
    return {
      id: alert?.id || '',
      ai_summary: alert?.ai_summary || null,
      ai_sentiment: alert?.ai_sentiment || null,
      created_at: alert?.created_at || new Date().toISOString(),
      type: alert?.type || '',
      contact: contactData
        ? { first_name: contactData.first_name || '', last_name: contactData.last_name || null }
        : undefined,
    }
  })

  return {
    kpi: {
      totalContacts: contactsCountResult.count || 0,
      hotLeads: hotLeadsResult.count || 0,
      buyers: buyersResult.count || 0,
      owners: ownersResult.count || 0,
    },
    aiAlerts,
  }
}

export interface SmartFeedItem {
  id: string
  type: 'owner_opportunity' | 'opportunity_match' | 'churn_risk' | 'admin_task'
  score: number
  title: string
  entity_a: string
  entity_b: string | null
  reasoning: string
  cta_label: string
  metadata: {
    phone?: string
    id?: string
    contact_id?: string
    conversion_probability?: number
  }
}

export async function getSmartFeed(): Promise<SmartFeedItem[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { agency } = await getMyAgency()
    if (!user || !agency) return []

    const feedItems: SmartFeedItem[] = []

    const { data: staleContacts } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, conversion_probability, updated_at, phone, ai_analysis_cache')
      .eq('agency_id', agency.id)
      .gte('conversion_probability', 50)
      .not('conversion_probability', 'is', null)
      .lt('updated_at', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString())
      .limit(10)

    if (staleContacts && staleContacts.length > 0) {
      staleContacts.forEach((contact: any) => {
        const cache = contact.ai_analysis_cache as any
        const lastUpdate = new Date(contact.updated_at)
        const diffDays = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 3600 * 24))

        feedItems.push({
          id: `churn-${contact.id}`,
          type: 'churn_risk',
          score: Math.min(95, contact.conversion_probability || 70),
          title: `Lead enfriándose: ${contact.first_name} ${contact.last_name || ''}`,
          entity_a: `${contact.first_name} ${contact.last_name || ''}`,
          entity_b: `Probabilidad: ${contact.conversion_probability}%`,
          reasoning: cache?.next_best_action
            ? cache.next_best_action
            : `Este contacto lleva ${diffDays} días sin seguimiento.`,
          cta_label: 'Reactivar',
          metadata: { contact_id: contact.id, phone: contact.phone },
        })
      })
    }

    return feedItems.sort((a, b) => b.score - a.score)
  } catch (err) {
    console.error('[Smart Feed] Error:', err)
    return []
  }
}

export async function dismissFeedItem(entityId: string, type: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  try {
    const { error } = await supabase
      .from('feed_dismissals')
      .insert({ user_id: user.id, entity_id: entityId, feed_type: type })
    if (error) return { error: error.message }
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    return { error: 'Error desconocido' }
  }
}
