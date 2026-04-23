'use server'

import { createClient } from '@/lib/supabase/server'
import { getMyAgency } from '@/app/actions/team'
import { revalidatePath } from 'next/cache'

export async function getAgencyNotificationSettings() {
  const { agency } = await getMyAgency()
  if (!agency) return { setting: 'manual' } // Default

  // Como ya traemos 'agency' de getMyAgency, si añadiste la columna al select allí, ya la tienes.
  // Si no, hacemos una query rápida.
  const supabase = await createClient()
  const { data } = await supabase
    .from('agencies')
    .select('settings_notifications')
    .eq('id', agency.id)
    .single()

  return { setting: data?.settings_notifications || 'manual' }
}

export async function updateAgencySettings(agencyId: string, data: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('agencies').update(data).eq('id', agencyId)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { success: true }
}


