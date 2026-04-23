'use server'

import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { revalidatePath } from 'next/cache'
import { callDeepSeek } from '@/lib/ai/deepseek'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.replace(/\n/g, ' '),
  })
  return response.data[0].embedding
}

export async function calculateWinProbability(contactId: string, forceRefresh: boolean = false) {
  const supabase = await createClient()

  const { data: contact, error: fetchError } = await supabase
    .from('contacts')
    .select(`*, ai_analysis_cache, activities(*)`)
    .eq('id', contactId)
    .single()

  if (fetchError || !contact) {
    return { error: 'Error al cargar contacto' }
  }

  if (!forceRefresh && contact.ai_analysis_cache && Object.keys(contact.ai_analysis_cache).length > 0) {
    return { ...contact.ai_analysis_cache, source: 'cache' }
  }

  const isOwner = contact.role === 'seller' || contact.role === 'owner'

  const systemPrompt = 'Eres un experto analista inmobiliario.'
  const userPrompt = isOwner
    ? `Analiza PROPIETARIO. Datos: ${contact.activities?.length || 0} interacciones. Notas: ${contact.notes || 'Sin notas'}.
JSON: { "score": 0-100, "reason": "string", "next_best_action": "string", "sentiment": "neutral" }`
    : `Analiza COMPRADOR. Presupuesto: ${contact.budget_max || 'No definido'}. Datos: ${contact.activities?.length || 0} interacciones. Notas: ${contact.notes || 'Sin notas'}.
JSON: { "score": 0-100, "reason": "string", "next_best_action": "string", "sentiment": "neutral" }`

  try {
    const responseText = await callDeepSeek(systemPrompt, userPrompt, {
      model: 'deepseek-reasoner',
      responseFormat: 'json_object',
    })

    const analysis = JSON.parse(responseText || '{}')
    analysis.last_calculated = new Date().toISOString()

    await supabase.from('contacts').update({
      ai_analysis_cache: analysis,
      ai_last_updated: new Date().toISOString(),
      conversion_probability: analysis.score,
      ai_summary: analysis.reason,
    }).eq('id', contactId)

    revalidatePath(`/dashboard/contacts/${contactId}`)
    return { ...analysis, source: 'live' }
  } catch (error) {
    console.error('Error calculateWinProbability:', error)
    return { error: 'Error analizando contacto' }
  }
}

export async function findSmartMatches(contactId: string) {
  const supabase = await createClient()

  const { data: contact } = await supabase
    .from('contacts')
    .select('requirements, notes, embedding_preferences, budget_max, min_bedrooms, zones')
    .eq('id', contactId)
    .single()

  if (!contact) return []

  let embedding = contact.embedding_preferences
  if (!embedding) {
    const requirements = contact.requirements || ''
    const notes = contact.notes || ''
    const textProfile = `Busca: ${requirements}. Notas: ${notes}`
    embedding = await generateEmbedding(textProfile)
    await supabase.from('contacts').update({ embedding_preferences: embedding }).eq('id', contactId)
  }

  const { data: matches, error } = await supabase.rpc('match_properties', {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: 5,
  })

  if (error) {
    console.error('Error en búsqueda vectorial:', error)
    return []
  }

  return matches || []
}

export async function askConsultant(context: string, question: string) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'Eres un mentor inmobiliario senior. Das consejos breves, legales y tácticos.' },
        { role: 'user', content: `Contexto: ${context}. Pregunta: ${question}` },
      ],
      model: 'gpt-4o-mini',
    })
    return completion.choices[0].message.content
  } catch (e) {
    console.error('Error askConsultant:', e)
    return 'Lo siento, no puedo procesar tu consulta ahora.'
  }
}

export async function getFarmingAdvice(contactId: string) {
  const supabase = await createClient()

  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single()

  if (!contact) return 'No se encontró el contacto.'

  const missingPhone = !contact.phone
  const missingEmail = !contact.email

  const prompt = `
    Eres un coach inmobiliario experto en 'Farming' y puerta fría.
    Tengo un contacto: ${contact.first_name}.
    Datos: ${missingPhone ? 'NO tengo teléfono' : 'Tengo teléfono'}. ${missingEmail ? 'NO tengo email' : 'Tengo email'}.
    Notas: ${contact.notes || 'Ninguna'}.
    Dame 3 consejos tácticos muy breves para avanzar con este prospecto hoy.
    Formato: solo texto plano, 3 puntos clave.
  `

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'Eres un mentor de ventas empático.' },
        { role: 'user', content: prompt },
      ],
      model: 'gpt-4o-mini',
    })
    return completion.choices[0].message.content
  } catch (e) {
    console.error('Error getFarmingAdvice:', e)
    return 'Analiza el perfil y busca puntos en común antes de llamar.'
  }
}

export async function analyzeActivityIntention(content: string, type: string) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un analista psicométrico inmobiliario. Detecta el estado real del lead.
          Responde en JSON:
          {
            "urgency": number (1-10),
            "intent": "vender" | "comprar" | "curiosidad" | "desconocido",
            "sentiment": number (-1 a 1),
            "is_noise": boolean,
            "tags": string[]
          }`,
        },
        { role: 'user', content: `Tipo de actividad: ${type}. Contenido: "${content}"` },
      ],
      response_format: { type: 'json_object' },
    })

    return JSON.parse(response.choices[0].message.content || '{}')
  } catch (error) {
    console.error('Error analyzeActivityIntention:', error)
    return null
  }
}
