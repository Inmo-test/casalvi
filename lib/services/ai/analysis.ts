import { createClient } from '@/lib/supabase/server'
import { askDeepSeek } from './deepseek'
import { transcribeAudioWithGroq } from './groq'

// ==========================================
// 1. EL OÍDO: Transcripción 🎙️
// ==========================================
// ==========================================
// 1. THE EAR: Transcription 🎙️ (GROQ LPU)
// ==========================================
export async function transcribeAudio(file: File) {
  return await transcribeAudioWithGroq(file)
}

// ==========================================
// 2. SEARCH TOOLS (The Eye) 👁️
// ==========================================

// Helper function to extract potential names before processing
async function findPotentialContacts(text: string, agencyId: string) {
  if (!agencyId || !text) return []

  const supabase = await createClient()

  // IMPROVEMENT: Dynamic Stop Words or Minimal filtering
  // For global support, strict stop-word filtering is tricky. 
  // We rely more on length > 3 and fuzzy matching.

  const potentialNames = text
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .split(/\s+/)
    .filter((w: string) => w.length > 3) // Basic length filter

  // Keep top 5 candidates
  const uniqueNames = [...new Set(potentialNames)].slice(0, 5)

  if (uniqueNames.length === 0) return []

  const candidates = []

  // 2. Search each potential name in DB
  for (const name of uniqueNames) {
    const { data } = await supabase.rpc('search_contacts_fuzzy', {
      search_query: name,
      p_agency_id: agencyId,
      match_threshold: 0.4
    })

    if (data) {
      candidates.push(...data)
    }
  }

  // 3. Deduplicate by ID
  const uniqueCandidates = Array.from(new Map(candidates.map((item: any) => [item.id, item])).values())

  return uniqueCandidates.map((c: any) => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name || ''}`.trim(),
    role: c.role,
    phone: c.phone
  }))
}

// ==========================================
// 3. THE BRAIN: Analysis with Memory 🧠
// ==========================================

export type VoiceEntity = {
  type: 'contact' | 'activity' | 'property'
  action: 'create' | 'update'
  data: {
    // Contact fields
    contactId?: string
    firstName?: string
    lastName?: string
    phone?: string
    email?: string
    role?: 'owner' | 'buyer' | 'agent'

    // Activity fields
    activityType?: 'call' | 'visit' | 'meeting' | 'note'
    details?: string
    date?: string
    outcome?: string | null

    // Update fields
    changes?: Record<string, any>

    // Property fields
    address?: string
    price?: number
    zone?: string

    [key: string]: any
  }
}

export type VoiceCommandResponse = {
  intent: 'multi_entity' | 'single_entity' | 'filter_query' | 'unknown'
  summary: string
  entities: VoiceEntity[]
  needsConfirmation: boolean
  needsDisambiguation?: boolean
  ambiguousContacts?: Array<{
    mentionedName: string
    candidates: Array<{
      id: string
      name: string
      role: string
      phone?: string | null
      lastActivity?: string | null
    }>
  }>
  conversationId?: string
  data?: any // Legacy
}

function getSystemPrompt(context?: any, candidates: any[] = [], voiceContext?: any) {
  // Extract client context if available
  const clientContext = context?.clientContext || voiceContext?.clientContext

  let timeString = ""
  if (clientContext?.localTime) {
    timeString = `📅 USER LOCAL TIME: ${clientContext.localTime} (${clientContext.timezone || 'Unknown TZ'})`
  } else {
    const now = new Date()
    timeString = `📅 SERVER TIME (UTC): ${now.toISOString()} (Note: User timezone unknown, assume generic relative time)`
  }

  let dbContext = "No similar contacts found in database."
  if (candidates.length > 0) {
    dbContext = `
⚠️ IMPORTANT - EXISTING CONTACTS DETECTED:
User mentioned names matching these DB records:
${JSON.stringify(candidates, null, 2)}

GOLDEN RULE:
1. If user refers to one of these (e.g. "Call Mario" and Mario is listed), INTENT MUST BE 'log_activity' or 'update_contact' using that ID.
2. NEVER use 'create_contact' if person is in this list, unless user explicitly says "New client" or clarifies it's a different person.
`
  }

  // Capability Context (Translated to English for AI consistency)
  let externalContext = ""
  if (context?.type === 'property') {
    externalContext = `
📍 CURRENT CONTEXT: Viewing PROPERTY ID ${context.id} ${context.name ? `(${context.name})` : ''}.
`
  }

  if (context?.type === 'contact') {
    externalContext = `
👤 CURRENT CONTEXT: Viewing CONTACT ${context.name}.
`
  }

  if (voiceContext?.type === 'contact_list') {
    externalContext = `
📋 CURRENT CONTEXT: CONTACT LIST.
`
  }

  if (voiceContext?.type === 'property_list') {
    externalContext = `
🏠 CURRENT CONTEXT: PROPERTY LIST.
`
  }

  return `
You are the Central AI of a Real Estate CRM. Your job is to structure voice data into actionable entities.

${timeString}
All future dates should be calculated relative to this time.

${externalContext}

${dbContext}

🔄 CRITICAL RULE - MULTI-ENTITY:
If user mentions MULTIPLE people or actions, create an "entities" array with one object per entity.

⚠️ SEPARATION RULE:
"Talked to A and B" -> Two separate activity entities (one for A, one for B).
NEVER create a single activity mentioning both in details if they are separate contacts.

🚫 NO PROPERTY CREATION:
- NEVER create 'property' entities.
- Only 'contact' and 'activity'.
- Ignore address mentions (put them in activity 'details').

OUTPUT LANGUAGE RULE:
- Detect the language of the USER INPUT.
- The 'summary' field MUST be in the SAME LANGUAGE as the user input.
- The 'details' fields in entities MUST be in the SAME LANGUAGE as the user input.

EXAMPLES:
- Input (Spanish): "Conocí a María García propietaria y Juan López comprador"
  Output: entities: [
    { type: 'contact', action: 'create', data: { firstName: 'María', lastName: 'García', role: 'owner' } },
    { type: 'contact', action: 'create', data: { firstName: 'Juan', lastName: 'López', role: 'buyer' } }
  ]

- Input (English): "Call Peter tomorrow"
  Output: entities: [
    { type: 'activity', action: 'create', data: { contactId: '<ID if exists>', activityType: 'call', details: 'Call explicitly requested', date: '<tomorrow iso>' } }
  ]

VALID OUTCOMES:
- 'answered_interested', 'answered_not_interested', 'no_answer', 'callback_scheduled'
- 'liked_offer', 'liked_price_high', 'disliked_zone', 'disliked_property', 'discarded'
- 'positive', 'neutral', 'negative'

JSON RESPONSE FORMAT:
{
  "intent": "multi_entity" | "single_entity",
  "summary": "Executive summary in USER'S LANGUAGE",
  "entities": [ ... ],
  "needsConfirmation": boolean
}

LIMITS:
- Max 10 entities.
- If >3, needsConfirmation: true.
`
}

export async function processVoiceCommand(
  text: string,
  context?: { type: string, id: string, name: string } | null,
  agencyId?: string,
  voiceContext?: any
): Promise<VoiceCommandResponse> {

  if (!text || text.trim().length < 2) {
    return {
      intent: 'unknown',
      summary: 'Empty audio',
      entities: [],
      needsConfirmation: false,
      data: {}
    }
  }

  // 1. PRE-SEARCH (Globalized)
  let candidates: any[] = []
  if (agencyId) {
    try {
      console.log(`🔎 Searching candidates for: "${text.substring(0, 20)}..." in agency ${agencyId}`)
      candidates = await findPotentialContacts(text, agencyId) // Stop words logic adjusted inside
      console.log(`✅ Candidates found: ${candidates.length}`, candidates)
    } catch (err) {
      console.error("⚠️ Error in fuzzy search:", err)
    }
  }

  try {
    const messages = [
      { role: 'system', content: getSystemPrompt(context, candidates, voiceContext) },
      { role: 'user', content: text }
    ]

    const rawContent = await askDeepSeek(messages, 'deepseek-chat', true) || "{}"
    const parsed = JSON.parse(rawContent)

    // =====================================================
    // 🛡️ ENTITIES LOGIC (Same robust logic, just ensured keys match)
    // =====================================================

    let entities: VoiceEntity[] = parsed.entities || []

    // Fallback Legacy
    if (entities.length === 0 && parsed.data && Object.keys(parsed.data).length > 0) {
      const legacyIntent = parsed.intent
      if (legacyIntent === 'create_contact' || legacyIntent === 'new_contact') {
        entities.push({ type: 'contact', action: 'create', data: parsed.data })
      } else if (legacyIntent === 'update_contact') {
        entities.push({ type: 'contact', action: 'update', data: { contactId: parsed.data.contactId, changes: parsed.data.changes } })
      } else if (legacyIntent === 'log_activity' || legacyIntent.includes('call') || legacyIntent.includes('visit')) {
        let type = 'note'
        if (legacyIntent.includes('call')) type = 'call'
        if (legacyIntent.includes('visit')) type = 'visit'

        entities.push({
          type: 'activity',
          action: 'create',
          data: {
            ...parsed.data,
            activityType: parsed.data.type || type
          }
        })
      } else if (legacyIntent === 'create_property') {
        entities.push({ type: 'property', action: 'create', data: parsed.data })
      }
    }

    // =====================================================
    // 🛡️ SAFETY NET & DISAMBIGUATION
    // =====================================================

    const ambiguousContacts: Array<{ mentionedName: string, candidates: any[] }> = []

    entities = entities.map(entity => {
      // Logic remains the same: check matches against 'candidates'
      if (entity.type === 'contact' && entity.action === 'create') {
        const newName = `${entity.data.firstName || ''} ${entity.data.lastName || ''}`.toLowerCase().trim()
        const matches = candidates.filter(c => c.name.toLowerCase().includes(newName) || newName.includes(c.name.toLowerCase()))

        if (matches.length > 1) {
          console.log(`🔍 DISAMBIGUATION NEEDED: "${newName}"`)
          ambiguousContacts.push({
            mentionedName: entity.data.firstName || newName,
            candidates: matches.map(m => ({
              id: m.id,
              name: m.name,
              role: m.role,
              phone: m.phone
            }))
          })
          return entity
        }

        if (matches.length === 1) {
          const match = matches[0]
          const newContactsCount = entities.filter(e => e.type === 'contact' && e.action === 'create').length

          if (newContactsCount > 1) {
            // Safety skip
            return entity
          }

          console.log(`🛡️ SAFETY NET: "${newName}" matches existing ${match.id}.`)
          // Auto-convert to activity/update logic
          const isActivity = text.toLowerCase().match(/(call|visit|meet|talk|llam|visit|reun|habl)/)

          if (isActivity) {
            return {
              type: 'activity',
              action: 'create',
              data: {
                contactId: match.id,
                activityType: 'call', // Default, AI usually precise but this is fallback
                details: entity.data.details || 'Activity detected for existing contact',
                outcome: 'neutral'
              }
            }
          } else {
            return {
              type: 'contact',
              action: 'update',
              data: {
                contactId: match.id,
                changes: entity.data
              }
            }
          }
        }
      }

      if (entity.type === 'activity' && !entity.data.contactId && candidates.length === 1) {
        return {
          ...entity,
          data: {
            ...entity.data,
            contactId: candidates[0].id
          }
        }
      }

      return entity
    })

    const finalResponse: VoiceCommandResponse = {
      intent: entities.length > 0 ? (entities.length > 1 ? 'multi_entity' : 'single_entity') : 'unknown',
      summary: parsed.summary || (entities.length > 0 ? `${entities.length} actions/acciones` : 'Unknown action'),
      entities: entities,
      needsConfirmation: parsed.needsConfirmation || entities.length > 1,
      needsDisambiguation: ambiguousContacts.length > 0,
      ambiguousContacts: ambiguousContacts.length > 0 ? ambiguousContacts : undefined,
      data: entities.length > 0 ? entities[0].data : {}
    }

    return finalResponse

  } catch (error) {
    console.error('🔥 Critical Error in AI Analysis:', error)
    return {
      intent: 'unknown',
      summary: 'Internal AI Error',
      entities: [],
      needsConfirmation: false,
      data: {}
    }
  }
}

// ==========================================
// 4. FUNCIONES AUXILIARES / LEGACY
// ==========================================

/**
 * Analiza un texto simple (para notas manuales) y extrae sentimiento y resumen.
 * Usado por activities.ts cuando la nota no viene de voz.
 */
export async function analyzeText(text: string) {
  if (!text || text.trim().length < 5) return { sentiment: 'neutral', summary: text }

  try {
    const messages = [
      {
        role: 'system',
        content: `Eres un experto en CRM Inmobiliario. Analiza el texto de una actividad (nota, llamada, etc.).
          Extrae la siguiente información en JSON:
          {
            "sentiment": "positive" | "neutral" | "urgent" | "negative",
            "summary": "Resumen ejecutivo (max 10 palabras)",
            "life_stage": "lead" | "prospect" | "customer" | "churn" | null (Estado del contacto inferido),
            "probability_score": number (0-100, probabilidad de conversión inferida),
            "buyer_preferences": {
               "budget_max": number | null,
               "min_bedrooms": number | null,
               "zones": string[] | null,
               "financial_signal": string | null
            } | null,
            "property_intelligence": {
               "occupancy": "owner" | "rented" | "competitor" | null,
               "lease_end_date": "YYYY-MM-DD" | null,
               "competitor_name": string | null
            } | null
          }
          Si no hay información suficiente para algún campo, usa null.`
      },
      { role: 'user', content: text }
    ]

    const rawContent = await askDeepSeek(messages, 'deepseek-chat', true) || "{}"
    const result = JSON.parse(rawContent)

    return {
      sentiment: result.sentiment || 'neutral',
      summary: result.summary || text.substring(0, 50) + '...',
      life_stage: result.life_stage,
      probability_score: result.probability_score,
      buyer_preferences: result.buyer_preferences,
      property_intelligence: result.property_intelligence
    }
  } catch (e) {
    console.error("Error en analyzeText fallback:", e)
    // Fallback seguro
    return {
      sentiment: 'neutral',
      summary: text,
      life_stage: null,
      probability_score: null,
      buyer_preferences: null,
      property_intelligence: null
    }
  }
}

// Función placeholder para compatibilidad si alguna otra parte la llama
// Función auxiliar para calcular campos actualizados
export function calculateUpdatedContactFields(
  currentStage: string | null,
  currentProb: number | null,
  newStage?: string,
  newProb?: number
) {
  let shouldUpdate = false
  const result: any = {}

  // Lógica simple: Si la IA sugiere una probabilidad mayor o una etapa más avanzada, actualizamos.
  // (Esto es una reconstrucción lógica basada en el uso, ya que el original se perdió)

  if (newProb && (currentProb === null || newProb > currentProb)) {
    result.conversion_probability = newProb
    shouldUpdate = true
  }

  if (newStage && newStage !== currentStage) {
    result.life_stage = newStage
    shouldUpdate = true
  }

  return { shouldUpdate, ...result }
}

export { analyzeContractWithReasoning as analyzeContract } from './deepseek' 
