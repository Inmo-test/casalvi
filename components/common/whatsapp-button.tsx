'use client'

import { MessageCircle } from 'lucide-react'
import { Button } from "@/components/ui"
import { getWhatsAppUrl } from '@/lib/utils/whatsapp'
import { cn } from '@/lib/cn'

interface WhatsAppButtonProps {
  phone: string | null | undefined
  compact?: boolean
  className?: string
}

export function WhatsAppButton({ phone, compact = false, className }: WhatsAppButtonProps) {
  const whatsappUrl = getWhatsAppUrl(phone)

  // Si no hay teléfono o URL válida, no renderizar nada
  if (!whatsappUrl) {
    return null
  }

  // Variante compacta: solo icono
  if (compact) {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'inline-flex items-center justify-center rounded-md',
          'bg-green-500 hover:bg-green-600 text-white',
          'h-7 w-7 transition-colors',
          className
        )}
        aria-label="Abrir WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
      </a>
    )
  }

  // Variante completa: icono + texto
  return (
    <Button
      asChild
      className={cn('bg-green-500 hover:bg-green-600 text-white', className)}
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2"
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </a>
    </Button>
  )
}


