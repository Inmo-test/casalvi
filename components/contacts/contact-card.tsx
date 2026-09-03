import { Phone, Mail, MessageCircle, UserCircle, MoreVertical, Eye } from 'lucide-react'
import { cn } from '@/lib/cn'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface ContactCardProps {
  id: string
  firstName: string
  lastName?: string | null
  email?: string | null
  phone?: string | null
  role?: 'buyer' | 'seller' | 'owner' | null
  conversion_probability?: number | null
  life_stage?: string | null
  className?: string
}

const roleConfig = {
  buyer: {
    label: 'Comprador',
    color: 'bg-blue-100 text-[#0062CC] dark:bg-blue-900/30 dark:text-blue-400',
  },
  seller: {
    label: 'Vendedor',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  owner: {
    label: 'Propietario',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
}

export function ContactCard({
  id,
  firstName,
  lastName,
  email,
  phone,
  role,
  conversion_probability,
  life_stage,
  className,
}: ContactCardProps) {
  const fullName = `${firstName} ${lastName || ''}`.trim()
  const initials = `${firstName[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  const roleInfo = role ? roleConfig[role] : null

  // Generate avatar color based on name
  const avatarColors = [
    'bg-gradient-to-br from-primary/20 to-primary/30',
    'bg-gradient-to-br from-emerald-500/20 to-emerald-600/30',
    'bg-gradient-to-br from-violet-500/20 to-violet-600/30',
    'bg-gradient-to-br from-amber-500/20 to-amber-600/30',
  ]
  const colorIndex = (firstName.charCodeAt(0) || 0) % avatarColors.length
  const avatarColor = avatarColors[colorIndex]

  return (
    <Link href={`/dashboard/contacts/${id}`} className="block h-full group">
      <div
        className={cn(
          'relative overflow-hidden h-full flex flex-col',
          'bg-card rounded-xl border shadow-sm',
          'hover:shadow-md hover:border-primary/20',
          'transition-all duration-200',
          'active:scale-[0.98]',
          className
        )}
      >
        <div className="flex items-start gap-4 p-4 flex-1">
          {/* Avatar */}
          <div
            className={cn(
              'relative flex-shrink-0',
              'h-12 w-12 rounded-full',
              'flex items-center justify-center',
              'font-medium text-primary',
              avatarColor
            )}
          >
            {initials || <UserCircle className="h-6 w-6" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-base truncate group-hover:text-primary transition-colors">
                  {fullName}
                </h3>
                {conversion_probability !== null && conversion_probability !== undefined && conversion_probability > 70 && (
                  <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                    🔥 {conversion_probability}%
                  </span>
                )}
              </div>

              {/* Mobile Actions Menu (Always visible on touch, accessible) */}
              <div onClick={(e) => e.preventDefault()} className="ml-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Acciones</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/contacts/${id}`} className="flex items-center cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" /> Ver ficha
                      </Link>
                    </DropdownMenuItem>
                    {phone && (
                      <DropdownMenuItem asChild>
                        <a href={`tel:${phone}`} className="flex items-center cursor-pointer">
                          <Phone className="mr-2 h-4 w-4" /> Llamar
                        </a>
                      </DropdownMenuItem>
                    )}
                    {phone && (
                      <DropdownMenuItem asChild>
                        <a href={`https://wa.me/${phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer">
                          <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                        </a>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Info Row */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {email && (
                <span className="flex items-center gap-1 truncate">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{email}</span>
                </span>
              )}
              {phone && !email && (
                <span className="flex items-center gap-1 truncate">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{phone}</span>
                </span>
              )}
            </div>

            {/* Badges Row */}
            <div className="flex items-center gap-2 mt-2">
              {roleInfo && (
                <span
                  className={cn(
                    'text-xs px-2 py-1 rounded-full font-medium',
                    roleInfo.color
                  )}
                >
                  {roleInfo.label}
                </span>
              )}
              {life_stage && (
                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium capitalize">
                  {life_stage}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Hover Effect Border */}
        <div className="absolute inset-0 rounded-xl border-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
    </Link>
  )
}
