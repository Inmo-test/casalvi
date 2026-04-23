'use server'

import { openai } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'
import { getMyAgency } from '@/app/actions/team'

export async function transcribeAudio(formData: FormData) {
  const supabase = await createClient()

  try {
    // 1. Verificar Usuario
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'No autenticado' }
    }

    // 2. Obtener Agencia
    const { agency } = await getMyAgency()
    if (!agency) {
      return { error: 'No se encontró la agencia' }
    }

    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return { error: 'No se proporcionó archivo de audio' }
    }

    if (!process.env.OPENAI_API_KEY) {
      return { error: 'OpenAI API key no configurada' }
    }

    // Transcribir audio con Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'es', // Español
      response_format: 'text',
    })

    if (!transcription || typeof transcription !== 'string') {
      return { error: 'No se pudo transcribir el audio' }
    }

    return { success: true, text: transcription }
  } catch (error) {
    console.error('Error transcribing audio:', error)
    
    if (error instanceof Error) {
      return { error: `Error al transcribir: ${error.message}` }
    }
    
    return { error: 'Error desconocido al transcribir el audio' }
  }
}

