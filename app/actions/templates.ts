'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// =====================================================
// TYPES
// =====================================================

export interface EmailTemplate {
    id: string
    agency_id: string
    name: string
    description: string | null
    category: string | null
    subject: string
    html_content: string
    variables: string[]
    is_active: boolean
    created_at: string
    updated_at: string
}

// =====================================================
// TEMPLATE ACTIONS
// =====================================================

/**
 * Create a new email template
 */
export async function createTemplate(data: {
    name: string
    description?: string
    category?: string
    subject: string
    html_content: string
    variables?: string[]
}): Promise<{ success: boolean; templateId: string | null; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, templateId: null, error: 'Unauthorized' }
        }

        const { data: membership } = await supabase
            .from('agency_members')
            .select('agency_id')
            .eq('user_id', user.id)
            .single()

        if (!membership) {
            return { success: false, templateId: null, error: 'No agency found' }
        }

        const { data: template, error } = await supabase
            .from('email_templates')
            .insert({
                agency_id: membership.agency_id,
                name: data.name,
                description: data.description || null,
                category: data.category || null,
                subject: data.subject,
                html_content: data.html_content,
                variables: data.variables || ['contact_name', 'agency_name'],
            })
            .select('id')
            .single()

        if (error) {
            console.error('Error creating template:', error)
            return { success: false, templateId: null, error: error.message }
        }

        revalidatePath('/dashboard/marketing/templates')
        return { success: true, templateId: template.id, error: null }
    } catch (error) {
        console.error('Unexpected error in createTemplate:', error)
        return { success: false, templateId: null, error: 'Failed to create template' }
    }
}

/**
 * Get all templates for the agency
 */
export async function getTemplates(): Promise<{
    data: EmailTemplate[] | null
    error: string | null
}> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { data: null, error: 'Unauthorized' }
        }

        const { data: membership } = await supabase
            .from('agency_members')
            .select('agency_id')
            .eq('user_id', user.id)
            .single()

        if (!membership) {
            return { data: null, error: 'No agency found' }
        }

        const { data, error } = await supabase
            .from('email_templates')
            .select('*')
            .eq('agency_id', membership.agency_id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching templates:', error)
            return { data: null, error: error.message }
        }

        return { data, error: null }
    } catch (error) {
        console.error('Unexpected error in getTemplates:', error)
        return { data: null, error: 'Failed to fetch templates' }
    }
}

/**
 * Get single template by ID
 */
export async function getTemplateById(templateId: string): Promise<{
    data: EmailTemplate | null
    error: string | null
}> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('email_templates')
            .select('*')
            .eq('id', templateId)
            .single()

        if (error) {
            console.error('Error fetching template:', error)
            return { data: null, error: error.message }
        }

        return { data, error: null }
    } catch (error) {
        console.error('Unexpected error in getTemplateById:', error)
        return { data: null, error: 'Failed to fetch template' }
    }
}

/**
 * Update an email template
 */
export async function updateTemplate(
    templateId: string,
    data: Partial<Omit<EmailTemplate, 'id' | 'agency_id' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('email_templates')
            .update(data)
            .eq('id', templateId)

        if (error) {
            console.error('Error updating template:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/dashboard/marketing/templates')
        return { success: true, error: null }
    } catch (error) {
        console.error('Unexpected error in updateTemplate:', error)
        return { success: false, error: 'Failed to update template' }
    }
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: string): Promise<{
    success: boolean
    error: string | null
}> {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('email_templates')
            .delete()
            .eq('id', templateId)

        if (error) {
            return { success: false, error: error.message }
        }

        revalidatePath('/dashboard/marketing/templates')
        return { success: true, error: null }
    } catch (error) {
        console.error('Unexpected error in deleteTemplate:', error)
        return { success: false, error: 'Failed to delete template' }
    }
}

// =====================================================
// DEFAULT TEMPLATES
// =====================================================

export const DEFAULT_TEMPLATES = [
    {
        name: 'Bienvenida - Nuevo Lead',
        description: 'Email de bienvenida para nuevos leads del marketplace',
        category: 'welcome',
        subject: '¡Bienvenido {{contact_name}}! - {{agency_name}}',
        html_content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Bienvenido a {{agency_name}}!</h1>
    </div>
    <div class="content">
      <p>Hola <strong>{{contact_name}}</strong>,</p>
      
      <p>Gracias por tu interés en nuestras propiedades. Estamos aquí para ayudarte a encontrar tu hogar ideal.</p>
      
      <p><strong>Próximos pasos:</strong></p>
      <ul>
        <li>Explora nuestras propiedades disponibles</li>
        <li>Agenda una visita cuando quieras</li>
        <li>Completa tu perfil de búsqueda para recibir alertas</li>
      </ul>
      
      <center>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/marketplace" class="button">Ver Propiedades</a>
      </center>
      
      <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      
      <p>Saludos,<br>
      Equipo de {{agency_name}}</p>
    </div>
  </div>
</body>
</html>
    `,
        variables: ['contact_name', 'agency_name'],
    },
    {
        name: 'Follow-up después de visita',
        description: 'Email de seguimiento después de una visita programada',
        category: 'follow_up',
        subject: '¿Qué te pareció la propiedad? - {{agency_name}}',
        html_content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .button { display: inline-block; background: #4caf50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <h2>Hola {{contact_name}},</h2>
      
      <p>Esperamos que hayas disfrutado la visita a la propiedad.</p>
      
      <p><strong>¿Te gustaría dar el siguiente paso?</strong></p>
      
      <ul>
        <li>Agendar una segunda visita</li>
        <li>Hablar sobre financiación</li>
        <li>Ver propiedades similares</li>
        <li>Iniciar el proceso de compra</li>
      </ul>
      
      <p>Estamos aquí para responder cualquier pregunta y ayudarte en todo el proceso.</p>
      
      <center>
        <a href="mailto:{{agency_email}}" class="button">Contactar con {{agency_name}}</a>
      </center>
      
      <p>¡Esperamos tener noticias tuyas pronto!</p>
      
      <p>Saludos,<br>
      {{agency_name}}</p>
    </div>
  </div>
</body>
</html>
    `,
        variables: ['contact_name', 'agency_name', 'agency_email'],
    },
    {
        name: 'Newsletter - Nuevas Propiedades',
        description: 'Boletín con las últimas propiedades publicadas',
        category: 'newsletter',
        subject: '🏠 Nuevas propiedades disponibles - {{agency_name}}',
        html_content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; }
    .button { display: inline-block; background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏠 Nuevas Propiedades</h1>
      <p>{{agency_name}}</p>
    </div>
    <div class="content">
      <p>Hola {{contact_name}},</p>
      
      <p>Te compartimos las últimas propiedades que hemos publicado y que pueden interesarte:</p>
      
      <p><strong>Esta semana destacamos:</strong></p>
      <ul>
        <li>Apartamento en el centro - 3 habitaciones</li>
        <li>Chalet con piscina - Zona residencial</li>
        <li>Estudio moderno - Perfecto para inversión</li>
      </ul>
      
      <center>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/marketplace" class="button">Ver Todas las Propiedades</a>
      </center>
      
      <p>Si alguna te interesa, agenda una visita directamente desde nuestra web.</p>
      
      <p>¡No dejes pasar estas oportunidades!</p>
      
      <p>Saludos,<br>
      {{agency_name}}</p>
    </div>
  </div>
</body>
</html>
    `,
        variables: ['contact_name', 'agency_name'],
    },
]
