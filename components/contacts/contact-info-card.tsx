import { Card, CardContent, CardHeader, CardTitle } from "@casalvi/ui"
import { Badge } from "@casalvi/ui"
import { Button } from "@casalvi/ui" // <--- Asegurar import
import { Mail, Phone, Building, User, TrendingUp, MapPin, Home, Key } from 'lucide-react'
import { WhatsAppButton } from '@/components/common/whatsapp-button'
import Link from 'next/link' // <--- Asegurar import
import { CatastroDataCard } from '@/components/common/catastro-data-card'

type Contact = {
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  company: string | null
  role: string | null
  street: string | null
  street_number: string | null
  floor: string | null
  door: string | null
  farming_status: string | null
  life_stage: string | null
  conversion_probability: number | null
  notes: string | null
  created_at: string
  address_lat?: number | null
  address_lng?: number | null
  cadastral_reference?: string | null
  surface_m2?: number | null
  year_built?: number | null
  usage_type?: string | null
  estimated_market_value?: number | null
  last_valuation_date?: string | null
}

interface ContactInfoCardProps {
  contact: Contact
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

export function ContactInfoCard({ contact }: ContactInfoCardProps) {
  const fullName = `${contact.first_name} ${contact.last_name || ''}`.trim()
  const stageConfig = getLifeStageConfig(contact.life_stage)
  
  // Formatear dirección
  const formatAddress = () => {
    const parts = []
    if (contact.street) {
      parts.push(`C/ ${contact.street}`)
    }
    if (contact.street_number) {
      parts.push(contact.street_number)
    }
    const floorDoor = []
    if (contact.floor) floorDoor.push(`${contact.floor}º`)
    if (contact.door) floorDoor.push(contact.door)
    if (floorDoor.length > 0) {
      parts.push(floorDoor.join(''))
    }
    return parts.join(', ')
  }

  const fullAddress = formatAddress()

  return (
    <div className="space-y-4">
      {/* Información Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-2xl">{fullName}</CardTitle>
                {contact.role && (
                  <Badge 
                    variant={contact.role === 'owner' ? 'default' : 'secondary'}
                    className={contact.role === 'owner' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'}
                  >
                    {contact.role === 'owner' ? '🏠 Propietario' : '🔍 Comprador'}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Contacto creado el {new Date(contact.created_at).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email */}
          {contact.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a
                href={`mailto:${contact.email}`}
                className="text-sm hover:underline"
              >
                {contact.email}
              </a>
            </div>
          )}

          {/* Teléfono */}
          {contact.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${contact.phone}`}
                  className="text-sm hover:underline"
                >
                  {contact.phone}
                </a>
                <WhatsAppButton phone={contact.phone} />
              </div>
            </div>
          )}

          {/* Dirección */}
          {fullAddress && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">{fullAddress}</p>
                {contact.farming_status && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    {contact.farming_status === 'in_progress' && '🌱 En Farming'}
                    {contact.farming_status === 'converted' && '✅ Convertido'}
                    {contact.farming_status === 'lost' && '❌ Perdido'}
                    {contact.farming_status === 'not_started' && '⏸️ Sin Iniciar'}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Empresa */}
          {contact.company && (
            <div className="flex items-center gap-3">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{contact.company}</span>
            </div>
          )}

          {/* Notas */}
          {contact.notes && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Notas:</p>
              <p className="text-sm">{contact.notes}</p>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Etapa Vital */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Etapa Vital
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={stageConfig.variant} className={stageConfig.className}>
            {stageConfig.label}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            Actualizado automáticamente por IA basado en las interacciones
          </p>
        </CardContent>
      </Card>

      {/* Datos Catastrales (solo para propietarios) */}
      {contact.role === 'owner' && (
        <CatastroDataCard
          cadastralReference={contact.cadastral_reference}
          surfaceM2={contact.surface_m2}
          yearBuilt={contact.year_built}
          usageType={contact.usage_type}
          estimatedMarketValue={contact.estimated_market_value}
          lastValuationDate={contact.last_valuation_date}
        />
      )}
    </div>
  )
}
