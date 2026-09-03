'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui"
import { Mic, Square, Trash2, Send, Play, Pause, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void
  isProcessing?: boolean
  className?: string
}

export function VoiceRecorder({ onRecordingComplete, isProcessing = false, className }: VoiceRecorderProps) {
  // Estados de la grabadora
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs para lógica interna
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [audioUrl])

  // Formatear tiempo (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // INICIAR GRABACIÓN
  const startRecording = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Preferir formatos ligeros pero compatibles con Whisper
      let mimeType = 'audio/webm'
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4' // Safari support
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        setIsRecording(false)
        setIsPaused(false)
        
        // Detener tracks del stream para apagar el icono de mic del navegador
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      
      // Iniciar timer
      setRecordingTime(0)
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Error accediendo al micrófono:', err)
      setError('No se pudo acceder al micrófono. Verifica los permisos.')
    }
  }

  // DETENER GRABACIÓN
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  // CANCELAR / BORRAR
  const resetRecording = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
    setIsRecording(false)
    setIsPlaying(false)
    setError(null)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  // REPRODUCIR / PAUSAR PREVIEW
  const togglePlayback = () => {
    if (!audioPlayerRef.current || !audioUrl) return

    if (isPlaying) {
      audioPlayerRef.current.pause()
      setIsPlaying(false)
    } else {
      audioPlayerRef.current.play()
      setIsPlaying(true)
    }
  }

  // ENVIAR
  const handleSend = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob)
    }
  }

  return (
    <div className={cn("flex flex-col items-center gap-4 p-4 rounded-xl border bg-card shadow-sm transition-all", className)}>
      
      {/* Elemento de audio oculto para reproducción */}
      <audio 
        ref={audioPlayerRef} 
        src={audioUrl || ''} 
        onEnded={() => setIsPlaying(false)} 
        className="hidden" 
      />

      {/* --- ESTADO 1: ERROR --- */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-2 rounded w-full justify-center">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* --- ESTADO 2: GRABANDO --- */}
      {isRecording && (
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="font-mono text-xl font-medium tabular-nums text-red-600">
              {formatTime(recordingTime)}
            </span>
          </div>
          
          <div className="text-xs text-muted-foreground animate-pulse">
            Escuchando... Di los detalles de la propiedad o visita.
          </div>
          <Button 
            variant="destructive" 
            size="lg" 
            className="rounded-full h-16 w-16 shadow-lg hover:scale-105 transition-transform"
            onClick={stopRecording}
          >
            <Square className="h-6 w-6 fill-current" />
          </Button>
        </div>
      )}

      {/* --- ESTADO 3: REVISIÓN (Grabación terminada) --- */}
      {!isRecording && audioBlob && (
        <div className="flex flex-col items-center gap-4 w-full animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between w-full bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-background shadow-sm hover:bg-accent"
                onClick={togglePlayback}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
              </Button>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nota de Voz</span>
                <span className="font-mono text-sm">{formatTime(recordingTime)}</span>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-destructive"
              onClick={resetRecording}
              disabled={isProcessing}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>

          <Button 
            className="w-full bg-gradient-to-r from-[#007AFF] to-violet-600 hover:from-[#0062CC] hover:to-violet-700 text-white shadow-md" 
            size="lg"
            onClick={handleSend}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Procesando IA...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Procesar con IA
              </>
            )}
          </Button>
        </div>
      )}

      {/* --- ESTADO 4: IDLE (Inicial) --- */}
      {!isRecording && !audioBlob && (
        <div className="flex flex-col items-center gap-2">
          <Button 
            variant="outline" 
            size="lg" 
            className="rounded-full h-20 w-20 border-2 border-dashed border-blue-200 hover:border-blue-500 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950/30 transition-all group"
            onClick={startRecording}
          >
            <Mic className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform" />
          </Button>
          <p className="text-sm font-medium text-muted-foreground text-center max-w-[200px]">
            Toca para grabar una nueva propiedad, contacto o visita
          </p>
        </div>
      )}
    </div>
  )
}

