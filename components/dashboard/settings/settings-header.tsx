'use client'

import { useI18n } from '@/lib/i18n/I18nContext'
import { Settings, User, Plug, Users, CreditCard, Mail } from 'lucide-react'

export function SettingsHeader() {
    const { t } = useI18n()

    return (
        <div className="border-b bg-card shrink-0 z-20 shadow-sm">
            <div className="px-6 py-5 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-medium tracking-tight text-foreground flex items-center gap-2">
                        <Settings className="h-6 w-6 text-primary" />
                        {t.dashboard.settings.title}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {t.dashboard.settings.subtitle}
                    </p>
                </div>
            </div>
        </div>
    )
}

export function SettingsTabLabels() {
    const { t } = useI18n()

    return {
        general: { icon: User, label: t.dashboard.settings.tabs.general },
        integrations: { icon: Plug, label: t.dashboard.settings.tabs.integrations },
        team: { icon: Users, label: t.dashboard.settings.tabs.team },
        billing: { icon: CreditCard, label: t.dashboard.settings.tabs.billing },
        email: { icon: Mail, label: t.dashboard.settings.tabs.email }
    }
}
