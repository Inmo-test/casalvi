'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import { Home, Users, Settings, LogOut, Wrench, BarChart3, Mail, Store, Search, Send, X, Mic } from 'lucide-react'
import { useDashboardContext } from '@/context/dashboard-context'
import { logout } from '@/app/actions/auth'
import { Button } from "@casalvi/ui"
import { ModeToggle } from '@/components/ui/mode-toggle'
import { useI18n } from '@/lib/i18n/I18nContext'

interface MobileSidebarProps {
    userEmail?: string
    userName?: string
    role?: string | null
    userImage?: string | null
}

export function MobileSidebar({ userEmail, userName = 'Agente', role, userImage }: MobileSidebarProps) {
    const { t } = useI18n()
    const pathname = usePathname()
    const { isMobileMenuOpen, toggleMobileMenu } = useDashboardContext()

    // Navigation Items (Same as Desktop Sidebar)
    const navItems = [
        { title: t.dashboard.sidebar.dashboard, href: '/dashboard', icon: Home },
        { title: t.dashboard.sidebar.contacts, href: '/dashboard/contacts', icon: Users },
        { title: t.dashboard.sidebar.inbox, href: '/dashboard/inbox', icon: Mail },
        { title: t.dashboard.sidebar.analytics, href: '/dashboard/analytics', icon: BarChart3 },
        { title: t.dashboard.sidebar.tools, href: '/dashboard/tools', icon: Wrench },
        { title: t.dashboard.sidebar.settings, href: '/dashboard/settings', icon: Settings },
    ]

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === href
        return pathname.startsWith(href)
    }

    const initial = userName ? userName.charAt(0).toUpperCase() : 'A'

    // Si no está abierto, no renderizamos nada (o renderizamos null)
    // Pero para la animación es mejor tenerlo montado y usar clases de transformación
    // Usaremos un overlay fijo

    return (
        <div className={cn(
            "fixed inset-0 z-[100] md:hidden transition-all duration-300 pointer-events-none",
            isMobileMenuOpen ? "pointer-events-auto" : ""
        )}>
            {/* Overlay Oscuro */}
            <div
                className={cn(
                    "absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300",
                    isMobileMenuOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={toggleMobileMenu}
            />

            {/* Sidebar / Drawer */}
            <div
                className={cn(
                    "absolute top-0 right-0 bottom-0 w-[280px] bg-background border-l shadow-2xl transition-transform duration-300 ease-out flex flex-col",
                    isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header User Info */}
                <div className="p-6 border-b flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div className="h-12 w-12 rounded-full bg-muted border-2 border-background shadow-sm flex items-center justify-center overflow-hidden">
                            {userImage ? (
                                <img src={userImage} alt={userName} className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-medium text-lg">
                                    {initial}
                                </div>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="-mr-2">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div>
                        <p className="font-bold text-lg leading-tight">{userName}</p>
                        <p className="text-sm text-muted-foreground">{userEmail}</p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span><b className="text-foreground">3</b> {t.dashboard.stats.total_contacts.split(' ')[1]}</span>
                        <span><b className="text-foreground">1</b> {t.dashboard.stats.active_properties.split(' ')[1]}</span>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={toggleMobileMenu}
                                className={cn(
                                    'flex items-center gap-4 rounded-full px-4 py-3 text-base font-medium transition-colors',
                                    active
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                            >
                                <Icon className={cn("h-6 w-6", active && "text-primary")} />
                                <span>{item.title}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer Actions */}
                <div className="p-4 border-t space-y-4 bg-muted/5">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-sm font-medium">{t.dashboard.sidebar.theme}</span>
                        <ModeToggle />
                    </div>

                    <form action={logout} className="w-full">
                        <button
                            type="submit"
                            className="w-full flex items-center gap-3 px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                        >
                            <LogOut className="h-5 w-5" />
                            {t.dashboard.sidebar.logout}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
