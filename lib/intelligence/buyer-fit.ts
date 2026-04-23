/**
 * Motor de ranking buyer-fit por inmueble.
 *
 * Combina:
 *   - reglas deterministas (presupuesto, habitaciones, zona)
 *   - similitud semántica (embedding preferencias comprador vs embedding propiedad)
 *
 * Devuelve top N con score, razón explicable y breakdown rule/semantic.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { generateEmbedding, buildPropertyEmbeddingText, buildBuyerEmbeddingText } from '@/lib/services/ai/embeddings'
import { getAIProvider } from '@/lib/services/ai/provider'

export interface BuyerFitResult {
  contactId: string
  contactName: string
  score: number
  ruleScore: number
  semanticSim: number
  reasons: string[]
}

export async function rankBuyersForProperty(
  propertyId: string,
  opts: { limit?: number; persist?: boolean } = {}
): Promise<BuyerFitResult[]> {
  const supabase = createAdminClient()
  const limit = opts.limit ?? 10

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single()

  if (!property) return []

  const propertyEmbedding = await generateEmbedding(buildPropertyEmbeddingText(property))

  const { data: buyers } = await supabase
    .from('contacts')
    .select('*')
    .eq('agency_id', property.agency_id)
    .eq('role', 'buyer')
    .limit(500)

  if (!buyers?.length) return []

  const results: BuyerFitResult[] = []

  for (const buyer of buyers) {
    const ruleScore = computeRuleScore(property, buyer)
    const buyerText = buildBuyerEmbeddingText(buyer)
    let semanticSim = 0
    if (buyerText) {
      try {
        const buyerEmbedding = await generateEmbedding(buyerText)
        semanticSim = cosineSimilarity(propertyEmbedding, buyerEmbedding)
      } catch {
        semanticSim = 0
      }
    }

    const score = Math.round(ruleScore * 0.6 + semanticSim * 100 * 0.4)
    const reasons = explainFit(property, buyer, ruleScore, semanticSim)

    results.push({
      contactId: buyer.id,
      contactName: `${buyer.first_name ?? ''} ${buyer.last_name ?? ''}`.trim() || 'Sin nombre',
      score,
      ruleScore,
      semanticSim,
      reasons,
    })
  }

  results.sort((a, b) => b.score - a.score)
  const top = results.slice(0, limit)

  if (opts.persist) {
    const provider = getAIProvider()
    for (const r of top) {
      await supabase.from('buyer_fit_scores').insert({
        agency_id: property.agency_id,
        property_id: propertyId,
        contact_id: r.contactId,
        score: r.score,
        semantic_sim: r.semanticSim,
        rule_score: r.ruleScore,
        reasons: r.reasons,
        provider: provider.name,
      })
    }
  }

  return top
}

function computeRuleScore(property: any, buyer: any): number {
  let score = 50
  const reasons: string[] = []

  if (buyer.budget_max && property.price && property.price <= buyer.budget_max) score += 20
  else if (buyer.budget_max && property.price && property.price > buyer.budget_max * 1.1) score -= 20

  if (buyer.min_bedrooms && property.bedrooms) {
    if (property.bedrooms >= buyer.min_bedrooms) score += 10
    else score -= 15
  }

  if (buyer.min_bathrooms && property.bathrooms) {
    if (property.bathrooms >= buyer.min_bathrooms) score += 5
  }

  if (buyer.preferred_zones?.length && property.zone) {
    if (buyer.preferred_zones.some((z: string) => z.toLowerCase() === property.zone.toLowerCase())) {
      score += 15
    }
  }

  return Math.max(0, Math.min(100, score))
}

function explainFit(property: any, buyer: any, rule: number, semantic: number): string[] {
  const reasons: string[] = []
  if (buyer.budget_max && property.price) {
    if (property.price <= buyer.budget_max) {
      reasons.push(`Presupuesto OK (${property.price}€ ≤ ${buyer.budget_max}€)`)
    } else {
      reasons.push(`Fuera de presupuesto (${property.price}€ > ${buyer.budget_max}€)`)
    }
  }
  if (buyer.min_bedrooms && property.bedrooms && property.bedrooms >= buyer.min_bedrooms) {
    reasons.push(`Cumple mínimo de ${buyer.min_bedrooms} habitaciones`)
  }
  if (buyer.preferred_zones?.length && property.zone) {
    const match = buyer.preferred_zones.some((z: string) => z.toLowerCase() === property.zone.toLowerCase())
    if (match) reasons.push(`Zona preferida (${property.zone})`)
  }
  if (semantic > 0.7) reasons.push(`Alta afinidad semántica (${(semantic * 100).toFixed(0)}%)`)
  return reasons.slice(0, 4)
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}
