'use client'

import { useState } from 'react'
import { Button } from "@/components/ui"
import { Label } from "@/components/ui"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { createActivity } from '@/app/actions/activities'
import { Textarea } from "@/components/ui"
import { VoiceRecorder } from '@/components/ui/voice-recorder'
import { Input } from "@/components/ui"
import {
   Phone, Users, MessageCircle, StickyNote, Calendar,
   CheckCircle2, XCircle, HelpCircle, ArrowRight, DollarSign
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useToast } from '@/hooks/use-toast'
import { MentionTextarea } from '@/components/ui/mention-textarea'
import { useRouter } from 'next/navigation'

interface NewActivityFormProps {
   contactId: string
   contactName?: string
   onSuccess?: () => void
   defaultChannel?: string
}

// CONFIGURACIÓN DE OUTCOMES POR CANAL
const OUTCOME_OPTIONS: Record<string, { id: string; label: string; icon: any; color: string }[]> = {
   call: [
      { id: 'answered_interested', label: 'Interesado', icon: CheckCircle2, color: 'bg-green-100 text-green-700 border-green-200' },
      { id: 'callback_scheduled', label: 'Llamar luego', icon: Calendar, color: 'bg-blue-100 text-[#0062CC] border-blue-200' },
      { id: 'no_answer', label: 'No contesta', icon: HelpCircle, color: 'bg-orange-100 text-orange-700 border-orange-200' },
      { id: 'answered_not_interested', label: 'No interesado', icon: XCircle, color: 'bg-slate-100 text-slate-700 border-slate-200' },
   ],
   visit: [
      { id: 'liked_offer', label: 'Le encaja (Oferta)', icon: DollarSign, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      { id: 'liked_price_high', label: 'Gusta pero caro', icon: ArrowRight, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      { id: 'disliked_property', label: 'No le gusta', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' },
   ],
   // Default para otros canales
   default: [
      { id: 'positive', label: 'Positivo', icon: CheckCircle2, color: 'bg-green-50 text-green-700' },
      { id: 'neutral', label: 'Neutro', icon: HelpCircle, color: 'bg-slate-50 text-slate-700' },
      { id: 'negative', label: 'Negativo', icon: XCircle, color: 'bg-red-50 text-red-700' },
   ]
}

export function NewActivityForm({ contactId, contactName = 'Contacto', onSuccess, defaultChannel = 'call' }: NewActivityFormProps) {
   const shouldSkipToStep2 = defaultChannel && defaultChannel !== 'call' && defaultChannel !== 'note'
   const [step, setStep] = useState<1 | 2>(shouldSkipToStep2 ? 2 : 1)
   const [loading, setLoading] = useState(false)
   const [channel, setChannel] = useState(defaultChannel)
   const [outcome, setOutcome] = useState<string | null>(null)
   const [propertyId, setPropertyId] = useState<string | null>(null)
   const [content, setContent] = useState('')
   const [scheduledAt, setScheduledAt] = useState('')
   const { toast } = useToast()
   const router = useRouter()

   const outcomes = OUTCOME_OPTIONS[channel] || OUTCOME_OPTIONS.default

   async function handleSubmit(e: React.FormEvent) {
      e.preventDefault()
      if (!outcome && channel !== 'note') {
         toast({ title: "Falta el resultado", description: "Debes seleccionar qué pasó en la interacción.", variant: "destructive" })
         return
      }

      setLoading(true)

      let scheduledAtString = null
      if (scheduledAt) scheduledAtString = new Date(scheduledAt).toISOString()

      const finalOutcome = outcome || (channel === 'note' ? 'neutral' : null)

      const result = await createActivity(
         contactId,
         content || `Registro rápido: ${channel} - ${finalOutcome}`,
         channel,
         scheduledAtString,
         propertyId,
         finalOutcome
      )

      if ('error' in result && result.error) {
         toast({ title: "Error", description: result.error, variant: "destructive" })
      } else {
         toast({ title: "Actividad Registrada", description: "El sistema ha actualizado el estado del contacto.", className: "bg-green-50" })
         setContent('')
         setChannel('call')
         setOutcome(null)
         setScheduledAt('')
         setStep(1)
         router.refresh()
         if (onSuccess) onSuccess()
      }
      setLoading(false)
   }

   if (step === 1) {
      return (
         <Card className="border-none shadow-none">
            <CardContent className="p-0 space-y-4">
               <div className="grid grid-cols-4 gap-2">
                  {[
                     { id: 'call', icon: Phone, label: 'Llamada' },
                     { id: 'visit', icon: Users, label: 'Visita' },
                     { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp' },
                     { id: 'note', icon: StickyNote, label: 'Nota' },
                  ].map((c) => (
                     <button
                        key={c.id}
                        type="button"
                        onClick={() => { setChannel(c.id); setOutcome(null); }}
                        className={cn(
                           "flex flex-col items-center justify-center p-2 rounded-lg border transition-all h-16",
                           channel === c.id
                              ? "bg-blue-50 border-blue-500 text-[#0062CC] shadow-sm"
                              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        )}
                     >
                        <c.icon className="h-5 w-5 mb-1" />
                        <span className="text-[10px] font-medium">{c.label}</span>
                     </button>
                  ))}
               </div>

               {channel !== 'note' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                     <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">¿Cuál fue el resultado?</Label>
                     <div className="grid grid-cols-2 gap-2">
                        {outcomes.map((o) => (
                           <button
                              key={o.id}
                              type="button"
                              onClick={() => { setOutcome(o.id); setStep(2); }}
                              className={cn(
                                 "flex items-center gap-2 p-3 rounded-lg border text-left transition-all",
                                 outcome === o.id ? "ring-2 ring-blue-500 ring-offset-1" : "",
                                 o.color
                              )}
                           >
                              <o.icon className="h-4 w-4 shrink-0" />
                              <span className="text-xs font-medium">{o.label}</span>
                           </button>
                        ))}
                     </div>
                  </div>
               )}

               {channel === 'note' && (
                  <Button onClick={() => setStep(2)} className="w-full bg-[#007AFF]">Continuar a Escribir</Button>
               )}
            </CardContent>
         </Card>
      )
   }

   return (
      <>
         <Card className="border-none shadow-none animate-in slide-in-from-right-4">
            <CardContent className="p-0 space-y-4">

               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                     <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="h-6 w-6 p-0 rounded-full">
                        <ArrowRight className="h-4 w-4 rotate-180" />
                     </Button>
                     <span className="text-sm font-medium">Detalles de la {channel === 'call' ? 'Llamada' : 'Actividad'}</span>
                  </div>
                  {outcome && <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-md">{outcome}</span>}
               </div>

               <div className="space-y-3">
                  <Label htmlFor="content">Notas (Opcional si usas dictado)</Label>
                  <div className="relative">
                     <MentionTextarea
                        id="content"
                        mode="property"
                        placeholder="Detalles clave... (usa @ para vincular una propiedad)"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onMentionSelect={(id, label) => {
                           setPropertyId(id)
                           toast({ title: "Propiedad vinculada", description: `Se ha vinculado: ${label}` })
                        }}
                        className="min-h-[80px] pr-10"
                     />
                     <div className="absolute bottom-2 right-2">
                        <VoiceRecorder onTranscriptionComplete={(text) => setContent(prev => prev + '\n' + text)} />
                     </div>
                  </div>
               </div>

               <div className="space-y-2 pt-2 border-t">
                  <Label className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                     <Calendar className="h-3 w-3" /> Siguiente Paso (Agenda)
                  </Label>
                  <Input
                     type="datetime-local"
                     value={scheduledAt}
                     onChange={(e) => setScheduledAt(e.target.value)}
                     className="h-9 text-sm"
                  />
               </div>

               <Button onClick={handleSubmit} disabled={loading} className="w-full bg-[#007AFF] hover:bg-[#0062CC]">
                  {loading ? 'Guardando...' : 'Confirmar Actividad'}
               </Button>

            </CardContent>
         </Card>
      </>
   )
}
