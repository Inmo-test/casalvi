
import { askDeepSeek } from './deepseek'

// ==========================================
// 1. ANÁLISIS VISUAL (VISION) 👁️
// ==========================================

export async function analyzeConservationState(imageUrls: string[]): Promise<{ score: number, details: string }> {
    // Implementación REAL usando OpenAI Vision (GPT-4o / GPT-4o-mini)
    // DeepSeek no tiene endpoint de visión estable público API similar, usamos OpenAI para esta parte visual.
    const { openai } = await import('@/lib/openai')
    const { PROMPTS } = await import('@/lib/prompts')

    if (!imageUrls || imageUrls.length === 0) {
        return { score: 5, details: 'Sin fotos para analizar. Se asume estado medio.' }
    }

    // Limitamos a 5 fotos para no saturar 
    const selectedImages = imageUrls.slice(0, 5)

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o', // Usamos el mejor modelo multimodal
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: PROMPTS.VALUATION.VISION_ANALYSIS },
                        ...selectedImages.map(url => ({
                            type: 'image_url',
                            image_url: { url }
                        } as any))
                    ]
                }
            ],
            response_format: { type: 'json_object' },
            max_tokens: 300
        })

        const content = response.choices[0].message.content
        if (!content) throw new Error('No content from Vision API')

        const parsed = JSON.parse(content)
        return {
            score: parsed.score || 5,
            details: parsed.reasoning || 'Análisis visual completado.'
        }
    } catch (error) {
        console.error("Vision API Error:", error)
        // Fallback robusto
        return {
            score: 7,
            details: 'Error en análisis visual IA. Se asigna puntaje neutro positivo.'
        }
    }
}

// ==========================================
// 2. CÁLCULO DE VALORACIÓN (REASONER) 🧠
// ==========================================

export async function calculateValuation(property: any, conditionScore: number) {
    // 1. SIN CONSULTA A BASE DE DATOS LOCAL
    // Ya no buscamos en 'market_stats'. Confiamos en el conocimiento global de DeepSeek.

    // 2. Preparar el Prompt para el Reasoner
    const { PROMPTS } = await import('@/lib/prompts')

    // Construimos un string de ubicación robusto y detallado
    // Priorizamos los datos más específicos para que DeepSeek afine el tiro
    const parts = []
    if (property.street) parts.push(`Calle ${property.street} ${property.streetNumber || ''}`)
    else if (property.address) parts.push(property.address) // Fallback si no hay calle granular

    if (property.floor) parts.push(`Planta ${property.floor}`)
    if (property.door) parts.push(`Puerta ${property.door}`)
    if (property.zone) parts.push(`Barrio/Zona: ${property.zone}`)
    if (property.city) parts.push(`Ciudad: ${property.city}`)
    if (property.postalCode) parts.push(`CP: ${property.postalCode}`)
    if (property.province) parts.push(`Province/State: ${property.province}`)
    if (property.country) parts.push(property.country) // Global support

    const locationStr = parts.join(', ')

    // Serializamos datos para interpolar
    const propStr = JSON.stringify({
        type: property.property_type,
        m2: property.m2 || property.size,
        year: property.year_built,
        condition_score: conditionScore,
        usage: property.usageType || 'Residencial',
        extras: [
            property.bedrooms ? `${property.bedrooms} habs` : null,
            property.bathrooms ? `${property.bathrooms} baños` : null
        ].filter(Boolean).join(', ')
    })

    console.log(`🧠 [Valuation] Querying DeepSeek for location: "${locationStr}"`)

    const systemPrompt = PROMPTS.VALUATION.REASONER_PRICING
        .replace('{{location}}', locationStr)
        .replace('{{property}}', propStr)
        .replace('{{condition_score}}', String(conditionScore))

    try {
        const response = await askDeepSeek(
            [{ role: 'user', content: systemPrompt }],
            'deepseek-reasoner', // Usamos el modelo R1 (Reasoner) para mayor precisión
            false
        )

        // Parseamos la respuesta 
        const result = JSON.parse(response || '{}')

        // Helper para limpiar números
        const parsePrice = (val: any): number => {
            if (typeof val === 'number') return val
            if (!val) return 0
            const clean = String(val).replace(/\D/g, '')
            return parseInt(clean, 10) || 0
        }

        const cleanResult = {
            estimated_price_m2: parsePrice(result.estimated_price_m2), // Nuevo campo clave
            fast_sale: parsePrice(result.fast_sale),
            fair_market: parsePrice(result.fair_market),
            out_of_market: parsePrice(result.out_of_market),
            reasoning: result.reasoning || "Análisis IA en tiempo real"
        }

        // Validación extra: Si el precio de mercado es 0, algo falló
        if (cleanResult.fair_market === 0) throw new Error("AI returned 0 valuation")

        console.log(`💰 [Valuation] Success. Est. M2: ${cleanResult.estimated_price_m2}€`)
        return cleanResult

    } catch (error) {
        console.error("⚠️ Error en Valuation Reasoner (DeepSeek):", error)

        // Fallback matemático simple pero a prueba de fallos
        // Si falla la IA, usamos un valor "seguro" genérico (ej: media nacional urbana baja) para no romper el flujo
        // O mejor: devolvemos nulls controlados o un mensaje de error en reasoning

        const safeM2 = 2500 // Valor safe promedio bajo para no exagerar
        const size = Number(property.m2 || property.size) || 90
        const basePrice = size * safeM2

        return {
            estimated_price_m2: safeM2,
            fast_sale: Math.round(basePrice * 0.9),
            fair_market: Math.round(basePrice),
            out_of_market: Math.round(basePrice * 1.1),
            reasoning: "⚠️ Error conectando con IA. Valoración estimada genérica (Fallback)."
        }
    }
}
