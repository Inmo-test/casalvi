'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import { StateIcon } from '@/lib/utils/icons'
import { Mic } from 'lucide-react'

import { useI18n } from '@/lib/i18n/I18nContext'

export function MobileNav() {
  const { t } = useI18n()
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', icon: 'home', label: t.dashboard.sidebar.dashboard },
    { href: '/dashboard/contacts', icon: 'users', label: t.dashboard.sidebar.contacts },
    { href: '/dashboard/intelligence', icon: 'chart', label: 'Inteligencia' },
    { href: '/dashboard/ingest', icon: 'tools', label: 'Ingesta' },
  ] as const

  const handleVoiceButtonClick = () => {
    // Disparar evento global para que FloatingVoiceRecorder lo escuche
    window.dispatchEvent(new CustomEvent('open-voice-assistant'))
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-md border-t shadow-lg">
      <div className="relative grid grid-cols-5 h-16 px-2">
        {/* Primeros 2 items */}
        {navItems.slice(0, 2).map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-all duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'p-2 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-accent'
                  : 'hover:bg-accent/50'
              )}>
                <StateIcon name={item.icon} active={isActive} className="h-5 w-5" />
              </div>
              <span className={cn(
                'text-[10px] font-medium transition-all',
                isActive && 'font-medium'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* Espacio central para el Botón de Voz IA */}
        <div className="relative flex items-center justify-center">
          <button
            onClick={handleVoiceButtonClick}
            className={cn(
              "w-12 h-12 rounded-full", // Slightly larger than icons but contained
              "bg-primary hover:bg-primary/90",
              "shadow-md shadow-primary/30",
              "flex items-center justify-center",
              "transition-all duration-300",
              "hover:scale-105 active:scale-95"
            )}
          >
            <Mic className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Últimos 2 items */}
        {navItems.slice(2).map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-all duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'p-2 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-accent'
                  : 'hover:bg-accent/50'
              )}>
                <StateIcon name={item.icon} active={isActive} className="h-5 w-5" />
              </div>
              <span className={cn(
                'text-[10px] font-medium transition-all',
                isActive && 'font-medium'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}


