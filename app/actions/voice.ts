'use server'

import { processVoiceCommand, transcribeAudio, VoiceCommandResponse } from '@/lib/services/ai/analysis'
import { createClient } from '@/lib/supabase/server'
import { getMyAgency } from '@/app/actions/team'
import { revalidatePath } from 'next/cache'

export async function processVoiceData(
  formData: FormData, 
  currentContextString?: string
) {
  const supabase = await createClient()

  // 1. Autenticación y Agencia
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { agency } = await getMyAgency()
  if (!agency) return { error: 'No se encontró la agencia' }

  // 2. Obtener el archivo de audio
  const file = formData.get('file') as File
  if (!file) return { error: 'No se recibió audio' }

  // Parsear contexto
  let context = null
  if (currentContextString) {
    try {
      context = JSON.parse(currentContextString)
    } catch (e) {
      console.log('Error parsing context', e)
    }
  }

  // 4. Transcribir
  const transcribedText = await transcribeAudio(file)
  if (!transcribedText) {
    return { error: 'No se pudo entender el audio.' }
  }

  // 5. Analizar CON AGENCY ID (CRUCIAL PARA SEARCH-FIRST)
  // Aquí pasamos agency.id para que la IA pueda buscar en la BD
  const result: VoiceCommandResponse = await processVoiceCommand(transcribedText, context, agency.id)

  // 6. Ejecutar Acciones en BD (Opcional: Si quieres que el Server Action guarde directamente)
  // Por ahora devolvemos la intención al frontend para que decida o confirme,
  // pero la inteligencia ya viene con los IDs correctos.

  revalidatePath('/dashboard')
  
  return { success: true, data: result, transcript: transcribedText }
}

