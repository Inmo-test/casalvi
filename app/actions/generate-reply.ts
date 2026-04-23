'use server'

import { generateText } from '@/lib/ai/deepseek'
import { createClient } from '@/lib/supabase/server'

export async function generateSmartReply(emailBody: string, contactId?: string) {
    const supabase = await createClient()

    // 1. Contexto del Contacto (si existe)
    let context = ""
    if (contactId) {
        const { data: contact } = await supabase
            .from('contacts')
            .select('first_name, role, zone, conversion_probability, last_valuation_date')
            .eq('id', contactId)
            .single()

        if (contact) {
            context = `
            CONTEXTO DEL CONTACTO:
            - Nombre: ${contact.first_name}
            - Rol: ${contact.role} (Comprador/Vendedor)
            - Zona de interés: ${contact.zone}
            - Probabilidad de Conversión: ${contact.conversion_probability}%
            `
        }
    }

    // 2. Prompt Engineering
    const systemPrompt = `Eres un agente inmobiliario de Casalvi, experto en trato cercano y profesional.
    Usa los datos del cliente (Score, interés) para redactar correos breves que inviten a una llamada o visita.
    
    Reglas:
    - Sé conciso.
    - Tono: Profesional, colaborativo, orientado a cerrar visitas o llamadas.
    - Firma: 'Tu Agente Inmobiliario' (el sistema pondrá la real después).
    - Devuelve SOLO el cuerpo del correo.
    `

    const userPrompt = `
    ${context}
    
    CORREO RECIBIDO:
    "${emailBody.substring(0, 1000)}..." (truncado)

    TAREA:
    Genera una respuesta sugerida para este correo.
    `

    try {
        const reply = await generateText(userPrompt, systemPrompt)
        return { success: true, reply }
    } catch (error: any) {
        console.error('AI Reply Error:', error)
        return { success: false, error: 'Error generando respuesta IA' }
    }
}
