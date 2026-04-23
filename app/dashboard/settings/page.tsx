import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsContent } from '@/components/settings/settings-content'
import { getMyAgency } from '@/app/actions/team'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Configuración | Casalvi',
}

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const agencyResult = await getMyAgency()
  const agency = agencyResult.agency

  const role = agencyResult.role
  const isManager = role === 'owner' || role === 'admin'

  let currentMembersCount = 0
  let notificationSetting = 'manual'

  if (agency) {
    const { count } = await supabase
      .from('agency_members')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agency.id)
    currentMembersCount = count || 0

    const { data: agencyData } = await supabase
      .from('agencies')
      .select('settings_notifications')
      .eq('id', agency.id)
      .single()
    notificationSetting = agencyData?.settings_notifications || 'manual'
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <SettingsContent
      user={user}
      agency={agency}
      profile={profile}
      currentMembersCount={currentMembersCount}
      notificationSetting={notificationSetting}
      isManager={isManager}
    />
  )
}
