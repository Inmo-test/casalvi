'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@casalvi/ui"
import { Mic, Square, Loader2 } from 'lucide-react'
import { transcribeAudio } from '@/app/actions/audio'

type RecorderState = 'inactive' | 'recording' | 'processing'

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void
}

export function VoiceRecorder({ onTranscriptionComplete }: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>('inactive')
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Limpiar timer cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      setError(null)
      
      // Solicitar permiso para el micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Crear MediaRecorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Detener todas las pistas del stream
        stream.getTracks().forEach(track => track.stop())

        // Crear blob de audio
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        
        // Procesar transcripción
        setState('processing')
        await processTranscription(audioBlob)
      }

      // Iniciar grabación
      mediaRecorder.start()
      setState('recording')
      setSeconds(0)

      // Iniciar contador
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)

    } catch (err) {
      console.error('Error al acceder al micrófono:', err)
      
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Por favor, permite el acceso al micrófono en tu navegador')
      } else {
        setError('Error al acceder al micrófono. Verifica los permisos.')
      }
      
      setState('inactive')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop()
      
      // Detener timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const processTranscription = async (audioBlob: Blob) => {
    try {
      // Crear FormData con el archivo de audio
      const formData = new FormData()
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' })
      formData.append('audio', audioFile)

      // Llamar a la Server Action
      const result = await transcribeAudio(formData)

      if ('error' in result && result.error) {
        setError(result.error)
        setState('inactive')
      } else if (result.text) {
        onTranscriptionComplete(result.text)
        setState('inactive')
        setSeconds(0)
      }
    } catch (err) {
      console.error('Error al procesar transcripción:', err)
      setError('Error al procesar la transcripción')
      setState('inactive')
    }
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const remainingSecs = secs % 60
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {state === 'inactive' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startRecording}
            className="gap-2"
          >
            <Mic className="h-4 w-4" />
            Grabar Nota de Voz
          </Button>
        )}

        {state === 'recording' && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={stopRecording}
              className="gap-2 animate-pulse"
            >
              <Square className="h-4 w-4" />
              Detener
            </Button>
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-red-100 dark:bg-red-900">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-sm font-mono text-red-700 dark:text-red-300">
                {formatTime(seconds)}
              </span>
            </div>
          </div>
        )}

        {state === 'processing' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            className="gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Transcribiendo con IA...
          </Button>
        )}
      </div>

      {error && (
        <div className="text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}


