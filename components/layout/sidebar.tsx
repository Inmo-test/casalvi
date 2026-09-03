'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import { Home, Users, Settings, LogOut, ChevronLeft, Mic, Brain, FolderOpen, Wrench } from 'lucide-react'
import { useDashboardContext } from '@/context/dashboard-context'
import { useState } from 'react'
import { logout } from '@/app/actions/auth'
import { Button } from "@/components/ui"
import { ModeToggle } from '@/components/ui/mode-toggle'
import { CasalviLogo } from '@/components/ui/casalvi-logo'
import { useI18n } from '@/lib/i18n/I18nContext'


interface SidebarProps {
    userEmail?: string
    agencyName?: string
    userName?: string
    role?: string | null
    stats?: any
    isAdmin?: boolean
    onNavigate?: () => void
    className?: string
}

export function Sidebar({ userEmail = 'user@casalvi.com', agencyName, userName, role, stats, isAdmin, onNavigate, className }: SidebarProps) {
    const { t } = useI18n()
    const pathname = usePathname()
    const { isSidebarCollapsed, toggleSidebar } = useDashboardContext()

    // Navigation Items with Components
    const navItems = [
        { title: t.dashboard.sidebar.dashboard, href: '/dashboard', icon: Home },
        { title: t.dashboard.sidebar.contacts, href: '/dashboard/contacts', icon: Users },
        { title: 'Inteligencia', href: '/dashboard/intelligence', icon: Brain },
        { title: 'Ingesta', href: '/dashboard/ingest', icon: FolderOpen },
        { title: t.dashboard.sidebar.tools, href: '/dashboard/tools', icon: Wrench },
        { title: t.dashboard.sidebar.settings, href: '/dashboard/settings', icon: Settings },
    ]

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === href
        return pathname.startsWith(href)
    }

    const filteredNavItems = navItems.filter((item) => {
        // Permitimos ver los items para que el usuario choque con el Paywall (Upsell)
        return true
    })

    const handleVoiceAction = () => {
        console.log("🖱️ Sidebar Voice Button Clicked! Dispatching event...")
        window.dispatchEvent(new CustomEvent('open-voice-assistant'))
    }

    return (
        <aside
            className={cn(
                "hidden md:flex flex-col h-screen bg-muted/5 border-r transition-all duration-300 relative group sticky top-0",
                isSidebarCollapsed ? "w-[70px]" : "w-64",
                className
            )}
        >
            {/* Botón Colapsar */}
            <button
                onClick={toggleSidebar}
                className={cn(
                    "absolute -right-3 top-6 z-50 h-6 w-6 rounded-full border bg-background shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 opacity-0 group-hover:opacity-100",
                    isSidebarCollapsed && "rotate-180 opacity-100"
                )}
                title={isSidebarCollapsed ? t.dashboard.sidebar.expand : t.dashboard.sidebar.collapse}
            >
                <ChevronLeft className="h-3 w-3" />
            </button>

            {/* HEADER */}
            <div className={cn("p-4 mb-2 flex items-center h-[80px]", isSidebarCollapsed ? "justify-center" : "px-6")}>
                <CasalviLogo
                    variant={isSidebarCollapsed ? 'icon' : 'full'}
                    className={cn(
                        "transition-all duration-300 text-primary dark:text-white",
                        isSidebarCollapsed ? "h-10 w-10" : "w-[140px] h-auto"
                    )}
                />
            </div>

            {/* NAVEGACIÓN */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-hide">
                {filteredNavItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative',
                                active
                                    ? 'bg-blue-50 text-[#007AFF] dark:bg-blue-900/20 dark:text-blue-300'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                isSidebarCollapsed && 'justify-center px-0'
                            )}
                            title={isSidebarCollapsed ? item.title : undefined}
                        >
                            <Icon className={cn("h-5 w-5 shrink-0 transition-colors", active ? "text-[#007AFF] dark:text-blue-300" : "text-muted-foreground group-hover:text-foreground")} />

                            {!isSidebarCollapsed && (
                                <span className="flex-1 truncate animate-in fade-in duration-200">{item.title}</span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* BOTÓN VOZ */}
            <div className="p-3 border-t">
                <button
                    onClick={handleVoiceAction}
                    className={cn(
                        'flex items-center gap-3 rounded-xl transition-all duration-200 bg-primary text-white font-medium shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]',
                        isSidebarCollapsed ? "p-3 justify-center w-full" : "w-full px-4 py-4"
                    )}
                    title={t.dashboard.sidebar.voice_ai}
                >
                    <div className={cn("flex items-center justify-center shrink-0", !isSidebarCollapsed && "h-10 w-10 rounded-full bg-white/20")}>
                        <Mic className={cn("text-white", isSidebarCollapsed ? "h-6 w-6" : "h-5 w-5")} />
                    </div>
                    {!isSidebarCollapsed && (
                        <div className="text-left flex-1 animate-in fade-in overflow-hidden">
                            <div className="text-sm font-medium truncate">{t.dashboard.sidebar.voice_ai}</div>
                            <div className="text-xs opacity-90 truncate">{t.dashboard.sidebar.voice_ai_subtitle}</div>
                        </div>
                    )}
                </button>
            </div>

            {/* FOOTER USUARIO */}
            <div className={cn("border-t bg-background/50 space-y-4", isSidebarCollapsed ? "p-2 items-center flex flex-col" : "p-4")}>

                {!isSidebarCollapsed && (
                    <div className="flex items-center gap-3 px-1 animate-in fade-in overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-foreground font-medium text-xs ring-1 ring-border shrink-0">
                            {(userEmail || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-foreground">{userEmail}</p>
                            <p className="text-xs text-muted-foreground capitalize">{role || t.dashboard.sidebar.agent_role}</p>
                        </div>
                    </div>
                )}

                <div className={cn("flex items-center gap-2 px-1", isSidebarCollapsed ? "flex-col justify-center w-full" : "justify-between")}>
                    {isSidebarCollapsed ? (
                        <div className="scale-75 origin-center"><ModeToggle /></div>
                    ) : (
                        <div className="flex items-center gap-2 bg-muted/50 rounded-md p-1 pl-2">
                            <span className="text-[10px] uppercase font-medium text-muted-foreground">{t.dashboard.sidebar.theme}</span>
                            <ModeToggle />
                        </div>
                    )}

                    <form action={logout} className="w-full flex justify-center">
                        <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md"
                            title={t.dashboard.sidebar.logout}
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </aside>
    )
}
