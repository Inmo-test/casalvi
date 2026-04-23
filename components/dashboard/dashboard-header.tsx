'use client'

import { useI18n } from '@/lib/i18n/I18nContext'

export function DashboardHeader() {
    const { t } = useI18n()

    return (
        <div className="space-y-2">
            <p className="text-muted-foreground">
                {t.dashboard.sidebar.dashboard_subtitle}
            </p>
        </div>
    )
}

export function QuickActionsCard() {
    const { t } = useI18n()

    return (
        <div className="relative p-6 rounded-2xl bg-[#007AFF] text-white shadow-xl overflow-hidden group">
            <div className="relative z-10">
                <h3 className="text-xl font-medium mb-1">
                    {t.dashboard.quick_actions.title || "Siguiente Paso"}
                </h3>
                <p className="text-sm text-blue-100 mb-6">
                    {t.dashboard.quick_actions.subtitle || "¿Tienes un nuevo contacto o propiedad?"}
                </p>
                <div className="flex gap-3">
                    <a
                        href="/dashboard/contacts/new"
                        className="flex-1 bg-white text-[#007AFF] px-4 py-2.5 rounded-xl text-sm font-medium text-center hover:bg-blue-50 transition shadow-sm"
                    >
                        + Contacto
                    </a>
                </div>
            </div>
        </div>
    )
}
