import { openai } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'

// Interface para el retorno de la estrategia de farming
export interface FarmingStrategyResult {
    strategy?: string
    isCached?: boolean
    error?: string
}

/**
 * Genera una estrategia de farming basada en IA
 * @param contactId - ID del contacto
 * @param currentStatus - Estado actual de farming
 * @param forceRefresh - Si es true, ignora el caché y regenera
 */
export async function generateFarmingStrategy(
    contactId: string,
    currentStatus: string,
    forceRefresh: boolean = false
): Promise<FarmingStrategyResult> {
    const supabase = await createClient()

    // 1. Verificación de caché
    if (!forceRefresh) {
        const { data } = await supabase
            .from('contacts')
            .select('ai_farming_strategy')
            .eq('id', contactId)
            .single()

        if (data?.ai_farming_strategy) {
            return { strategy: data.ai_farming_strategy, isCached: true }
        }
    }

    // 2. Obtener contexto del contacto
    const { data: contact } = await supabase
        .from('contacts')
        .select('first_name, last_name, farming_status, street, notes')
        .eq('id', contactId)
        .single()

    if (!contact) return { error: 'Contacto no encontrado' }

    // 3. Construir Prompt
    const prompt = `
    Actúa como experto en captación inmobiliaria (Farming).
    El contacto ${contact.first_name} está en fase "${currentStatus || contact.farming_status || 'not_started'}".
    Dirección: ${contact.street || 'Desconocida'}.
    Notas: ${contact.notes || 'Sin notas'}.

    Dame una estrategia de 3 pasos cortos y accionables para avanzar a la siguiente fase.
    Tono: Profesional y directo. Máximo 50 palabras.
  `

    try {
        // 4. Llamada a OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'Eres un experto en captación inmobiliaria (farming). Proporciona estrategias breves y accionables.'
                },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 150
        })

        const strategyText = completion.choices[0].message.content || 'No se pudo generar estrategia'

        // 5. Guardar en DB
        await supabase
            .from('contacts')
            .update({
                ai_farming_strategy: strategyText,
                updated_at: new Date().toISOString()
            })
            .eq('id', contactId)

        return { strategy: strategyText, isCached: false }

    } catch (error) {
        console.error('Error generando estrategia de farming:', error)
        return { error: 'Error generando estrategia' }
    }
}
