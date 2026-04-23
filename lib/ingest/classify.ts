/**
 * Clasificador LLM: dado el texto extraído de un archivo, decide si pertenece
 * a un contacto concreto (propietario/comprador) o a información de barrio
 * genérica. Extrae entidades para vincular.
 */

import { getAIProvider } from '@/lib/services/ai/provider'

export interface DocumentClassification {
  kind: 'contact' | 'neighborhood' | 'unknown'
  contactHints: {
    name?: string
    email?: string
    phone?: string
    address?: string
  }
  zone?: string
  summary: string
}

const SYSTEM_PROMPT = `Eres un asistente que clasifica documentos de una inmobiliaria.
Devuelve SIEMPRE un JSON válido con este formato exacto:
{
  "kind": "contact" | "neighborhood" | "unknown",
  "contactHints": { "name": string?, "email": string?, "phone": string?, "address": string? },
  "zone": string?,
  "summary": string (2-3 frases)
}
- "contact" si el documento menciona explícitamente a una persona concreta
  (propietario de un inmueble, comprador potencial, correspondencia).
- "neighborhood" si es información genérica de una zona, comparables, informes.
- "unknown" si no hay señal suficiente.
Extrae hints de contacto si aparecen. No inventes datos.`

export async function classifyDocument(text: string): Promise<DocumentClassification> {
  const sample = text.slice(0, 6000)
  const provider = getAIProvider()

  const raw = await provider.chat(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: sample },
    ],
    { temperature: 0.1 }
  )

  try {
    const jsonStart = raw.indexOf('{')
    const jsonEnd = raw.lastIndexOf('}')
    if (jsonStart < 0 || jsonEnd < 0) throw new Error('JSON no encontrado')
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1))
    return {
      kind: parsed.kind ?? 'unknown',
      contactHints: parsed.contactHints ?? {},
      zone: parsed.zone,
      summary: parsed.summary ?? '',
    }
  } catch {
    return { kind: 'unknown', contactHints: {}, summary: '' }
  }
}
