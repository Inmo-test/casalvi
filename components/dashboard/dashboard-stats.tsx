'use client'

import { Card, CardContent } from "@/components/ui"
import { Users, Flame, ShoppingCart, Home } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n } from '@/lib/i18n/I18nContext'

interface DashboardStatsProps {
    stats: {
        kpi: {
            totalContacts: number
            hotLeads: number
            buyers: number
            owners: number
        }
    } | null
}

export function DashboardStats({ stats }: DashboardStatsProps) {
    const { t } = useI18n()
    if (!stats) return null

    const kpis = [
        {
            label: t.dashboard.stats.total_contacts,
            value: stats.kpi.totalContacts,
            icon: Users,
            color: 'text-primary',
            bgColor: 'bg-primary/10',
        },
        {
            label: 'Hot leads',
            value: stats.kpi.hotLeads,
            icon: Flame,
            color: 'text-amber-600',
            bgColor: 'bg-amber-100',
        },
        {
            label: 'Compradores',
            value: stats.kpi.buyers,
            icon: ShoppingCart,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-100',
        },
        {
            label: 'Propietarios',
            value: stats.kpi.owners,
            icon: Home,
            color: 'text-violet-600',
            bgColor: 'bg-violet-100',
        },
    ]

    return (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-6">
            {kpis.map((kpi) => {
                const Icon = kpi.icon
                return (
                    <Card key={kpi.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4 md:p-6 flex items-center gap-4">
                            <div className={cn('h-12 w-12 md:h-14 md:w-14 rounded-xl flex items-center justify-center shrink-0', kpi.bgColor)}>
                                <Icon className={cn('h-6 w-6 md:h-7 md:w-7', kpi.color)} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium mb-1">{kpi.label}</p>
                                <p className="text-2xl font-medium tracking-tight">{kpi.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
