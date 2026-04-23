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
import { cn } from '@/lib/cn'

type Contact = {
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  life_stage: string | null
  conversion_probability: number | null
  created_at: string
}

interface ContactsTableProps {
  contacts: Contact[]
}

function getLifeStageConfig(stage: string | null) {
  if (!stage) {
    return {
      label: 'Sin analizar',
      variant: 'outline' as const,
      className: 'text-muted-foreground',
    }
  }

  const configs = {
    prospect: {
      label: 'Prospecto',
      variant: 'secondary' as const,
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    },
    lead: {
      label: 'Lead',
      variant: 'default' as const,
      className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    },
    customer: {
      label: 'Cliente',
      variant: 'default' as const,
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
    inactive: {
      label: 'Inactivo',
      variant: 'outline' as const,
      className: 'text-gray-500',
    },
  }

  return configs[stage as keyof typeof configs] || configs.prospect
}

function getProbabilityColor(probability: number | null) {
  if (probability === null) return 'bg-gray-300'
  if (probability >= 75) return 'bg-green-500'
  if (probability >= 50) return 'bg-yellow-500'
  if (probability >= 25) return 'bg-orange-500'
  return 'bg-red-500'
}

export function ContactsTable({ contacts }: ContactsTableProps) {
  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <svg
            className="h-12 w-12 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2">No hay contactos todavía</h3>
        <p className="text-muted-foreground mb-4 max-w-sm">
          Comienza a construir tu red añadiendo tu primer contacto. Haz clic en &quot;Nuevo Contacto&quot; para empezar.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Etapa Vital</TableHead>
            <TableHead>Probabilidad</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => {
            const stageConfig = getLifeStageConfig(contact.life_stage)
            const fullName = `${contact.first_name} ${contact.last_name || ''}`.trim()

            return (
              <TableRow key={contact.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">
                  <Link href={`/dashboard/contacts/${contact.id}`} className="block">
                    {fullName}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/contacts/${contact.id}`} className="block">
                    {contact.email || '-'}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/contacts/${contact.id}`} className="block">
                    {contact.phone || '-'}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/contacts/${contact.id}`} className="block">
                    <Badge variant={stageConfig.variant} className={stageConfig.className}>
                      {stageConfig.label}
                    </Badge>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/contacts/${contact.id}`} className="block">
                    {contact.conversion_probability !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <Progress
                            value={contact.conversion_probability}
                            className={cn('h-2')}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-10 text-right">
                          {contact.conversion_probability}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

