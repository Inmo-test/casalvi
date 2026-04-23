'use client'

import { useState, useRef, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@casalvi/ui"
import { Button } from "@casalvi/ui"
import { Badge } from "@casalvi/ui"
import { Mic, Loader2, Square, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { processVoiceData } from '@/app/actions/voice'
import { createContact, findContactByName } from '@/app/actions/contacts'
import { createActivity } from '@/app/actions/activities'
import { useVoiceContext as useOldVoiceContext } from '@/context/voice-context'
import { useVoiceContext, getContextDescription } from '@/hooks/use-voice-context'
import { conversationManager } from '@/lib/voice-conversation-manager'
import { executeVoiceEntities } from '@/app/actions/voice-execution'
import { cn } from '@/lib/cn'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@casalvi/ui"
import { useDashboardContext } from '@/context/dashboard-context'
import type { VoiceEntity } from '@/lib/services/ai/analysis'
import { useI18n } from '@/lib/i18n/I18nContext'

const getSupportedMimeType = () => {
  if (typeof window === 'undefined') return 'audio/webm'
  const types = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/aac', 'audio/webm']
  for (const type of types) { if (MediaRecorder.isTypeSupported(type)) return type }
  return 'audio/webm'
}

interface FloatingVoiceRecorderProps {
  canUseAI: boolean
}

export function FloatingVoiceRecorder({ canUseAI }: FloatingVoiceRecorderProps) {
  const { t } = useI18n()
  const [isMounted, setIsMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  // MEJORA UX: Simplificado a solo 3 estados (idle, recording, processing)
  const [voiceState, setVoiceState] = useState<'idle' | 'recording' | 'processing'>('idle')
  const { toast } = useToast()
  const { currentContext } = useOldVoiceContext()
  const voiceContext = useVoiceContext() // NEW: Siri de Casalvi context
  const { isSidebarCollapsed } = useDashboardContext()

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const mimeTypeRef = useRef<string>('')

  // Legacy dialogs
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false)
  const [candidates, setCandidates] = useState<any[]>([])
  const [pendingActivityData, setPendingActivityData] = useState<any>(null)

  // NEW: Siri de Casalvi state
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [pendingEntities, setPendingEntities] = useState<VoiceEntity[]>([])
  const [pendingSummary, setPendingSummary] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  // NEW: Disambiguation state
  const [disambiguationDialogOpen, setDisambiguationDialogOpen] = useState(false)
  const [ambiguousContacts, setAmbiguousContacts] = useState<Array<{
    mentionedName: string
    candidates: Array<{ id: string, name: string, role: string, phone?: string | null }>
  }>>([])
  const [disambiguationSelections, setDisambiguationSelections] = useState<Record<string, string>>({})

  // Get user ID on mount (using CLIENT supabase, not server)
  useEffect(() => {
    const getUserId = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUserId()
  }, [])

  useEffect(() => {
    setIsMounted(true)
    // Detectar si estamos en desktop
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768) // md breakpoint
    }
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const handleOpenEvent = () => {
      setIsOpen(true)
    }

    window.addEventListener('open-voice-assistant' as any, handleOpenEvent)
    return () => window.removeEventListener('open-voice-assistant' as any, handleOpenEvent)
  }, [canUseAI, toast, isMounted])

  // MEJORA UX: Al abrir el drawer, NO inicia grabación automáticamente
  // El usuario debe hacer click en el botón para empezar
  useEffect(() => {
    if (!isOpen) {
      stopRecording()
      setVoiceState('idle')
    }
    return () => stopRecording()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // MEJORA UX: Toggle de grabación (Click = Inicia, Click de nuevo = Detiene y Procesa)
  const handleToggleRecording = async () => {
    if (voiceState === 'idle') {
      // Iniciar grabación
      await startRecording()
    } else if (voiceState === 'recording') {
      // Detener grabación y procesar automáticamente
      stopRecording()
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = getSupportedMimeType()
      mimeTypeRef.current = mimeType
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        if (chunksRef.current.length > 0) await processAudio()
      }

      mediaRecorder.start()
      setVoiceState('recording')
    } catch (err) {
      console.error(err)
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        toast({
          title: t.voice.mic_permission_title,
          description: t.voice.mic_permission_desc,
          variant: "destructive"
        })
      } else {
        toast({ title: t.voice.mic_error_title, description: t.voice.mic_error_desc, variant: "destructive" })
      }
      setIsOpen(false)
      setVoiceState('idle')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const processAudio = async () => {
    setVoiceState('processing')
    try {
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current })
      const ext = mimeTypeRef.current.includes('mp4') ? '.mp4' : '.webm'
      const file = new File([blob], `recording${ext}`, { type: mimeTypeRef.current })

      const formData = new FormData()
      formData.append('file', file)

      const clientContext = {
        locale: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        localTime: new Date().toISOString()
      }

      // Merge current context with client context
      const enrichedContext = {
        ...(currentContext || {}),
        clientContext
      }

      const result = await processVoiceData(
        formData,
        JSON.stringify(enrichedContext)
      )

      if (result.error || !result.data) {
        throw new Error(result.error || t.voice.not_understood)
      }

      const { intent, summary, entities, needsConfirmation, needsDisambiguation, ambiguousContacts: ambiguous } = result.data

      // PRIORITY 1: Disambiguation (if multiple candidates exist)
      if (needsDisambiguation && ambiguous && ambiguous.length > 0) {
        setPendingEntities(entities || [])
        setPendingSummary(summary)
        setAmbiguousContacts(ambiguous)
        setDisambiguationDialogOpen(true)
        setVoiceState('idle')
        return
      }

      // NEW: Multi-entity path
      if (entities && entities.length > 0) {
        if (needsConfirmation) {
          // Show confirmation dialog
          setPendingEntities(entities)
          setPendingSummary(summary || `${entities.length} ${t.voice.actions_detected}`)
          setConfirmationDialogOpen(true)
          setVoiceState('idle')
        } else {
          // Execute directly (single entity)
          await executeEntities(entities)
          toast({
            title: `✅ ${t.voice.success_exclamation}`,
            description: summary,
            className: "bg-green-50 border-green-200"
          })
          setTimeout(() => {
            setIsOpen(false)
            setVoiceState('idle')
          }, 2000)
        }
        return
      }

      // If we reach here, something unexpected happened
      console.warn('Unexpected voice command response:', result.data)
      toast({
        title: `✅ ${t.voice.processed}`,
        description: summary || t.voice.completed,
        className: "bg-green-50 border-green-200"
      })

      setTimeout(() => {
        setIsOpen(false)
        setVoiceState('idle')
      }, 2000)

    } catch (error: any) {
      toast({
        title: t.common.error,
        description: error.message || String(error),
        variant: "destructive"
      })
      setVoiceState('idle')
    }
  }

  // === STEP 4: Helper Functions (NEW) ===

  // Execute voice entities batch
  const executeEntities = async (entities: VoiceEntity[]) => {
    if (!userId) {
      toast({ title: t.common.error, description: t.voice.unauthorized, variant: "destructive" })
      return
    }

    setVoiceState('processing')
    const result = await executeVoiceEntities(entities)
    setVoiceState('idle')

    if (!result.success) {
      toast({ title: t.common.error, description: result.error || "Error", variant: "destructive" })
    }
  }

  // Handle confirmation dialog - user accepts multi-entity operation
  const handleConfirmEntities = async () => {
    setConfirmationDialogOpen(false)
    await executeEntities(pendingEntities)
    toast({
      title: `✅ ${t.voice.success_exclamation}`,
      description: `${pendingEntities.length} ${t.voice.completed}`, // Simplified for now
      className: "bg-green-50 border-green-200"
    })
    setPendingEntities([])
    setPendingSummary('')
    setTimeout(() => setIsOpen(false), 2000)
  }

  // Handle cancel confirmation
  const handleCancelEntities = () => {
    setConfirmationDialogOpen(false)
    setPendingEntities([])
    setPendingSummary('')
    setVoiceState('idle')
    toast({ title: `❌ ${t.voice.cancelled}` })
  }

  // NEW: Disambiguation handlers
  const handleConfirmDisambiguation = async () => {
    const missingSelections = ambiguousContacts.filter(ac => !disambiguationSelections[ac.mentionedName])
    if (missingSelections.length > 0) {
      toast({
        title: t.voice.incomplete_selection,
        description: `${missingSelections.map(m => m.mentionedName).join(', ')}`,
        variant: "destructive"
      })
      return
    }

    // Update entities with selections
    const updatedEntities = pendingEntities.map(entity => {
      if (entity.type === 'contact' && entity.action === 'create') {
        const selection = disambiguationSelections[entity.data.firstName || '']
        if (selection === 'new') return entity
        if (selection) {
          return { type: 'contact' as const, action: 'update' as const, data: { contactId: selection, changes: entity.data } }
        }
      }
      return entity
    })

    setDisambiguationDialogOpen(false)
    await executeEntities(updatedEntities)
    toast({ title: `✅ ${t.voice.success_exclamation}`, description: pendingSummary, className: "bg-green-50 border-green-200" })
    setAmbiguousContacts([])
    setDisambiguationSelections({})
    setTimeout(() => setIsOpen(false), 2000)
  }

  const handleCancelDisambiguation = () => {
    setDisambiguationDialogOpen(false)
    setAmbiguousContacts([])
    setDisambiguationSelections({})
    setPendingEntities([])
    setVoiceState('idle')
    toast({
      title: t.common.cancel,
      description: t.voice.cancelled,
      variant: "default"
    })
  }

  const handleCreateContact = async (data: any) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, val]) => { if (val) formData.append(key, String(val)) })
    const res = await createContact(formData)
    if ('error' in res && res.error) throw new Error(res.error)
    if (!('success' in res) || !res.success) throw new Error('Failed to create contact')
  }

  const handleLogActivityRequest = async (data: any): Promise<boolean> => {
    // 🚀 OPTIMIZACIÓN: Si la IA ya nos da el ID, lo usamos directo.
    if (data.contactId) {
      console.log("⚡ Usando Contact ID directo de la IA:", data.contactId)
      await createActivity(
        data.contactId,
        data.summary || 'Nota de voz',
        data.type || 'note',
        data.date || null,
        data.propertyId || null
      )
      return true
    }

    // --- Lógica de Respaldo (Solo si no hay ID) ---
    if (!data.contactName && data.type !== 'note') throw new Error(t.voice.tell_me_name)
    if (!data.contactName) throw new Error(t.voice.tell_me_name)

    const search = await findContactByName(data.contactName)
    if (!('success' in search) || !search.success || !('data' in search) || !search.data || search.data.length === 0) {
      throw new Error(`No encuentro a ${data.contactName}`) // Hardcoded with variable, generic error better? Or use t.common.error? Leaving as user string for now
    }

    if (search.data.length === 1) {
      await createActivity(search.data[0].id, data.summary || 'Voz', data.type || 'note', data.date || null, data.propertyId || null)
      return true
    } else {
      // Múltiples coincidencias: Mostrar candidatos
      setCandidates(search.data)
      setPendingActivityData(data)
      setConflictDialogOpen(true)
      return false
    }
  }

  const handleSelectCandidate = async (contact: any) => {
    try {
      await createActivity(contact.id, pendingActivityData.summary, pendingActivityData.type, pendingActivityData.date, pendingActivityData.propertyId)
      setConflictDialogOpen(false)
      setIsOpen(false)
      toast({ title: `✅ ${t.voice.success_exclamation}`, description: `Con ${contact.first_name}` })
    } catch (e) {
      toast({ title: t.common.error, description: String(e), variant: "destructive" })
    } finally {
      setPendingActivityData(null)
      setCandidates([])
    }
  }

  if (!isMounted) return null
  // if (!canUseAI) return null  <-- REMOVED to allow Dialogs to render

  // Componente común del contenido de la grabadora (reutilizable en móvil y desktop)
  const VoiceRecorderContent = () => (
    <div className="flex flex-col items-center space-y-6 md:space-y-5 w-full px-6 md:px-0">

      {/* STEP 6: Context hint (shows available commands based on page) */}
      {voiceState === 'idle' && voiceContext.type !== 'unknown' && (
        <div className="text-center">
          <Badge variant="outline" className="text-xs font-normal bg-blue-50 text-blue-700 border-blue-200">
            💡 {getContextDescription(voiceContext)}
          </Badge>
        </div>
      )}

      {/* Texto dinámico según estado */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl md:text-xl font-medium tracking-tight text-foreground">
          {voiceState === 'idle' && t.voice.ready}
          {voiceState === 'recording' && t.voice.recording}
          {voiceState === 'processing' && t.voice.processing}
        </h3>
        <p className="text-muted-foreground text-sm">
          {voiceState === 'idle' && t.voice.click_start}
          {voiceState === 'recording' && t.voice.click_stop}
          {voiceState === 'processing' && t.voice.thinking}
        </p>
      </div>

      {/* Botón clickeable que cambia según estado */}
      <button
        onClick={handleToggleRecording}
        disabled={voiceState === 'processing'}
        className={cn(
          "relative group cursor-pointer transition-all duration-300",
          voiceState === 'processing' && "cursor-wait opacity-50"
        )}
      >
        {/* Ondas rojas solo cuando está grabando */}
        {voiceState === 'recording' && (
          <>
            <div className="absolute inset-0 rounded-full bg-red-500/40 animate-ping duration-[1000ms]" />
            <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping delay-300 duration-[1000ms]" />
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping delay-600 duration-[1000ms]" />
          </>
        )}

        <div className={cn(
          "relative flex items-center justify-center w-24 h-24 md:w-20 md:h-20 rounded-full shadow-2xl transition-all duration-500",
          voiceState === 'idle' && "bg-primary hover:bg-primary/90 hover:scale-110 shadow-primary/30",
          voiceState === 'recording' && "bg-red-600 scale-110 animate-pulse shadow-red-600/40",
          voiceState === 'processing' && "bg-gradient-to-tr from-emerald-500 to-teal-500"
        )}>
          {voiceState === 'idle' && <Mic className="w-10 h-10 md:w-8 md:h-8 text-white" />}
          {voiceState === 'recording' && <Square className="w-8 h-8 md:w-6 md:h-6 text-white fill-white" />}
          {voiceState === 'processing' && <Loader2 className="w-10 h-10 md:w-8 md:h-8 text-white animate-spin" />}
        </div>
      </button>

      {/* Botón cancelar: Visible en móvil, oculto en desktop (ya tenemos X) */}
      <Button
        variant="ghost"
        className="text-muted-foreground hover:text-destructive md:hidden"
        onClick={() => setIsOpen(false)}
      >
        {t.common.cancel}
      </Button>
    </div>
  )

  return (
    <>
      {/* RENDERIZAR GRABADORA SOLO SI TIENE PERMISO (canUseAI) */}
      {canUseAI && (
        <>
          {/* BIFURCACIÓN: RENDERIZADO MÓVIL vs DESKTOP */}
          {!isDesktop ? (
            // === MÓVIL: Sheet Shadcn (Bottom Sheet) ===
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetContent
                side="bottom"
                className={cn(
                  "rounded-t-[2rem] border-t-0 p-0 h-[50vh] max-h-[500px]",
                  "flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl"
                )}
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Voz</SheetTitle>
                  <SheetDescription>Grabar</SheetDescription>
                </SheetHeader>

                {/* Handle visual: Solo en móvil */}
                <div className="absolute top-4 w-12 h-1.5 bg-muted rounded-full opacity-50" />

                <VoiceRecorderContent />
              </SheetContent>
            </Sheet>
          ) : (
            // === DESKTOP: Widget Flotante Simple (Sin Sheet) ===
            <>
              {isOpen && (
                <div
                  className={cn(
                    "fixed bottom-8 z-[100] w-[340px]",
                    isSidebarCollapsed ? "left-[90px]" : "left-72", // Dynamic adjustment
                    "bg-popover shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border/50",
                    "rounded-[2rem] rounded-bl-[4px]", // Tail points to sidebar (left)
                    "p-6",
                    "animate-in slide-in-from-left-10 fade-in duration-300 ease-out",
                    "flex flex-col items-center transition-all duration-300"
                  )}
                >
                  {/* Botón cerrar flotante */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="absolute top-3 right-3 h-8 w-8 rounded-full hover:bg-muted/50 text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <VoiceRecorderContent />
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* --- DIALOGOS SIEMPRE RENDERIZADOS (Para poder abrirlos aunque no tenga permiso) --- */}

      <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.voice.who_referring}</DialogTitle>
            <DialogDescription>
              {candidates.length} {t.voice.found_similar}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
            {candidates.map(c => (
              <Button key={c.id} variant="outline" className="justify-start h-auto py-3" onClick={() => handleSelectCandidate(c)}>
                <div className="text-left">
                  <div className="font-medium">{c.first_name} {c.last_name || ''}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {c.role === 'buyer' ? t.dashboard.contacts.role_buyer : t.dashboard.contacts.role_owner}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* NEW: Confirmation Dialog for Multi-Entity */}
      <Dialog open={confirmationDialogOpen} onOpenChange={setConfirmationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              {t.voice.confirm_actions}
            </DialogTitle>
            <DialogDescription>
              {pendingSummary}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {pendingEntities.map((entity, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 border rounded-lg bg-gray-50">
                {entity.action === 'create' && <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />}
                {entity.action === 'update' && <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                <div className="flex-1 text-sm">
                  <div className="font-medium capitalize">
                    {entity.action === 'create' ? t.voice.create : t.voice.update} {entity.type}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {entity.type === 'contact' && (
                      <span>{entity.data.firstName} {entity.data.lastName || ''} ({entity.data.role})</span>
                    )}
                    {entity.type === 'activity' && (
                      <span>{entity.data.activityType}: {entity.data.details?.substring(0, 50)}...</span>
                    )}
                    {entity.type === 'property' && (
                      <span>{entity.data.address}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancelEntities}
            >
              {t.common.cancel}
            </Button>
            <Button
              className="flex-1 bg-[#007AFF] hover:bg-[#0062CC]"
              onClick={handleConfirmEntities}
            >
              {t.common.confirm} {pendingEntities.length} acciones
            </Button>
          </div>
        </DialogContent>
      </Dialog >
    </>
  )
}
