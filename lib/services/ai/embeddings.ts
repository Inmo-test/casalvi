import { getAIProvider } from './provider'

/**
 * Genera un embedding vectorial usando el proveedor configurado (OpenAI u Ollama).
 * El tamaño del vector está fijado a 1536 dims para mantener compatibilidad con
 * las columnas pgvector existentes.
 */
export async function generateEmbedding(
  text: string,
  retries: number = 2
): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('El texto no puede estar vacío')
  }

  const provider = getAIProvider()
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const vec = await provider.embed(text)
      if (!vec || vec.length === 0) {
        throw new Error(`Provider ${provider.name} devolvió embedding vacío`)
      }
      return vec
    } catch (error: any) {
      lastError = error
      if (error?.status === 429 && attempt < retries) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000))
        continue
      }
      if (error?.status === 401 || error?.status === 400) throw error
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }
    }
  }

  throw lastError || new Error('Error desconocido generando embedding')
}

export function buildBuyerEmbeddingText(contact: {
  notes?: string | null
  preferred_zones?: string[] | null
  budget_max?: number | null
  min_bedrooms?: number | null
  min_bathrooms?: number | null
  financial_status?: string | null
  requirements?: string | null
}): string {
  const parts: string[] = []
  if (contact.notes) parts.push(`Notas: ${contact.notes}`)
  if (contact.requirements) parts.push(`Requisitos: ${contact.requirements}`)
  if (contact.preferred_zones?.length) parts.push(`Zonas preferidas: ${contact.preferred_zones.join(', ')}`)
  if (contact.budget_max) parts.push(`Presupuesto máximo: ${contact.budget_max} euros`)
  if (contact.min_bedrooms) parts.push(`Mínimo de habitaciones: ${contact.min_bedrooms}`)
  if (contact.min_bathrooms) parts.push(`Mínimo de baños: ${contact.min_bathrooms}`)
  if (contact.financial_status) {
    const statusText = {
      approved: 'Financiación aprobada',
      studying: 'Financiación en estudio',
      negative: 'Financiación negativa',
      cash: 'Compra al contado',
    }[contact.financial_status] || contact.financial_status
    parts.push(`Estado financiero: ${statusText}`)
  }
  return parts.join('. ') || ''
}

export function buildPropertyEmbeddingText(property: {
  description?: string | null
  address?: string | null
  zone?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  size?: number | null
  property_type?: string | null
}): string {
  const parts: string[] = []
  if (property.description) parts.push(`Descripción: ${property.description}`)
  if (property.address) parts.push(`Dirección: ${property.address}`)
  if (property.zone) parts.push(`Zona: ${property.zone}`)
  if (property.property_type) parts.push(`Tipo: ${property.property_type}`)
  if (property.bedrooms) parts.push(`${property.bedrooms} habitaciones`)
  if (property.bathrooms) parts.push(`${property.bathrooms} baños`)
  if (property.size) parts.push(`${property.size} metros cuadrados`)
  return parts.join('. ') || ''
}
