import { OpenAI } from 'openai'
import { logAiUsage } from './usage-logger'

// Cliente específico para DeepSeek
const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
    timeout: 60000, // Aumentamos timeout a 60s porque el modelo R1 tarda más en "pensar"
})

export type DeepSeekModel = 'deepseek-chat' | 'deepseek-reasoner'

/**
 * Función auxiliar para limpiar respuestas que contienen texto + JSON
 * Esto es vital para DeepSeek-R1 que a veces explica antes de dar el JSON.
 */
function cleanJsonOutput(content: string): string {
    // Si el contenido ya es JSON puro, lo devolvemos
    if (content.startsWith('{')) return content

    // Buscamos el primer '{' y el último '}' para extraer el bloque JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
        return jsonMatch[0]
    }

    // Si falla, intentamos limpiar bloques de código Markdown ```json ... ```
    return content.replace(/```json\n?|```/g, '').trim()
}

export async function askDeepSeek(
    messages: any[],
    model: DeepSeekModel = 'deepseek-chat',
    jsonMode: boolean = true
) {
    try {
        // NOTA: Para R1 (Reasoner), desactivamos el modo JSON nativo para evitar conflictos
        // con su proceso de pensamiento. Lo parsearemos manualmente después.
        const useNativeJson = jsonMode && model === 'deepseek-chat'

        const completion = await deepseek.chat.completions.create({
            messages,
            model,
            response_format: useNativeJson ? { type: 'json_object' } : undefined,
            // Temperatura: V3 es preciso (0.0), R1 necesita creatividad para razonar (0.6)
            temperature: model === 'deepseek-reasoner' ? 0.6 : 0.0,
            max_tokens: 4000, // Aseguramos espacio para contratos largos
        })

        // Log usage asynchronously
        if (completion.usage) {
            logAiUsage({
                provider: 'deepseek',
                model: model,
                input_tokens: completion.usage.prompt_tokens,
                output_tokens: completion.usage.completion_tokens,
                feature_context: 'deepseek_service'
            })
        }

        const rawContent = completion.choices[0].message.content || ''

        // Si pedimos JSON pero no usamos el modo nativo (caso R1), limpiamos la salida
        if (jsonMode && !useNativeJson) {
            return cleanJsonOutput(rawContent)
        }

        return rawContent
    } catch (error) {
        console.error(`🔥 Error en DeepSeek (${model}):`, error)
        return null
    }
}

/**
 * Función especializada para analizar contratos usando DeepSeek-R1
 */
