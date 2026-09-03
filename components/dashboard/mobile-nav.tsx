'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui"
import { Button } from "@/components/ui"
import { PanelRight, X } from 'lucide-react'
import { Sidebar } from '@/components/layout/sidebar'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { BrandLogo } from '@/components/ui/brand-logo'

interface MobileNavProps {
  userEmail: string
  role?: string | null
  agencyName?: string
  plan?: string | null // <--- FIX: Añadido para que TypeScript no se queje
}

export function MobileNav({ userEmail, role, agencyName, plan }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden sticky top-0 z-50 flex h-16 w-full items-center justify-between bg-background/80 backdrop-blur-md px-4 transition-all border-b border-border/40">

      {/* LOGO (Izquierda) - AHORA SOLO ICONO */}
      <Link href="/dashboard" className="flex items-center gap-2 z-50">
        <BrandLogo variant="icon" width={36} />
      </Link>

      {/* MENÚ SHEET */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground/80 hover:text-foreground transition-colors"
          >
            <PanelRight className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>

        <SheetContent
          side="right"
          className={cn(
            "w-[100vw] sm:w-[100vw] h-full p-0 border-none shadow-none bg-background",
            "sheet-premium-transition",
            "[&>button]:hidden" // Oculta la X por defecto de Shadcn
          )}
        >
          {/* Header Personalizado del Sheet */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-border/40">
            <span className="text-xl font-medium tracking-tight text-foreground flex items-center gap-2">
              {/* Opcional: Logo pequeño también dentro del menú */}
              <BrandLogo variant="icon" width={28} />
              Menú
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="rounded-full hover:bg-muted h-10 w-10"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="px-4 py-6 h-full overflow-y-auto">
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-both">
              <Sidebar
                userEmail={userEmail}
                role={role}
                agencyName={agencyName}
                // Aunque no usamos 'plan' visualmente aquí, ya lo recibimos para que no de error
                onNavigate={() => setOpen(false)}
                className="py-0"
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
