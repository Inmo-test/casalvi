"use client"

import { useI18n } from "@/lib/i18n/I18nContext"
import { TrendingUp, BarChart3, Target, Lock } from "lucide-react"

export function AnalyticsHeader() {
    const { t } = useI18n()

    return (
        <div className="border-b bg-card shrink-0 z-20 shadow-sm">
            <div className="px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-medium tracking-tight text-foreground flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-primary" />
                        {t.dashboard.analytics.title}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {t.dashboard.analytics.subtitle}
                    </p>
                </div>
            </div>
        </div>
    )
}
