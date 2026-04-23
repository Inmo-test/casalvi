'use client'

import Link from 'next/link'
import { CasalviLogo } from '../ui/casalvi-logo'
import { useDashboardContext } from '@/context/dashboard-context'

interface MobileHeaderProps {
    userName?: string
    userEmail?: string
    userImage?: string | null
}

export function MobileHeader({ userName = 'Agente', userImage }: MobileHeaderProps) {
    const { toggleMobileMenu } = useDashboardContext()
    // Obtener inicial para fallback
    const initial = userName ? userName.charAt(0).toUpperCase() : 'A'

    return (
        <header className="grid grid-cols-3 items-center px-4 py-3 bg-background/95 backdrop-blur-sm border-b md:hidden sticky top-0 z-40">
            {/* Izquierda: Saludo / Nombre */}
            <div className="flex justify-start">
                <span className="font-medium text-base truncate max-w-[120px] sm:max-w-[200px] leading-tight">{userName}</span>
            </div>

            {/* Centro: Logo Casalvi */}
            <div className="flex justify-center">
                <CasalviLogo variant="icon" className="h-8 w-8 text-primary dark:text-white" />
            </div>

            {/* Derecha: Perfil (Trigger Sidebar) */}
            <div className="flex justify-end">
                <button
                    onClick={toggleMobileMenu}
                    className="relative transition-transform active:scale-95 outline-none"
                    aria-label="Abrir menú"
                >
                    <div className="h-9 w-9 rounded-full bg-muted border-2 border-background shadow-sm flex items-center justify-center overflow-hidden">
                        {userImage ? (
                            <img src={userImage} alt={userName} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                                {initial}
                            </div>
                        )}
                    </div>
                </button>
            </div>
        </header>
    )
}
