'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@casalvi/ui"
import { Badge } from "@casalvi/ui"
import { Progress } from "@casalvi/ui"
import { Phone } from 'lucide-react'
import { ContactActions } from './contact-actions'
import { ContactOwnerBadge } from './contact-owner-badge'
import { WhatsAppButton } from '@/components/common/whatsapp-button'
import { createClient } from '@/lib/supabase/client'

type Buyer = {
  id: string
  first_name: string
  last_name: string | null
  phone: string | null
  budget_max: number | null
  min_bedrooms: number | null
  preferred_zones: string[] | null
  financial_status: string | null
  conversion_probability: number | null
  user_id: string
}

interface BuyersTableProps {
  buyers: Buyer[]
}

function formatBudget(budget: number | null) {
  if (!budget) return 'Sin límite'
  if (budget >= 1000000) return `${(budget / 1000000).toFixed(1)}M€`
  if (budget >= 1000) return `${(budget / 1000).toFixed(0)}k€`
  return `${budget}€`
}

function formatDemand(bedrooms: number | null, preferred_zones: string[] | null) {
  const parts = []
  if (bedrooms) parts.push(`${bedrooms} Hab`)
  if (preferred_zones && preferred_zones.length > 0) {
    const zonesText = preferred_zones.slice(0, 2).map(z => z.charAt(0).toUpperCase() + z.slice(1)).join(', ')
    parts.push(zonesText)
  }
  return parts.join(' • ') || '-'
}

function getFinancialBadge(status: string | null) {
  if (!status) {
    return <Badge variant="outline">Sin Info</Badge>
  }
  
  const configs: Record<string, { label: string; className: string }> = {
    approved: {
      label: '✅ Aprobado',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
    studying: {
      label: '⏳ Pendiente',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    },
    negative: {
      label: '❌ Rechazado',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    },
  }
  
  const config = configs[status] || { label: 'Sin Info', className: '' }
  return <Badge variant="secondary" className={config.className}>{config.label}</Badge>
}

export function BuyersTable({ buyers }: BuyersTableProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    async function loadCurrentUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    loadCurrentUser()
  }, [])

  if (buyers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <span className="text-4xl">🔍</span>
        </div>
        <h3 className="text-lg font-medium mb-2">No hay compradores todavía</h3>
        <p className="text-muted-foreground max-w-sm">
          Añade compradores y la IA extraerá automáticamente sus preferencias
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Dueño</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Presupuesto</TableHead>
            <TableHead>Demanda</TableHead>
            <TableHead>Viabilidad</TableHead>
            <TableHead>Probabilidad</TableHead>
            <TableHead className="w-[50px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {buyers.map((buyer) => {
            const fullName = `${buyer.first_name} ${buyer.last_name || ''}`.trim()

            return (
              <TableRow key={buyer.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <ContactOwnerBadge userId={buyer.user_id} currentUserId={currentUserId} />
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/contacts/${buyer.id}`} className="block">
                    {fullName}
                  </Link>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {buyer.phone ? (
                    <div className="flex items-center gap-2">
                      <a 
                        href={`tel:${buyer.phone}`}
                        className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {buyer.phone}
                      </a>
                      <WhatsAppButton phone={buyer.phone} compact />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/contacts/${buyer.id}`} className="block">
                    <span className="text-sm">
                      Hasta {formatBudget(buyer.budget_max)}
                    </span>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/contacts/${buyer.id}`} className="block">
                    <span className="text-sm text-muted-foreground">
                      {formatDemand(buyer.min_bedrooms, buyer.preferred_zones)}
                    </span>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/contacts/${buyer.id}`} className="block">
                    {getFinancialBadge(buyer.financial_status)}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/contacts/${buyer.id}`} className="block">
                    {buyer.conversion_probability !== null ? (
                      <div className="flex items-center gap-2">
                        <Progress value={buyer.conversion_probability} className="h-2 w-20" />
                        <span className="text-sm font-medium text-muted-foreground w-10 text-right">
                          {buyer.conversion_probability}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </Link>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <ContactActions contact={buyer} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

