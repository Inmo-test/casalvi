'use client'

import { useState } from 'react'
import { Button } from "@/components/ui"
import { Input } from "@/components/ui"
import { Label } from "@/components/ui"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui"
import { useToast } from '@/hooks/use-toast'
import { Building2, Save, Loader2 } from 'lucide-react'
import { updateAgencyDetails } from '@/app/actions/team'

interface SettingsAgencyCardProps {
  agency: {
    id: string
    name: string
    phone?: string | null
    address?: string | null
    website?: string | null
    email_contact?: string | null
  }
}

export function SettingsAgencyCard({ agency }: SettingsAgencyCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    
    try {
      const result = await updateAgencyDetails(formData)
      
      if ('error' in result && result.error) {
        toast({ variant: "destructive", title: "Error", description: result.error })
      } else {
        toast({ 
          title: "Agencia actualizada", 
          description: "Los datos de la empresa se han guardado.",
          className: "bg-green-50 border-green-200"
        })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Ocurrió un error inesperado" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#007AFF]" />
          <CardTitle>Identidad de la Agencia</CardTitle>
        </div>
        <CardDescription>
          Estos datos aparecerán en tus informes y fichas de propiedades.
        </CardDescription>
      </CardHeader>
      
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="agency-name">Nombre Comercial</Label>
            <Input 
              id="agency-name" 
              name="name" 
              defaultValue={agency.name} 
              placeholder="Ej: Inmobiliaria Casalvi" 
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="agency-phone">Teléfono de Oficina</Label>
              <Input 
                id="agency-phone" 
                name="phone" 
                defaultValue={agency.phone || ''} 
                placeholder="+34 910 000 000" 
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="agency-email">Email de Contacto</Label>
              <Input 
                id="agency-email" 
                name="email_contact" 
                type="email"
                defaultValue={agency.email_contact || ''} 
                placeholder="contacto@inmobiliaria.com" 
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agency-address">Dirección Física</Label>
            <Input 
              id="agency-address" 
              name="address" 
              defaultValue={agency.address || ''} 
              placeholder="Calle Mayor 1, Madrid" 
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agency-website">Sitio Web</Label>
            <Input 
              id="agency-website" 
              name="website" 
              defaultValue={agency.website || ''} 
              placeholder="www.tuinmobiliaria.com" 
            />
          </div>
        </CardContent>
        
        <CardFooter className="border-t px-6 py-4 bg-muted/50 flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

