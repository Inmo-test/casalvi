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

type Owner = {
  id: string
  first_name: string
  last_name: string | null
  phone: string | null
  street: string | null
  street_number: string | null
  floor: string | null
  door: string | null
  farming_status: string | null
  conversion_probability: number | null
  property_occupancy: string | null
  property_lease_end: string | null
  property_competitor_name: string | null
  property_competitor_expiry: string | null
  user_id: string
}

interface OwnersTableProps {
  owners: Owner[]
}

function formatAddress(contact: Owner) {
  const parts = []
  if (contact.street) parts.push(`C/ ${contact.street}`)
  if (contact.street_number) parts.push(contact.street_number)
  const floorDoor = []
  if (contact.floor) floorDoor.push(`${contact.floor}º`)
  if (contact.door) floorDoor.push(contact.door)
  if (floorDoor.length > 0) parts.push(floorDoor.join(''))
  return parts.join(', ') || '-'
}

function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'short'
  })
}

function getOccupancyBadge(owner: Owner) {
  const occupancy = owner.property_occupancy
  
  // No mostrar badge si es unknown o null (limpieza visual)
  if (!occupancy || occupancy === 'unknown') {
    return null
  }
  
  const configs: Record<string, { label: string; className: string }> = {
    vacant: {
      label: 'VACÍO',
      className: 'bg-red-500 text-white hover:bg-red-600',
    },
    rented: {
      label: owner.property_lease_end 
        ? `ALQUILADO (Fin: ${formatDate(owner.property_lease_end)})`
        : 'ALQUILADO',
      className: 'bg-orange-500 text-white hover:bg-orange-600',
    },
    owner: {
      label: 'VIVE PROPIETARIO',
      className: 'bg-blue-500 text-white hover:bg-[#007AFF]',
    },
    competitor: {
      label: 'OTRA AGENCIA',
      className: 'bg-purple-500 text-white hover:bg-purple-600',
    },
  }
  
  const config = configs[occupancy]
  if (!config) {
    return null
  }
  
  return <Badge className={config.className}>{config.label}</Badge>
}

export function OwnersTable({ owners }: OwnersTableProps) {
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

  if (owners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <span className="text-4xl">🏠</span>
        </div>
        <h3 className="text-lg font-medium mb-2">No hay propietarios todavía</h3>
        <p className="text-muted-foreground max-w-sm">
          Comienza tu estrategia de farming añadiendo propietarios de la zona
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
            <TableHead>Dirección</TableHead>
            <TableHead>Situación del Inmueble</TableHead>
            <TableHead>Prob. Venta</TableHead>
            <TableHead className="w-[50px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {owners.map((owner) => {
            const fullName = `${owner.first_name} ${owner.last_name || ''}`.trim()
            const address = formatAddress(owner)

            return (
              <TableRow key={owner.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <ContactOwnerBadge userId={owner.user_id} currentUserId={currentUserId} />
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/contacts/${owner.id}`} className="block">
                    {fullName}
                  </Link>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {owner.phone ? (
                    <div className="flex items-center gap-2">
                      <a 
                        href={`tel:${owner.phone}`}
                        className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {owner.phone}
                      </a>
                      <WhatsAppButton phone={owner.phone} compact />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/contacts/${owner.id}`} className="block">
                    {address}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/contacts/${owner.id}`} className="block">
                    {getOccupancyBadge(owner) || <span className="text-sm text-muted-foreground">-</span>}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/contacts/${owner.id}`} className="block">
                    {owner.conversion_probability !== null ? (
                      <div className="flex items-center gap-2">
                        <Progress value={owner.conversion_probability} className="h-2 w-24" />
                        <span className="text-sm font-medium text-muted-foreground w-10 text-right">
                          {owner.conversion_probability}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </Link>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <ContactActions contact={owner} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

