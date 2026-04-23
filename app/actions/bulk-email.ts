'use server'

import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'
import { generateText } from '@/lib/ai/deepseek'

export async function sendBulkEmail(contactIds: string[], subject: string, bodyHtml: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'No autorizado' }

    // 1. Obtener credenciales SMTP del perfil
    const { data: profile } = await supabase
        .from('profiles')
        .select('smtp_host, smtp_port, smtp_user, smtp_password, email, first_name, last_name, email_signature')
        .eq('id', user.id)
        .single()

    if (!profile || !profile.smtp_host || !profile.smtp_user || !profile.smtp_password) {
        return {
            success: false,
            error: 'Configuración SMTP incompleta. Por favor configura tu correo en el perfil.'
        }
    }

    // 2. Configurar Transporter (Dinámico)
    const transporter = nodemailer.createTransport({
        host: profile.smtp_host,
        port: profile.smtp_port || 587,
        secure: profile.smtp_port === 465, // True for 465, false for other ports
        auth: {
            user: profile.smtp_user,
            pass: profile.smtp_password,
        },
    })

    // Verificar conexión (opcional, pero buena práctica)
    try {
        await transporter.verify()
    } catch (error) {
        console.error('SMTP Connection Error:', error)
        return { success: false, error: 'Error de conexión SMTP. Revisa tus credenciales.' }
    }

    // 3. Obtener contactos
    const { data: contacts } = await supabase
        .from('contacts')
        .select('id, email, first_name, last_name')
        .in('id', contactIds)
        .not('email', 'is', null)

    if (!contacts || contacts.length === 0) {
        return { success: false, error: 'No se encontraron contactos con email válido' }
    }

    // 4. Enviar correos
    let sentCount = 0
    // Límite de seguridad
    const batchSize = 10
    const trackerEmail = 'tracker@crm.casalvi.com' // Placeholder para BCC log

    try {
        for (const contact of contacts.slice(0, batchSize)) {
            const personalizedBody = bodyHtml
                .replace(/{{name}}/g, contact.first_name)
                .replace(/\n/g, '<br>')
            // Simple newline to BR if plain text passed, but usually rich editor

            // Añadir firma si existe
            const finalHtml = profile.email_signature
                ? `${personalizedBody}<br><br>${profile.email_signature}`
                : personalizedBody

            // Fix for "null null" sender
            const senderName = (profile.first_name && profile.last_name)
                ? `"${profile.first_name} ${profile.last_name}"`
                : `"${profile.first_name || 'Agente'}"`

            const info = await transporter.sendMail({
                from: `${senderName} <${profile.smtp_user}>`, // Sender Name <email>
                to: contact.email!,
                // bcc: trackerEmail, // Tracking BCC removed
                replyTo: profile.email || profile.smtp_user,
                subject: subject.replace(/{{name}}/g, contact.first_name),
                html: finalHtml,
            })

            console.log(`Email sent to ${contact.email}: ${info.messageId}`)
            sentCount++
        }

        return {
            success: true,
            message: `Enviado a ${sentCount} contactos usando tu servidor SMTP personal.`
        }

    } catch (error: any) {
        console.error('Error sending bulk email:', error)
        return { success: false, error: `Fallo en el envío: ${error.message}` }
    }
}

export async function generateEmailDraft(prompt: string) {
    try {
        const systemPrompt = `Eres un agente inmobiliario de Casalvi, experto en trato cercano y profesional.
        Usa los datos del cliente (Score, interés) para redactar correos breves que inviten a una llamada o visita.
        Usa el placeholder {{name}} para el nombre del cliente.
        Devuelve la respuesta en formato JSON con dos campos: "subject" y "body".
        No añadas markdown extra, solo el JSON puro.`

        const jsonResponse = await generateText(
            `Genera un borrador de email para: ${prompt}. Formato JSON {subject, body}`,
            systemPrompt
        )

        // Limpieza básica por si el modelo envuelve en markdown ```json ... ```
        const cleanJson = jsonResponse.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleanJson)

        return {
            success: true,
            subject: parsed.subject || "Nueva Oportunidad Inmobiliaria",
            body: parsed.body || "Hola {{name}}, ..."
        }
    } catch (error) {
        console.error('AI Draft Error:', error)
        return {
            success: false,
            // Fallback seguro si falla la IA
            subject: "Propuesta personalizada",
            body: "Hola {{name}},\n\nTe escribo para..."
        }
    }
}

export async function sendReply(
    toEmail: string,
    subject: string,
    bodyHtml: string,
    inReplyToMessageId?: string,
    references?: string[]
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'No autorizado' }

    // 1. Get Credentials
    const { data: profile } = await supabase
        .from('profiles')
        .select('smtp_host, smtp_port, smtp_user, smtp_password, email, first_name, last_name, email_signature')
        .eq('id', user.id)
        .single()

    if (!profile || !profile.smtp_host || !profile.smtp_user || !profile.smtp_password) {
        return { success: false, error: 'Configuración SMTP incompleta.' }
    }

    // 2. Transporter
    const transporter = nodemailer.createTransport({
        host: profile.smtp_host,
        port: profile.smtp_port || 587,
        secure: profile.smtp_port === 465,
        auth: {
            user: profile.smtp_user,
            pass: profile.smtp_password,
        },
    })

    // 3. Send
    try {
        // Fix for "null null" sender if name is missing
        const senderName = (profile.first_name && profile.last_name)
            ? `"${profile.first_name} ${profile.last_name}"`
            : `"${profile.first_name || 'Agente'}"`

        // Add template replacement support for replies too
        const personalizedBody = bodyHtml
            .replace(/{{name}}/g, 'Cliente') // Fallback as we might not have dynamic name here easily without passing it
            .replace(/\n/g, '<br>')

        const finalHtml = profile.email_signature
            ? `${personalizedBody}<br><br>${profile.email_signature}`
            : personalizedBody

        const info = await transporter.sendMail({
            from: `${senderName} <${profile.smtp_user}>`,
            to: toEmail,
            replyTo: profile.email || profile.smtp_user,
            subject: subject,
            html: finalHtml,
            inReplyTo: inReplyToMessageId,
            references: references,
            // bcc: 'tracker@crm.casalvi.com' // Removed to prevent bounce errors
        })

        console.log(`Reply sent to ${toEmail}. MessageID: ${info.messageId}, In-Reply-To: ${inReplyToMessageId}`)
        return { success: true }
    } catch (error: any) {
        console.error('Reply Error:', error)
        return { success: false, error: error.message }
    }
}
