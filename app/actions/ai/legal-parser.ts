'use server'

import { createClient } from '@/lib/supabase/server'
import { callDeepSeek } from '@/lib/ai/deepseek'
import { extractTextFromPDF } from '@/lib/ocr'

export async function analyzeLegalDocument(contactId: string, fileUrl: string) {
  const supabase = await createClient()

  try {
    // PASO 1: OCR - Extraer texto del PDF/Imagen
    console.log('[Legal Parser] Step 1: Extracting text with OCR...')
    const extractedText = await extractTextFromPDF(fileUrl)
    
    if (!extractedText || extractedText.trim().length < 100) {
      console.error('[Legal Parser] OCR returned insufficient text')
      return { error: 'No se pudo extraer texto del documento. Verifica que el PDF es legible.' }
    }

    console.log(`[Legal Parser] OCR extracted ${extractedText.length} characters`)

    // PASO 2: DeepSeek Reasoner - Análisis legal
    console.log('[Legal Parser] Step 2: Analyzing with DeepSeek Reasoner (R1)...')
    
    const systemPrompt = `Eres un experto abogado especializado en el Registro de la Propiedad en España.

Tu tarea es analizar el texto OCR de una Nota Simple o Escritura y extraer datos CRÍTICOS.

Busca específicamente:
1. Titulares (¿Coinciden con el contacto?)
2. Cargas (Hipotecas, embargos, afecciones fiscales)
3. Limitaciones (Usufructos, servidumbres, VPO)
4. Descripción (Metros cuadrados, linderos)

Responde ÚNICAMENTE en JSON:
{
  "owners": string[],
  "charges": string[],
  "limitations": string[],
  "alerts": string[],
  "detected_m2": number,
  "has_mortgage": boolean
}`

    const userPrompt = `Analiza este texto extraído de un documento de propiedad:

"""
${extractedText.substring(0, 10000)}
"""

Extrae y estructura la información según el formato JSON especificado.`

    const analysisText = await callDeepSeek(systemPrompt, userPrompt, {
      model: 'deepseek-reasoner',
      responseFormat: 'json_object'
    })

    const analysis = JSON.parse(analysisText)

    console.log('[Legal Parser] Analysis complete:', analysis)

    // Actualizar contacto con hallazgos
    await supabase.from('contacts').update({
      legal_analysis_summary: analysis,
      legal_alerts_found: analysis.alerts.length > 0
    }).eq('id', contactId)

    return { success: true, data: analysis }

  } catch (error) {
    console.error('[Legal Parser] Error:', error)
    return { 
      error: error instanceof Error 
        ? `No se pudo procesar el documento: ${error.message}` 
        : 'No se pudo procesar el documento' 
    }
  }
}



