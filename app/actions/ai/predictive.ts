'use server'

import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai'
import { revalidatePath } from 'next/cache'

// Definimos la estructura de la respuesta de IA
export interface PredictionResult {
  next_best_action: string // "Esperar", "Llamar ya", "Enviar ficha"
  reasoning: string       // "Llevas 3 intentos fallidos, cambia de canal"
  urgency: 'high' | 'medium' | 'low'
  suggested_channel: 'call' | 'whatsapp' | 'email' | 'wait'
  lead_score?: number     // <--- NUEVO: Puntaje calculado (0-100)
}

/**
 * Calcula el Lead Score basado en los outcomes de las actividades recientes
 * @param activities - Array de actividades con outcomes
 * @returns Puntaje entre 0 y 100
 */
function calculateLeadScore(activities: Array<{ outcome: string | null }>): number {
  // Base de 50 puntos
  let score = 50

  // Recorrer actividades y sumar/restar puntos según outcome
  for (const activity of activities) {
    const outcome = activity.outcome

    if (!outcome) continue

    // Positivos (suman puntos)
    switch (outcome) {
      case 'meeting_scheduled':
      case 'visit_scheduled': // Variante para visitas agendadas
        score += 20
        break
      case 'liked_offer':
      case 'liked_property': // Variante genérica
        score += 15
        break
      case 'liked_price_high': // Le gusta pero precio alto (aún es positivo)
        score += 10
        break
      case 'answered_interested':
        score += 10
        break
      case 'callback_scheduled': // Llamada agendada es positivo
        score += 8
        break
      case 'positive':
        score += 5
        break
      case 'signed':
        score += 25
        break
      case 'negotiating':
        score += 15
        break
    }

    // Negativos (restan puntos)
    switch (outcome) {
      case 'no_answer':
        score -= 2
        break
      case 'negative':
        score -= 5
        break
      case 'answered_not_interested':
        score -= 10
        break
      case 'disliked_property':
        score -= 8
        break
      case 'disliked_zone':
        score -= 8
        break
      case 'discarded':
        score -= 15
        break
      case 'rejected':
        score -= 20
        break
    }
  }

  // Aplicar límites: Min 0, Max 100
  return Math.max(0, Math.min(100, score))
}

export async function predictNextStep(contactId: string) {
  const supabase = await createClient()

  // 1. Obtener Historial Reciente (Estructurado)
  // No necesitamos el 'raw_content' (texto largo), solo el TIPO y el RESULTADO. Ahorro brutal de tokens.
  const { data: activities } = await supabase
    .from('activities')
    .select('type, channel, outcome, created_at')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(10) // Solo los últimos 10 movimientos importan

  const { data: contact } = await supabase
    .from('contacts')
    .select('role, first_name, farming_status')
    .eq('id', contactId)
    .single()

  if (!activities || !contact) return { error: 'Datos insuficientes' }

  // 1.5. CALCULAR LEAD SCORE (Antes de la IA, basado en datos objetivos)
  const leadScore = calculateLeadScore(activities)

  // 2. Construir el Prompt de Secuencia (Sintético)
  // Transformamos los datos en una "historia" que la IA entienda
  const historyLog = activities.map(a => 
    `- [${new Date(a.created_at).toLocaleDateString('es-ES')}] ${a.channel.toUpperCase()}: Resultado "${a.outcome || 'desconocido'}"`
  ).join('\n')

  const prompt = `
    Actúa como Director Comercial Inmobiliario Senior.

    Analiza esta secuencia de interacciones con un ${contact.role} (${contact.first_name}).

    

    HISTORIAL RECIENTE (Del más nuevo al más antiguo):

    ${historyLog}

    

    REGLAS DE NEGOCIO:

    - Si hay >2 llamadas sin respuesta seguidas, sugiere cambiar a WhatsApp o esperar.

    - Si el cliente responde "Interesado" pero no agendamos, la urgencia es ALTA.

    - Si el resultado fue "Negativo/Descartado", sugiere archivar o enfriar.

    

    Tu tarea: Define la "Next Best Action" (Siguiente Mejor Acción).

    Responde SOLO con un JSON válido con este formato:

    {
      "next_best_action": "Acción concreta corta (max 5 palabras)",
      "reasoning": "Explicación táctica (max 15 palabras)",
      "urgency": "high" | "medium" | "low",
      "suggested_channel": "call" | "whatsapp" | "email" | "wait"
    }
  `

  try {
    // 3. Llamada a la IA
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un Director Comercial Inmobiliario Senior. Analiza historiales de contacto y sugiere la siguiente mejor acción. Devuelve SOLO JSON válido sin markdown.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 200
    })

    const rawContent = completion.choices[0].message.content || '{}'
    // Limpieza de markdown si viene
    const cleanedContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim()
    const aiResponse = JSON.parse(cleanedContent)

    const prediction: PredictionResult = {
      next_best_action: aiResponse.next_best_action || 'Analizar situación',
      reasoning: aiResponse.reasoning || 'No hay suficientes datos para recomendar una acción',
      urgency: aiResponse.urgency || 'medium',
      suggested_channel: aiResponse.suggested_channel || 'wait',
      lead_score: leadScore // <--- NUEVO: Incluimos el score calculado
    }

    // 4. Guardar predicción y lead_score en DB (Caché)
    await supabase
      .from('contacts')
      .update({ 
        ai_prediction: prediction, // Guardamos el objeto JSON directo
        lead_score: leadScore, // <--- NUEVO: Guardamos el score en columna dedicada
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId)

    revalidatePath(`/dashboard/contacts/${contactId}`)
    return { success: true, data: prediction }

  } catch (error) {
    console.error('AI Prediction Error:', error)
    
    // Fallback: predicción básica si falla la IA (pero con score calculado)
    const fallbackPrediction: PredictionResult = {
      next_best_action: 'Contactar pronto',
      reasoning: 'Error al analizar. Revisa el historial manualmente.',
      urgency: 'medium',
      suggested_channel: 'wait',
      lead_score: leadScore // <--- NUEVO: Incluimos el score incluso en fallback
    }

    // Guardar score incluso si falla la IA
    await supabase
      .from('contacts')
      .update({ 
        lead_score: leadScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId)
    
    return { success: false, error: 'Error al generar predicción', data: fallbackPrediction }
  }
}

