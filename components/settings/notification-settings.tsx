'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Label } from "@/components/ui"
import { RadioGroup, RadioGroupItem } from "@/components/ui"
import { Button } from "@/components/ui"
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { updateAgencySettings } from '@/app/actions/agency-settings'
import { useToast } from '@/hooks/use-toast'

export function NotificationSettings({ initialSetting, agencyId }: { initialSetting: string, agencyId: string }) {
  const [setting, setSetting] = useState(initialSetting || 'manual')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setLoading(true)

    // Llamada a la server action
    const result = await updateAgencySettings(agencyId, { settings_notifications: setting })

    if ('error' in result && result.error) {
      toast({ title: 'Error', description: 'No se pudo guardar la configuración.', variant: 'destructive' })
    } else {
      toast({ title: 'Guardado', description: 'Preferencia de notificaciones actualizada.' })
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-[#007AFF]" />
          Notificaciones al Cliente
        </CardTitle>
        <CardDescription>
          ¿Quieres enviar emails de confirmación automáticamente cuando agendes una visita?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={setting} onValueChange={setSetting} className="grid gap-4">

          <div className="flex items-start space-x-3 space-y-0">
            <RadioGroupItem value="auto" id="auto" className="mt-1" />
            <div className="grid gap-1.5">
              <Label htmlFor="auto" className="font-medium cursor-pointer">
                Automático (Piloto Automático)
              </Label>
              <p className="text-sm text-muted-foreground">
                Se enviará un email al cliente siempre, sin preguntarte. Ideal para velocidad.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 space-y-0">
            <RadioGroupItem value="manual" id="manual" className="mt-1" />
            <div className="grid gap-1.5">
              <Label htmlFor="manual" className="font-medium cursor-pointer">
                Manual / Confirmar (Recomendado)
              </Label>
              <p className="text-sm text-muted-foreground">
                Te mostraremos una casilla &quot;Enviar Email&quot; al crear la cita. Tú decides en cada caso.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 space-y-0">
            <RadioGroupItem value="off" id="off" className="mt-1" />
            <div className="grid gap-1.5">
              <Label htmlFor="off" className="font-medium cursor-pointer">
                Desactivado
              </Label>
              <p className="text-sm text-muted-foreground">
                No se enviarán emails nunca. Solo se guarda en tu agenda.
              </p>
            </div>
          </div>

        </RadioGroup>

        <Button onClick={handleSave} disabled={loading} className="bg-[#007AFF] hover:bg-[#0062CC]">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
          Guardar Configuración
        </Button>
      </CardContent>
    </Card>
  )
}

