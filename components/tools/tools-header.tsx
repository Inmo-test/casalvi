"use client"

import { useI18n } from "@/lib/i18n/I18nContext"
import { Wrench } from "lucide-react"

export function ToolsHeader() {
    const { t } = useI18n()

    return (
        <div className="border-b bg-card shrink-0 z-20 shadow-sm">
            <div className="px-6 py-5 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-medium tracking-tight text-foreground flex items-center gap-2">
                        <Wrench className="h-6 w-6 text-primary" />
                        {t.dashboard.tools.title}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {t.dashboard.tools.subtitle}
                    </p>
                </div>
            </div>
        </div>
    )
}
