/**
 * Motor de ranking de intención de venta.
 *
 * Para cada propietario de una agencia, combina:
 *   - señales temporales (tiempo desde último contacto, tiempo en BD)
 *   - señales extraídas de documentos indexados (divorcio, herencia, mudanza,
 *     fin de contrato de alquiler, reformas)
 *   - interacciones recientes y su intención
 *
 * Devuelve top N con probabilidad, horizonte (15 días / 2 meses) y razones
 * textuales explicables.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { getAIProvider } from '@/lib/services/ai/provider'

export interface SellerIntentResult {
  contactId: string
  contactName: string
  probability: number
  horizonDays: number
  reasons: string[]
}

const SIGNAL_KEYWORDS = [
  'divorcio', 'separación', 'herencia', 'fallecimiento', 'mudanza',
  'traslado', 'contrato de alquiler', 'reforma', 'vender', 'jubilación',
]

const SYSTEM_PROMPT = `Eres un analista inmobiliario. Recibes el perfil de un
propietario con señales extraídas de documentos y actividad reciente.

Devuelve SIEMPRE un JSON válido:
{
  "probability": número entre 0 y 100,
  "horizon_days": 15 | 60,
  "reasons": [string] (2-4 razones breves y concretas, citando los hechos)
}

Criterios:
- 15 días: hay eventos inminentes (fin de alquiler, cambio laboral, decisión tomada)
- 60 días: señales fuertes pero sin fecha exacta
- Sin señales: probability baja y reasons explica por qué.`

interface ContactWithSignals {
  id: string
  first_name: string | null
  last_name: string | null
  notes: string | null
  daysSinceLastInteraction: number | null
  documentSummaries: string[]
  signalMatches: string[]
}

export async function rankSellerIntent(
  agencyId: string,
  opts: { limit?: number; persist?: boolean } = {}
): Promise<SellerIntentResult[]> {
  const supabase = createAdminClient()
  const limit = opts.limit ?? 10

  const { data: owners } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, notes, updated_at')
    .eq('agency_id', agencyId)
    .eq('role', 'owner')
    .limit(200)

  if (!owners?.length) return []

  const results: SellerIntentResult[] = []
  const provider = getAIProvider()

  for (const owner of owners) {
    const [{ data: docs }, { data: lastInteraction }] = await Promise.all([
      supabase
        .from('contact_documents')
        .select('summary, extracted_text')
        .eq('agency_id', agencyId)
        .eq('contact_id', owner.id)
        .limit(10),
      supabase
        .from('contact_interactions')
        .select('created_at')
        .eq('contact_id', owner.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    const documentSummaries = (docs ?? []).map(d => d.summary).filter(Boolean) as string[]
    const signalMatches: string[] = []
    const corpus = [owner.notes ?? '', ...(docs ?? []).map(d => d.extracted_text ?? '')]
      .join(' ')
      .toLowerCase()
    for (const kw of SIGNAL_KEYWORDS) {
      if (corpus.includes(kw)) signalMatches.push(kw)
    }

    const daysSinceLastInteraction = lastInteraction?.created_at
      ? Math.floor((Date.now() - new Date(lastInteraction.created_at).getTime()) / 86400000)
      : null

    const profile: ContactWithSignals = {
      id: owner.id,
      first_name: owner.first_name,
      last_name: owner.last_name,
      notes: owner.notes,
      daysSinceLastInteraction,
      documentSummaries,
      signalMatches,
    }

    const userMsg = buildPrompt(profile)

    let probability = 0
    let horizonDays = 60
    let reasons: string[] = []

    try {
      const raw = await provider.chat(
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMsg },
        ],
        { temperature: 0.2 }
      )
      const jsonStart = raw.indexOf('{')
      const jsonEnd = raw.lastIndexOf('}')
      const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1))
      probability = Math.max(0, Math.min(100, Number(parsed.probability) || 0))
      horizonDays = parsed.horizon_days === 15 ? 15 : 60
      reasons = Array.isArray(parsed.reasons) ? parsed.reasons.slice(0, 4) : []
    } catch {
      continue
    }

    results.push({
      contactId: owner.id,
      contactName: `${owner.first_name ?? ''} ${owner.last_name ?? ''}`.trim() || 'Sin nombre',
      probability,
      horizonDays,
      reasons,
    })

    if (opts.persist) {
      await supabase.from('seller_intent_scores').insert({
        agency_id: agencyId,
        contact_id: owner.id,
        horizon_days: horizonDays,
        probability,
        reasons,
        features: { signalMatches, daysSinceLastInteraction, documentCount: documentSummaries.length },
        provider: provider.name,
      })
    }
  }

  results.sort((a, b) => b.probability - a.probability)
  return results.slice(0, limit)
}

function buildPrompt(c: ContactWithSignals): string {
  const lines = [
    `Nombre: ${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
    c.notes ? `Notas del agente: ${c.notes}` : null,
    c.daysSinceLastInteraction !== null
      ? `Última interacción: hace ${c.daysSinceLastInteraction} días`
      : 'Nunca ha habido interacción registrada',
    c.documentSummaries.length > 0
      ? `Resúmenes de documentos:\n- ${c.documentSummaries.join('\n- ')}`
      : 'Sin documentos indexados',
    c.signalMatches.length > 0
      ? `Señales detectadas en textos: ${c.signalMatches.join(', ')}`
      : 'Sin señales textuales explícitas',
  ].filter(Boolean)
  return lines.join('\n')
}
