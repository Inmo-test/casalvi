import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Configuración de OpenAI
// Configuración de OpenAI movida dentro del handler para evitar errores de build
// const openai = new OpenAI(...)

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // 1. Verificar Autenticación (Seguridad)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Initialize OpenAI lazily to allow build without API key
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Recibir el archivo de audio
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validación básica de tamaño (ej: máx 25MB, límite de Whisper)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    console.log(`🎙️ Recibiendo audio: ${file.name} (${file.size} bytes)`)

    // 3. Enviar a OpenAI Whisper
    // Whisper requiere un objeto File-like. 'file' ya lo es gracias a request.formData()
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'es', // Forzamos español para mejorar precisión en nombres/calles
      temperature: 0.2, // Baja temperatura para ser más fiel y menos creativo
    })

    console.log('📝 Transcripción completada:', transcription.text.substring(0, 50) + '...')

    // 4. Devolver el texto
    return NextResponse.json({
      text: transcription.text
    })
  } catch (error) {
    console.error('🔥 Error en transcripción:', error)
    return NextResponse.json(
      { error: 'Error processing audio' },
      { status: 500 }
    )
  }
}

