'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { Button } from "@/components/ui"
import { AlertCircle, Home, TrendingDown, Wrench } from 'lucide-react'
import { cn } from '@/lib/cn'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/I18nContext'

interface SmartFeedItem {
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
        property_id?: string
    }
}

interface SmartFeedProps {
    items: SmartFeedItem[]
}

function getItemIcon(type: SmartFeedItem['type']) {
    switch (type) {
        case 'owner_opportunity':
            return Home
        case 'churn_risk':
            return TrendingDown
        case 'admin_task':
            return Wrench
        default:
            return AlertCircle
    }
}

function getItemColor(type: SmartFeedItem['type']) {
    switch (type) {
        case 'owner_opportunity':
            return {
                icon: 'text-emerald-600',
                bg: 'bg-emerald-100',
            }
        case 'churn_risk':
            return {
                icon: 'text-amber-600',
                bg: 'bg-amber-100',
            }
        case 'admin_task':
            return {
                icon: 'text-[#007AFF]',
                bg: 'bg-blue-100',
            }
        default:
            return {
                icon: 'text-gray-600',
                bg: 'bg-gray-100',
            }
    }
}

export function SmartFeed({ items }: SmartFeedProps) {
    const { t } = useI18n()
    if (!items || items.length === 0) {
        return (
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">{t.dashboard.feed.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">
                            {t.dashboard.feed.no_opportunities}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            {t.dashboard.feed.all_clear}
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t.dashboard.feed.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                    {items.length} {t.dashboard.feed.recommended_actions}
                </p>
            </CardHeader>
            <CardContent className="space-y-3">
                {items.slice(0, 8).map((item) => {
                    const Icon = getItemIcon(item.type)
                    const colors = getItemColor(item.type)
                    const targetHref = item.metadata.contact_id
                        ? `/dashboard/contacts/${item.metadata.contact_id}`
                        : '#'

                    return (
                        <div
                            key={item.id}
                            className="group flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-200"
                        >
                            {/* Icon Box */}
                            <div className={cn(
                                'h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm',
                                colors.bg
                            )}>
                                <Icon className={cn('h-6 w-6', colors.icon)} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 space-y-2">
                                {/* Header: Title + Score Badge (Mobile) */}
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm text-foreground">
                                        {item.entity_a}
                                    </h4>
                                    <span className={cn(
                                        "md:hidden text-[10px] font-medium px-2 py-0.5 rounded-full",
                                        colors.bg, colors.icon
                                    )}>
                                        {item.score}%
                                    </span>
                                </div>

                                {/* Progress Bar Row (Desktop) */}
                                <div className="flex items-center gap-4 text-xs">
                                    <span className="text-muted-foreground font-medium w-24">
                                        Probabilidad: {item.score}%
                                    </span>
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[200px]">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-500",
                                                item.score > 70 ? "bg-emerald-500" :
                                                    item.score > 40 ? "bg-amber-500" : "bg-slate-400"
                                            )}
                                            style={{ width: `${item.score}%` }}
                                        />
                                    </div>
                                    <span className={cn(
                                        "hidden md:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full ml-auto",
                                        item.score > 70 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                    )}>
                                        {item.score}%
                                    </span>
                                </div>

                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {item.reasoning}
                                </p>
                            </div>

                            {/* Action Button */}
                            <div className="flex-shrink-0 pt-2 md:pt-0 border-t md:border-0 border-dashed md:pl-4">
                                <Link href={targetHref}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full md:w-auto font-medium text-slate-600 hover:text-primary hover:border-primary/50"
                                    >
                                        {item.cta_label || 'Reactivar'}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
