import { createClient } from '@/lib/supabase/server'

export const AI_PRICING = {
    'gpt-4o-mini': { input: 0.15, output: 0.60 }, // Per 1M tokens
    'gpt-4o': { input: 2.50, output: 10.00 },     // Per 1M tokens (Standard)
    'deepseek-reasoner': { input: 0.55, output: 2.19 }, // Per 1M tokens (Cache miss/hit avg)
    'whisper-large-v3': { input: 0.0001, output: 0 } // Per second (Groq pricing approx)
} as const

type PricingModel = keyof typeof AI_PRICING

interface LogAiUsageParams {
    provider: 'openai' | 'deepseek' | 'groq'
    model: string
    input_tokens: number // Or seconds for audio
    output_tokens: number
    user_id?: string
    agency_id?: string
    feature_context: string
}

export async function logAiUsage(params: LogAiUsageParams) {
    try {
        const supabase = await createClient()

        // 1. Calculate Cost
        let cost = 0
        const pricing = AI_PRICING[params.model as PricingModel]

        if (pricing) {
            if (params.model.includes('whisper')) {
                // Audio pricing (seconds)
                cost = params.input_tokens * pricing.input
            } else {
                // Token pricing (per 1M)
                cost = (params.input_tokens * pricing.input + params.output_tokens * pricing.output) / 1_000_000
            }
        }

        // 2. Get User Context if missing (Opcional, si estamos en contexto de request)
        let userId = params.user_id
        // Si no se pasa user_id, podríamos intentar obtenerlo de la sesión, 
        // pero idealmente quien llama a esta función ya lo tiene.
        if (!userId) {
            const { data: { session } } = await supabase.auth.getSession()
            userId = session?.user?.id
        }

        // 3. Insert Log
        const { error } = await supabase.from('ai_usage_logs').insert({
            provider: params.provider,
            model: params.model,
            input_tokens: params.input_tokens,
            output_tokens: params.output_tokens,
            total_tokens: params.input_tokens + params.output_tokens,
            cost_usd: cost,
            user_id: userId,
            agency_id: params.agency_id, // Si es undefined, se guarda como NULL
            feature_context: params.feature_context
        })

        if (error) {
            console.error('❌ Error logging AI usage:', error)
        } else {
            // console.log(`💰 AI Logged: ${params.model} ($${cost.toFixed(6)})`)
        }

    } catch (err) {
        console.error('❌ Failed to log AI usage:', err)
        // No lanzamos error para no interrumpir el flujo principal del usuario
    }
}
