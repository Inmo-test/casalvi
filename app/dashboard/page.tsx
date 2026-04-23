import { getDashboardStats, getSmartFeed } from '@/app/actions/dashboard'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { SmartFeed } from '@/components/dashboard/smart-feed'
import { DashboardHeader, QuickActionsCard } from '@/components/dashboard/dashboard-header'
import { Home } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  const feedItems = await getSmartFeed()

  // Safety: ensure arrays are valid
  const safeFeedItems = Array.isArray(feedItems) ? feedItems : []

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">

        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Home className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-medium tracking-tight text-foreground">Dashboard</h1>
        </div>
        <DashboardHeader />

        {/* KPI Cards Row */}
        <DashboardStats stats={stats} />

        {/* Main Grid: 2/3 Feed + 1/3 Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

          {/* Main Column: Smart Feed (2/3 on desktop) */}
          <div className="lg:col-span-2">
            <SmartFeed items={safeFeedItems} />
          </div>

          {/* Sidebar Column: Quick Actions (1/3 on desktop) */}
          <div className="lg:col-span-1 space-y-6">
            <QuickActionsCard />
          </div>

        </div>
      </main>
    </div>
  )
}
