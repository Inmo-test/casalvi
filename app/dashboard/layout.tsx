import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMyAgency } from '@/app/actions/team'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { FloatingVoiceRecorder } from '@/components/dashboard/floating-voice-recorder'
import { VoiceProvider } from '@/context/voice-context'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileHeader } from '@/components/layout/mobile-header'
import { DashboardProvider } from '@/context/dashboard-context'
import { MobileSidebar } from '@/components/layout/mobile-sidebar'

import { cookies } from 'next/headers'
import { WelcomeModal } from '@/components/dashboard/welcome-modal'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const defaultCollapsed = cookieStore.get('sidebar:state')?.value === 'true'

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  console.log('[Dashboard Layout] 🔍 User ID:', user?.id)
  console.log('[Dashboard Layout] 📧 User Email:', user?.email)

  // Refresh session to ensure latest permissions
  await supabase.auth.refreshSession()

  // FAIL-SAFE MODE: Try to get agency but don't block on errors
  let agencyResult: any = {
    agency: null,
    role: null,
    error: null
  }

  try {
    console.log('[Dashboard Layout] 🔎 Attempting getMyAgency()...')
    agencyResult = await getMyAgency()
    console.log('[Dashboard Layout] ✅ getMyAgency result:', agencyResult)
  } catch (error) {
    console.error('[Dashboard Layout] ❌ getMyAgency failed:', error)
    agencyResult.error = 'getMyAgency failed'
  }

  // FALLBACK: Direct query if getMyAgency failed or returned null
  if (!agencyResult.agency) {
    console.log('[Dashboard Layout] 🔄 Fallback: Querying agency_members directly...')

    try {
      const { data: directMembership, error: memberError } = await supabase
        .from('agency_members')
        .select('agency_id, is_admin')
        .eq('user_id', user?.id)
        .single()

      if (memberError) {
        console.error('[Dashboard Layout] ❌ Direct membership query error:', memberError)
      }

      console.log('[Dashboard Layout] 📋 Direct membership result:', directMembership)

      if (directMembership?.agency_id) {
        // User has agency membership - fetch agency details
        console.log('[Dashboard Layout] 🏢 Fetching agency details for:', directMembership.agency_id)

        const { data: agency, error: agencyError } = await supabase
          .from('agencies')
          .select('*')
          .eq('id', directMembership.agency_id)
          .single()

        if (agencyError) {
          console.error('[Dashboard Layout] ❌ Agency fetch error:', agencyError)
        } else {
          console.log('[Dashboard Layout] ✅ Agency found:', agency)
          agencyResult = {
            agency,
            role: null,
            membership: directMembership
          }
        }
      } else {
        console.warn('[Dashboard Layout] ⚠️ No agency_members entry found for user')
        // FAIL-SAFE: Allow dashboard access even without agency
        // The UI will show limited functionality
      }
    } catch (fallbackError) {
      console.error('[Dashboard Layout] ❌ Fallback query failed:', fallbackError)
      // Continue anyway - fail-safe mode
    }
  }

  if (!agencyResult.agency) {
    redirect('/')
  }

  // Log final agency state
  console.log('[Dashboard Layout] ✅ FINAL: Agency loaded successfully')
  console.log('[Dashboard Layout] 🏢 Agency Name:', agencyResult.agency.name)
  console.log('[Dashboard Layout] 📊 Subscription:', agencyResult.agency.subscription_status)
  console.log('[Dashboard Layout] 💳 Plan:', agencyResult.agency.billing_plan)

  const billingPlan = agencyResult.agency?.billing_plan || 'free'
  const userRole = agencyResult.role || null

  // Get admin status
  let isAdmin = false
  if (user) {
    const { data: membership } = await supabase
      .from('agency_members')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()
    isAdmin = membership?.is_admin || false
    console.log('[Dashboard Layout] 👑 Is Admin:', isAdmin)
  }

  const stats = null
  const canUseAI = true

  // Get user profile for header
  let userName = user?.email?.split('@')[0] || 'Agente'
  let userImage = null

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url')
      .eq('id', user?.id)
      .single()

    if (profile) {
      userName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || userName
      userImage = profile.avatar_url
    }
  } catch (err) {
    // Ignore profile fetch errors
  }

  return (
    <VoiceProvider>
      <DashboardProvider>
        {/* Layout: Sidebar (desktop) + Main Content */}
        <div className="flex h-screen overflow-hidden">
          {/* Desktop Sidebar */}
          <Sidebar
            userEmail={user?.email}
            agencyName={agencyResult.agency?.name}
            userName={userName}
            role={userRole === 'admin' ? 'Administrador' : userRole === 'manager' ? 'Supervisor' : 'Agente'}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <MobileHeader userName={userName} userImage={userImage} />
            <DashboardShell
              userEmail={user?.email || 'Usuario'}
              plan={billingPlan}
              role={userRole}
              agencyName={agencyResult.agency?.name}
              stats={stats}
              isAdmin={isAdmin}
            >
              {/* Page Content */}
              <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                {children}
              </main>

              {/* Floating Voice Recorder (Global) */}
              <FloatingVoiceRecorder canUseAI={canUseAI} />

              {/* Welcome Modal (Confetti) */}
              <WelcomeModal plan={billingPlan} />

              {/* Mobile Bottom Navigation */}
              <MobileNav />
            </DashboardShell>

            {/* Mobile Sidebar (Drawer) - Placed correctly to overlay everything */}
            <MobileSidebar
              userEmail={user?.email}
              userName={agencyResult.agency?.name || 'Agente'}
              role={userRole}
              userImage={userImage}
            />
          </div>
        </div>
      </DashboardProvider>
    </VoiceProvider>
  )
}
