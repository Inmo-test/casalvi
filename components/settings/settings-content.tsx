'use client'

import { useI18n } from '@/lib/i18n/I18nContext'
import { SettingsProfileCard } from '@/components/settings/profile-card'
import { SettingsAgencyCard } from '@/components/settings/agency-card'
import { NotificationSettings } from '@/components/settings/notification-settings'
import { EmailSettingsForm } from '@/components/settings/email-settings-form'
import { LanguageSelector } from '@/components/dashboard/settings/language-selector'
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import { Users, ChevronRight, User, Plug, Settings, Mail, Sprout } from 'lucide-react'
import Link from 'next/link'

interface SettingsContentProps {
    user: any
    agency: any
    profile: any
    currentMembersCount: number
    notificationSetting: string
    isManager: boolean
}

export function SettingsContent({
    user,
    agency,
    profile,
    currentMembersCount,
    notificationSetting,
    isManager
}: SettingsContentProps) {
    const { t } = useI18n()

    return (
        <div className="flex flex-col h-screen bg-background animate-in fade-in duration-500">
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

            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-muted/10">
                <div className="max-w-5xl mx-auto pb-20">

                    <Tabs defaultValue="general" className="space-y-8">

                        <div className="bg-card p-1 rounded-xl border shadow-sm inline-flex">
                            <TabsList className="bg-transparent h-auto p-0 gap-1">
                                <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary py-2.5 px-4 font-medium">
                                    <User className="h-4 w-4 mr-2" /> {t.dashboard.settings.tabs.general}
                                </TabsTrigger>
                                <TabsTrigger value="integrations" className="rounded-lg data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary py-2.5 px-4 font-medium">
                                    <Plug className="h-4 w-4 mr-2" /> {t.dashboard.settings.tabs.integrations}
                                </TabsTrigger>
                                <TabsTrigger value="team" disabled={!isManager} className="rounded-lg data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary py-2.5 px-4 font-medium">
                                    <Users className="h-4 w-4 mr-2" /> {t.dashboard.settings.tabs.team}
                                </TabsTrigger>
                                <TabsTrigger value="email" className="rounded-lg data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary py-2.5 px-4 font-medium">
                                    <Mail className="h-4 w-4 mr-2" /> {t.dashboard.settings.tabs.email}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="general" className="space-y-6 animate-in slide-in-from-left-2 duration-300">
                            <LanguageSelector />

                            <SettingsProfileCard
                                email={user.email || ''}
                                userId={user.id}
                                firstName={user.user_metadata?.first_name || ''}
                                lastName={user.user_metadata?.last_name || ''}
                            />
                            {agency && (
                                <SettingsAgencyCard agency={agency} />
                            )}
                            {agency && isManager && (
                                <NotificationSettings
                                    initialSetting={notificationSetting}
                                    agencyId={agency.id}
                                />
                            )}
                        </TabsContent>

                        <TabsContent value="integrations" className="space-y-6 animate-in slide-in-from-left-2 duration-300">
                            <Link href="/dashboard/settings/farming">
                                <Card className="hover:shadow-md transition-all duration-300 cursor-pointer border-l-4 border-l-emerald-500 bg-card dark:bg-card/90">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-emerald-100 dark:bg-emerald-950 p-3 rounded-full text-emerald-600 dark:text-emerald-400">
                                                    <Sprout className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-xl">Farming Inteligente</CardTitle>
                                                    <CardDescription>
                                                        Configurar intervalos automáticos de seguimiento con IA
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    </CardHeader>
                                </Card>
                            </Link>
                        </TabsContent>

                        <TabsContent value="team" className="space-y-6 animate-in slide-in-from-left-2 duration-300">
                            <Link href="/dashboard/settings/team">
                                <Card className="hover:shadow-md transition-all duration-300 cursor-pointer border-l-4 border-l-primary bg-card dark:bg-card/90">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-full text-primary">
                                                    <Users className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-xl">{t.dashboard.settings.team.title || "Gestión de Usuarios"}</CardTitle>
                                                    <CardDescription>
                                                        {currentMembersCount} {t.dashboard.settings.team.active_members || "miembros activos"}.
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    </CardHeader>
                                </Card>
                            </Link>
                        </TabsContent>

                        <TabsContent value="email" className="space-y-6 animate-in slide-in-from-left-2 duration-300">
                            {profile ? <EmailSettingsForm profile={profile} /> : <div>Error loading profile</div>}
                        </TabsContent>

                    </Tabs>
                </div>
            </div>
        </div>
    )
}