export async function analyzeContractWithReasoning(contractText: string) {
    const systemPrompt = `Eres un experto legal inmobiliario y analista financiero senior.
Tu objetivo es proteger al agente inmobiliario y a su cliente.

Instrucciones:
1. Analiza el siguiente texto legal.
2. Identifica cláusulas abusivas, fechas trampa o riesgos financieros.
3. Responde ÚNICAMENTE con un objeto JSON válido (sin texto antes ni después).

Estructura del JSON requerida:
{
  "summary": "Resumen ejecutivo en 2 líneas",
  "risks": [
    {"level": "ALTO", "description": "Explicación del riesgo"},
    {"level": "MEDIO", "description": "Explicación del riesgo"}
  ],
  "key_dates": [{"event": "Firma Arras", "date": "YYYY-MM-DD (o 'No especificada')"}],
  "financial_analysis": "Opinión breve sobre si es rentable o caro",
  "verdict": "FAVORABLE" | "REVISAR_CON_ABOGADO" | "NO_FIRMAR"
}`

    // Añadimos un "retry" manual simple por si el JSON falla la primera vez
    try {
        const response = await askDeepSeek(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Analiza este documento:\n\n${contractText}` }
            ],
            'deepseek-reasoner',
            true
        )

        if (!response) return null

        // Intentamos parsear. Si falla, el bloque catch lo atrapará.
        return JSON.parse(response)

    } catch (e) {
        console.error("❌ Error parseando el JSON del contrato (DeepSeek R1):", e)
        // Fallback: Podríamos devolver un objeto de error o intentar con DeepSeek-V3
        return {
            error: "No se pudo analizar el contrato automáticamente. Revíselo manualmente.",
            raw_response: "Error de formato IA"
        }
    }
}

/**
 * Genera un "Sales Pitch" o gancho comercial para un match específico
 */
export async function generateSalesPitch(
    property: any,
    buyer: any,
    breakdown: any
): Promise<string | null> {
    const systemPrompt = `Eres un estratega de ventas inmobiliarias experto en psicología del cliente.
Tu objetivo es escribir un "Business Hook" (gancho) de una sola frase (máximo 25 palabras) para que el agente inmobiliario se lo diga al comprador.

Datos del Match:
- Propiedad: ${property.address} (${property.price}€, ${property.zone})
- Comprador: ${buyer.first_name} (Presupuesto: ${buyer.budget_max}€, Zonas: ${buyer.preferred_zones?.join(', ') || 'Cualquiera'})
- Análisis de Coincidencia (Score Total: ${breakdown.totalScore || 'N/A'}):
  - Presupuesto: ${breakdown.budget?.passed ? '✅' : '❌'} (${breakdown.budget?.message})
  - Zona: ${breakdown.zone?.passed ? '✅' : '❌'} (${breakdown.zone?.message})
  - Habitaciones: ${breakdown.bedrooms?.passed ? '✅' : '❌'} (${breakdown.bedrooms?.message})
  - Financiero: ${breakdown.financial?.passed ? '✅' : '❌'} (${breakdown.financial?.message})

Instrucciones:
- Escribe UNA frase persuasiva que resalte el punto fuerte (lo que sí coincide) para compensar el punto débil.
- Si el precio es bueno pero la zona no, vende la "oportunidad de inversión".
- Si la zona es perfecta pero es caro, vende "calidad de vida" y "ubicación premium".
- Usa un tono profesional pero directo.
- NO uses saludos ni introducciones. Solo la frase.`

    try {
        const response = await askDeepSeek(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: 'Genera el gancho comercial.' }
            ],
            'deepseek-chat',
            false // No JSON mode, queremos texto plano
        )

        return response?.replace(/"/g, '') || null
    } catch (e) {
        console.error("❌ Error generando Sales Pitch:", e)
        return null
    }
}

/**
 * Analiza transcripción de visita para detectar cambios en preferencias
 */
export async function analyzePreferenceChanges(
    transcript: string,
    currentPreferences: any
): Promise<any | null> {
    const systemPrompt = `Eres un asistente de inteligencia artificial para CRM inmobiliario.
Analiza la transcripción de una nota de voz post-visita y detecta si el cliente ha cambiado sus criterios de búsqueda.

Preferencias Actuales:
${JSON.stringify(currentPreferences, null, 2)}

Transcripción:
"${transcript}"

Instrucciones:
1. Extrae cambios explícitos o implícitos en:
   - Zonas (añadir o quitar)
   - Presupuesto máximo (subir o bajar)
   - Habitaciones mínimas
2. Si menciona que le gustó algo que NO estaba en sus preferencias, AÑÁDELO.
3. Si dice que algo no le gustó, NO lo quites de preferencias a menos que sea explícito ("ya no quiero buscar en X").
4. Devuelve un JSON con los campos actualizados. Si no hay cambios en un campo, NO lo incluyas en el JSON.

Formato JSON:
{
  "zones_add": ["Zona Nueva"],
  "zones_remove": ["Zona Vieja"],
  "new_budget_max": 500000,
  "new_min_bedrooms": 3,
  "analysis_summary": "Breve explicación de por qué cambiaste los datos"
}`

    try {
        const response = await askDeepSeek(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: 'Analiza la visita y extrae cambios.' }
            ],
            'deepseek-chat',
            true
        )

        if (!response) return null
        return JSON.parse(response)
    } catch (e) {
        console.error("❌ Error analizando preferencias:", e)
        return null
    }
}

/**
 * Genera una descripción de marketing persuasiva para portales inmobiliarios
 */
export async function generatePropertyDescription(
    data: {
        address: string,
        features: any,
        transcription?: string,
        zone?: string
    }
): Promise<string | null> {
    const systemPrompt = `Eres un Copywriter Inmobiliario Senior experto en SEO para Idealista, Fotocasa y Habitaclia.
Tu objetivo es redactar un anuncio inmobiliario irresistible que genere urgencia y deseo.

TONO Y ESTILO:
- Persuasivo, emocional y profesional.
- Usa Storytelling: no vendas paredes, vende un estilo de vida.
- Usa emojis de forma estratégica (subtítulos, puntos clave) pero sin saturar.
- Estructura clara: Titular Gancho -> Introducción Emocional -> Puntos Fuertes -> Cierre con Llamada a la Acción.

INFORMACIÓN DE ENTRADA:
- Dirección/Zona: ${data.address} (${data.zone || 'Zona desconocida'})
- Características: ${JSON.stringify(data.features)}
- Notas/Audio del Agente: "${data.transcription || 'Sin notas adicionales'}"

INSTRUCCIONES DE REDACCIÓN:
1. TITULAR: Debe ser impactante, mencionar la característica estrella y la zona. (Máx 60 caracteres).
2. INTRODUCCIÓN: Sitúa al lector viviendo allí. "¿Te imaginas desayunar en...?"
3. CUERPO: Describe el flujo de la vivienda. Destaca luminosidad, reformas, calidades.
4. LISTA DE BENEFICIOS: Usa bullets (✅ o ✨) para las características clave (habitaciones, baño, garaje, etc.).
5. CIERRE: Crea urgencia ("Volará pronto") y llamada a la acción ("Agenda tu visita hoy").

IMPORTANTE:
- Responde directamente con el texto del anuncio en formato Markdown.
- No incluyas "Aquí tienes tu descripción" ni saludos.
- Si faltan datos (ej: planta), omítelos o redáctalo de forma genérica pero atractiva.`

    try {
        const response = await askDeepSeek(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Redacta el anuncio para esta propiedad.` }
            ],
            'deepseek-chat',
            false // No JSON, queremos texto rico
        )

        return response
    } catch (e) {
        console.error("❌ Error generando descripción de marketing:", e)
        return null
    }
}
