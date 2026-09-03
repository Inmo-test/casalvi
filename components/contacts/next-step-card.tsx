'use client'

import { Card, CardContent } from "@/components/ui"
import { Button } from "@/components/ui"
import { Badge } from "@/components/ui"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui"
import { Lightbulb, ArrowRight, Phone, MessageCircle, Mail, Clock } from 'lucide-react'
import { cn } from '@/lib/cn'
import { predictNextStep } from '@/app/actions/ai/predictive'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { NewActivityForm } from '@/components/contacts/new-activity-form'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface NextStepCardProps {
  contact: any
}

export function NextStepCard({ contact }: NextStepCardProps) {
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const prediction = contact.ai_prediction // Leemos de la base de datos
  const leadScore = contact.lead_score || 50 // Score del contacto (0-100)

  const handleRefresh = async () => {
    setLoading(true)
    await predictNextStep(contact.id)
    setLoading(false)
    router.refresh() // Forzar refresh de la página para actualizar datos
  }

  const handleExecute = () => {
    setDialogOpen(true)
  }

  const handleActivitySuccess = async () => {
    setDialogOpen(false)

    // Mostrar toast de feedback
    toast({
      title: "Actividad registrada",
      description: "Recalculando siguiente paso...",
      className: "bg-blue-50 dark:bg-blue-950/20"
    })

    // Recargar predicción
    setRecalculating(true)
    await predictNextStep(contact.id)
    setRecalculating(false)

    // Refresh de la página para mostrar datos actualizados
    router.refresh()
  }

  // Función para obtener color del score
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // Función para obtener color del badge del score
  const getScoreBadgeColor = (score: number) => {
    if (score >= 70) return 'bg-green-100 text-green-700 border-green-200'
    if (score >= 40) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-red-100 text-red-700 border-red-200'
  }

  if (!prediction && !loading) {
    return (
      <Button variant="ghost" size="sm" onClick={handleRefresh} className="w-full border border-dashed text-muted-foreground">
        <Lightbulb className="w-4 h-4 mr-2" /> Analizar siguiente paso
      </Button>
    )
  }

  const urgencyColor = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-blue-50 text-[#0062CC] border-blue-100'
  }[prediction?.urgency as string] || 'bg-slate-100'

  const ChannelIcon = {
    call: Phone,
    whatsapp: MessageCircle,
    email: Mail,
    wait: Clock
  }[prediction?.suggested_channel as string] || Lightbulb

  const canExecute = prediction?.suggested_channel && prediction.suggested_channel !== 'wait'

  return (
    <>
      <Card className={cn("border-l-4 shadow-sm animate-in fade-in slide-in-from-top-2",
        prediction?.urgency === 'high' ? 'border-l-red-500 bg-red-50/10' : 'border-l-blue-500 bg-blue-50/10'
      )}>
        <CardContent className="p-4 flex items-center justify-between gap-4">

          {/* Icono + Texto Principal */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0 mt-1",
              prediction?.urgency === 'high' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-[#007AFF]'
            )}>
              {(loading || recalculating) ? <Loader2 className="h-5 w-5 animate-spin" /> : <ChannelIcon className="h-5 w-5" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-medium text-sm text-foreground">
                  {(loading || recalculating) ? 'Analizando...' : prediction?.next_best_action || 'Generando estrategia...'}
                </h3>
                {!loading && !recalculating && prediction && (
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border-0 h-5", urgencyColor)}>
                    {prediction.urgency === 'high' ? 'PRIORITARIO' : 'Sugerencia'}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {(loading || recalculating) ? 'Consultando historial de interacciones...' : prediction?.reasoning}
              </p>
            </div>
          </div>

          {/* Score Badge (Esquina derecha) */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Badge circular con score */}
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-full border-2 font-medium text-xs",
              getScoreBadgeColor(leadScore)
            )}>
              {leadScore}
            </div>

            {/* Barra de progreso pequeña */}
            <div className="w-12 relative h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all rounded-full", getScoreColor(leadScore))}
                style={{ width: `${leadScore}%` }}
              />
            </div>
          </div>

          {/* Botón de Acción (Si no es 'wait') */}
          {!loading && !recalculating && canExecute && (
            <Button
              size="sm"
              onClick={handleExecute}
              className={cn(
                "hidden md:flex bg-[#007AFF] hover:bg-[#0062CC] shadow-sm shrink-0",
                prediction.suggested_channel === 'call' && "bg-green-600 hover:bg-green-700"
              )}
            >
              {prediction.suggested_channel === 'call' ? (
                <>📞 Llamar Ahora</>
              ) : (
                <>Ejecutar <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Dialog para ejecutar la acción */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {prediction?.suggested_channel === 'call' && '📞 Llamar Ahora'}
              {prediction?.suggested_channel === 'whatsapp' && '💬 Enviar WhatsApp'}
              {prediction?.suggested_channel === 'email' && '📧 Enviar Email'}
              {!['call', 'whatsapp', 'email'].includes(prediction?.suggested_channel || '') && 'Registrar Actividad'}
            </DialogTitle>
            <DialogDescription>
              {prediction?.next_best_action || 'Completa los detalles de la interacción'}
            </DialogDescription>
          </DialogHeader>

          {/* Formulario con channel pre-seleccionado */}
          <div className="mt-4">
            <NewActivityForm
              contactId={contact.id}
              defaultChannel={prediction?.suggested_channel || 'call'}
              onSuccess={handleActivitySuccess}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}


