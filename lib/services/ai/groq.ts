import Groq from 'groq-sdk'
import { logAiUsage } from './usage-logger'

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
})

export async function transcribeAudioWithGroq(file: File): Promise<string | null> {
    try {
        console.log('🎙️ Enviando audio a Groq (Whisper V3)...')
        const transcription = await groq.audio.transcriptions.create({
            file: file,
            model: 'whisper-large-v3',
            language: 'es', // Forzamos español para mejorar precisión
            temperature: 0,
            // Usamos verbose_json para obtener la duración exacta para el tracking de costes
            response_format: 'verbose_json',
        })

        if (transcription) {
            // @ts-ignore - Groq types might not infer verbose_json duration automatically
            const duration = transcription.duration || 0

            // Log audio usage (seconds)
            logAiUsage({
                provider: 'groq',
                model: 'whisper-large-v3',
                input_tokens: duration, // We map duration to input_tokens for calculating cost
                output_tokens: 0,
                feature_context: 'audio_transcription'
            })
        }

        console.log('✅ Transcripción Groq completada')
        return transcription.text
    } catch (error) {
        console.error('🔥 Error en Groq Whisper:', error)
        return null
    }
}
