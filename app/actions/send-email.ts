'use server'

import { Resend } from 'resend'
import { z } from 'zod'

// Validar variables de entorno
const resendApiKey = process.env.RESEND_API_KEY

if (!resendApiKey) {
    console.warn('⚠️ RESEND_API_KEY no está definida. El envío de emails fallará.')
}

const resend = new Resend(resendApiKey)

// Schema de validación
const ContactFormSchema = z.object({
    firstName: z.string().min(2, 'El nombre es obligatorio'),
    lastName: z.string().min(2, 'El apellido es obligatorio'),
    email: z.string().email('Email inválido'),
    phone: z.string().optional(),
    message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
})

export type ContactState = {
    success: boolean
    message?: string
    errors?: {
        firstName?: string[]
        lastName?: string[]
        email?: string[]
        phone?: string[]
        message?: string[]
    }
}

export async function sendContactEmail(prevState: ContactState, formData: FormData): Promise<ContactState> {
    // 1. Validar datos
    const validatedFields = ContactFormSchema.safeParse({
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        message: formData.get('message'),
    })

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Por favor revisa los campos.',
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { firstName, lastName, email, phone, message } = validatedFields.data

    // 2. Enviar email
    try {
        const { error } = await resend.emails.send({
            from: 'Casalvi Form <hola@casalvi.com>',
            to: ['hola@casalvi.com'],
            replyTo: email, // Para responder directamente al usuario
            subject: `Nuevo mensaje de contacto: ${firstName} ${lastName}`,
            html: `
        <h2>Nuevo mensaje desde Casalvi Web</h2>
        <p><strong>De:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Teléfono:</strong> ${phone || 'No proporcionado'}</p>
        <p><strong>Mensaje:</strong></p>
        <blockquote style="border-left: 4px solid #eee; padding-left: 1rem; margin-left: 0;">
          ${message.replace(/\n/g, '<br>')}
        </blockquote>
      `,
        })

        if (error) {
            console.error('Resend Error:', error)
            return { success: false, message: 'Error al enviar el email. Inténtalo de nuevo más tarde.' }
        }

        return { success: true, message: '¡Mensaje enviado! Nos pondremos en contacto contigo pronto.' }
    } catch (error) {
        console.error('Server Error:', error)
        return { success: false, message: 'Error interno del servidor.' }
    }
}

