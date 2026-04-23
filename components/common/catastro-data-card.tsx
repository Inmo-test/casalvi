'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@casalvi/ui"
import { Badge } from "@casalvi/ui"
import { Building2, Calendar, Ruler, FileText } from 'lucide-react'

interface CatastroDataCardProps {
  cadastralReference?: string | null
  surfaceM2?: number | null
  yearBuilt?: number | null
  usageType?: string | null
  estimatedMarketValue?: number | null
  lastValuationDate?: string | null
}

export function CatastroDataCard({
  cadastralReference,
  surfaceM2,
  yearBuilt,
  usageType,
  estimatedMarketValue,
  lastValuationDate,
}: CatastroDataCardProps) {
  const hasData = cadastralReference || surfaceM2 || yearBuilt || usageType

  if (!hasData) {
    return null
  }

  return (
    <Card className="border-blue-100 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-900">
          <Building2 className="h-4 w-4" />
          Datos Catastrales
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Referencia Catastral */}
        {cadastralReference && (
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-[#007AFF] mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Referencia Catastral</p>
              <p className="text-sm font-mono font-medium text-blue-900">{cadastralReference}</p>
            </div>
          </div>
        )}

        {/* Superficie */}
        {surfaceM2 && (
          <div className="flex items-start gap-2">
            <Ruler className="h-4 w-4 text-[#007AFF] mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Superficie Construida</p>
              <p className="text-sm font-medium text-blue-900">{surfaceM2.toLocaleString('es-ES')} m²</p>
            </div>
          </div>
        )}

        {/* Año de construcción */}
        {yearBuilt && (
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-[#007AFF] mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Año de Construcción</p>
              <p className="text-sm font-medium text-blue-900">{yearBuilt}</p>
            </div>
          </div>
        )}

        {/* Uso */}
        {usageType && (
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 text-[#007AFF] mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Uso</p>
              <Badge variant="outline" className="bg-blue-100 text-[#0062CC] border-blue-200 text-xs">
                {usageType}
              </Badge>
            </div>
          </div>
        )}

        {/* Valoración estimada */}
        {estimatedMarketValue && (
          <div className="pt-2 border-t border-blue-200">
            <p className="text-xs text-muted-foreground mb-1">Valoración Estimada</p>
            <p className="text-lg font-black text-blue-900">
              {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(estimatedMarketValue)}
            </p>
            {lastValuationDate && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Actualizado: {new Date(lastValuationDate).toLocaleDateString('es-ES')}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


