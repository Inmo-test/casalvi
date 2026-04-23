import { createClient } from '@/lib/supabase/server'

interface DeepSeekResponse {
    choices: {
        message: {
            content: string
        }
    }[]
}

interface DeepSeekOptions {
    model?: 'deepseek-chat' | 'deepseek-reasoner'
    temperature?: number
    responseFormat?: 'json_object' | 'text'
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use callDeepSeek instead
 */
export async function generateText(prompt: string, systemPrompt?: string): Promise<string> {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) throw new Error("DeepSeek API Key no configurada")

    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: systemPrompt || "Eres un asistente inmobiliario experto." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            })
        })

        if (!response.ok) {
            const error = await response.text()
            console.error('DeepSeek API Error:', error)
            throw new Error(`Error DeepSeek API: ${response.statusText}`)
        }

        const data: DeepSeekResponse = await response.json()
        return data.choices[0]?.message?.content || ''

    } catch (error) {
        console.error('DeepSeek generation failed:', error)
        throw error
    }
}

/**
 * Enhanced DeepSeek API caller with support for multiple models and formats
 * 
 * @param systemPrompt - System role/instructions
 * @param userPrompt - User query/content
 * @param options - Configuration options
 * @returns The generated text content
 * 
 * @example
 * ```typescript
 * // For analysis requiring reasoning (R1)
 * const analysis = await callDeepSeek(
 *   "Eres un analista inmobiliario experto",
 *   "Analiza esta propiedad...",
 *   { model: 'deepseek-reasoner', responseFormat: 'json_object' }
 * )
 * 
 * // For standard text generation (V3)
 * const text = await callDeepSeek(
 *   "Eres un copywriter",
 *   "Escribe una descripción...",
 *   { model: 'deepseek-chat', temperature: 0.9 }
 * )
 * ```
 */
export async function callDeepSeek(
    systemPrompt: string,
    userPrompt: string,
    options: DeepSeekOptions = {}
): Promise<string> {
    const {
        model = 'deepseek-chat',
        temperature = 0.7,
        responseFormat = 'text'
    } = options

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
        throw new Error("DEEPSEEK_API_KEY no configurada en variables de entorno")
    }

    try {
        const requestBody: any = {
            model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature
        }

        // Solo añadir response_format si es JSON
        if (responseFormat === 'json_object') {
            requestBody.response_format = { type: "json_object" }
        }

        console.log(`[DeepSeek] Calling ${model} (format: ${responseFormat})`)

        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('[DeepSeek] API Error:', errorText)
            throw new Error(`DeepSeek API Error: ${response.status} ${response.statusText}`)
        }

        const data: DeepSeekResponse = await response.json()
        const content = data.choices[0]?.message?.content

        if (!content) {
            throw new Error('DeepSeek returned empty response')
        }

        console.log(`[DeepSeek] Success - ${content.length} chars returned`)
        return content

    } catch (error) {
        console.error('[DeepSeek] Call failed:', error)
        
        // Re-throw with more context
        if (error instanceof Error) {
            throw new Error(`DeepSeek call failed: ${error.message}`)
        }
        throw error
    }
}
