'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@casalvi/ui"
import { Button } from "@casalvi/ui"
import { Input } from "@casalvi/ui"
import { Label } from "@casalvi/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@casalvi/ui"
import { updatePreferences } from '@/app/actions/preferences'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, Target } from 'lucide-react'

export function BuyerPreferencesCard({ contactId, initialPrefs }: { contactId: string, initialPrefs: any }) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  // Estado local (si initialPrefs es null, usamos valores por defecto)
  const [formData, setFormData] = useState({
    minPrice: initialPrefs?.min_price || '',
    maxPrice: initialPrefs?.max_price || '',
    minBedrooms: initialPrefs?.min_bedrooms || '',
    zones: initialPrefs?.zones ? initialPrefs.zones.join(', ') : '',
    propertyType: initialPrefs?.property_type || 'apartment',
    financialStatus: initialPrefs?.financial_status || 'studying'
  })

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    const result = await updatePreferences(contactId, formData)
    
    if ('error' in result && result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Preferencias Actualizadas', description: 'El algoritmo de matching se ha recalibrado.' })
    }
    setLoading(false)
  }

  return (
    <Card className="border-blue-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-[#0062CC]">
          <Target className="h-5 w-5" />
          Perfil de Búsqueda (Cupido)
        </CardTitle>
        <CardDescription>
          Define qué busca este cliente para que el sistema encuentre pisos compatibles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Presupuesto Máx (€)</Label>
            <Input 
              type="number" 
              placeholder="Ej: 300000" 
              value={formData.maxPrice}
              onChange={(e) => handleChange('maxPrice', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Habitaciones Mín.</Label>
            <Input 
              type="number" 
              placeholder="Ej: 2" 
              value={formData.minBedrooms}
              onChange={(e) => handleChange('minBedrooms', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Zonas (separadas por coma)</Label>
          <Input 
            placeholder="Centro, Norte, Playa..." 
            value={formData.zones}
            onChange={(e) => handleChange('zones', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
             <Label>Tipo</Label>
             <Select value={formData.propertyType} onValueChange={(v) => handleChange('propertyType', v)}>
               <SelectTrigger><SelectValue /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="apartment">Piso / Apartamento</SelectItem>
                 <SelectItem value="house">Casa / Chalet</SelectItem>
                 <SelectItem value="office">Oficina</SelectItem>
                 <SelectItem value="land">Terreno</SelectItem>
               </SelectContent>
             </Select>
          </div>
          <div className="space-y-2">
             <Label>Estado Financiero</Label>
             <Select value={formData.financialStatus} onValueChange={(v) => handleChange('financialStatus', v)}>
               <SelectTrigger><SelectValue /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="studying">🔍 Estudiando</SelectItem>
                 <SelectItem value="needs_loan">🏦 Necesita Hipoteca</SelectItem>
                 <SelectItem value="approved">✅ Pre-aprobado</SelectItem>
                 <SelectItem value="cash">💰 Contado (Cash)</SelectItem>
               </SelectContent>
             </Select>
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full bg-[#007AFF] hover:bg-[#0062CC]">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Guardar Preferencias
        </Button>

      </CardContent>
    </Card>
  )
}

