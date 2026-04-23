import { askDeepSeek } from './deepseek'

export interface LegalRisk {
    level: 'CRITICAL' | 'WARNING' | 'INFO' | 'SAFE'
    title: string
    description: string
    action_required: boolean
}

export interface LegalAnalysisResult {
    summary: string
    risks: LegalRisk[]
    overall_status: 'RED' | 'YELLOW' | 'GREEN'
    official_data: {
        registration_number?: string
        cadastro?: string
        owner_name?: string
    }
}

/**
 * Analiza el texto de un documento legal (Nota Simple) usando DeepSeek-R1
 */
export async function analyzeLegalRisks(text: string): Promise<LegalAnalysisResult | null> {
    const systemPrompt = `Actúa como un Asistente Técnico de Documentación Inmobiliaria.
Tu tarea es extraer datos objetivos de Notas Simples y Escrituras.
NO eres abogado. Usa siempre lenguaje condicional ("Se detecta mención a...", "Podría indicar...").

OBJETIVOS:
1. Buscar explícitamente:
   - Hipotecas no canceladas.
   - Embargos o anotaciones preventivas.
   - Servidumbres (paso, luces, vistas).
   - Usufructos vitalicios.
   - Afecciones fiscales (especialmente de herencias recientes).
   - Prohibiciones de disponer.
   - Vivienda de Protección Oficial (VPO).

2. Clasificar cada hallazgo por severidad:
   - CRITICAL (Rojo): Impide la venta inmediata (ej: Embargo, Prohibición disponer).
   - WARNING (Amarillo): Requiere gestión antes de firma (ej: Hipoteca, Afección fiscal, VPO).
   - INFO (Azul): Información relevante no bloqueante (ej: Servidumbre, Referencia catastral).
   - SAFE (Verde): Todo limpio.

3. Extraer, si es posible, datos oficiales: Tomo, Libro, Finca, Titular.

FORMATO DE SALIDA (JSON PURO):
{
  "summary": "Resumen ejecutivo de 2 líneas.",
  "risks": [
    {
       "level": "CRITICAL" | "WARNING" | "INFO" | "SAFE",
       "title": "Nombre del riesgo (ej: Embargo Ejecutivo)",
       "description": "Explicación técnica breve.",
       "action_required": true/false
    }
  ],
  "overall_status": "RED" | "YELLOW" | "GREEN",
  "official_data": {
     "registration_number": "...",
     "cadastro": "...",
     "owner_name": "..."
  }
}

Si el texto es ilegible o no parece un documento legal, indícalo en el summary y marca overall_status como YELLOW.`

    try {
        const response = await askDeepSeek(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Analiza este documento legal extraído vía OCR:\n\n${text.slice(0, 15000)}` } // Limitamos caracteres por seguridad
            ],
            'deepseek-reasoner', // Usamos R1 (Reasoner) para mayor capacidad analítica
            true // JSON Mode
        )

        if (!response) return null

        // DeepSeek puede devolver markdown a veces, intentamos parsear
        const cleanJson = response.replace(/```json\n?|```/g, '').trim()
        return JSON.parse(cleanJson)

    } catch (error) {
        console.error("❌ Error en análisis legal IA:", error)
        return null
    }
}
