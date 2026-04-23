import { Resend } from 'resend'

// Initialize Resend client (optional - graceful degradation)
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@casalvi.com'
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export type EmailTemplate =
  | 'grace_period_started'
  | 'grace_period_expired'
  | 'member_removed'
  | 'plan_upgraded'
  | 'plan_downgraded'
  | 'subscription_canceled'

interface EmailData {
  to: string
  template: EmailTemplate
  data: Record<string, any>
}

/**
 * Send transactional email using Resend
 * Gracefully degrades if Resend is not configured (logs only)
 */
export async function sendEmail({ to, template, data }: EmailData) {
  const { subject, html } = renderTemplate(template, data)

  // Log attempt (always)
  console.log(`📧 [EMAIL] Sending "${template}" to ${to}`)

  // If Resend not configured, only log (fail-silent for development)
  if (!resend) {
    console.warn('[EMAIL] Resend not configured (RESEND_API_KEY missing). Email not sent.')
    console.log(`[EMAIL] Would have sent:\n  To: ${to}\n  Subject: ${subject}\n  Data:`, data)
    return { success: true, mock: true }
  }

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    })

    console.log(`✅ [EMAIL] Sent successfully. ID: ${result.data?.id}`)
    return { success: true, id: result.data?.id }
  } catch (error) {
    console.error('[EMAIL] Failed to send:', error)
    // Fail-silent: Email errors should never crash the app
    return { success: false, error }
  }
}

/**
 * Render email template with data injection
 */
function renderTemplate(template: EmailTemplate, data: Record<string, any>): { subject: string; html: string } {
  const baseStyles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .alert { background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; }
    .success { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
  `

  switch (template) {
    case 'grace_period_started':
      return {
        subject: '⚠️ Tu pago falló - Actualiza tu tarjeta',
        html: `
          <!DOCTYPE html>
          <html>
            <head><style>${baseStyles}</style></head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⚠️ Problema con tu Pago</h1>
                </div>
                <div class="content">
                  <p>Hola,</p>
                  
                  <div class="alert">
                    <strong>Tu último pago ha fallado</strong> y necesitamos que actualices tu método de pago.
                  </div>

                  <p><strong>Fecha de expiración de gracia:</strong> ${data.gracePeriodEnds}</p>
                  
                  <p>No te preocupes, tienes <strong>3 días</strong> para actualizar tu tarjeta sin perder acceso a tu plan <strong>${data.currentPlan.toUpperCase()}</strong>.</p>
                  
                  <p><strong>¿Qué hacer ahora?</strong></p>
                  <ol>
                    <li>Haz clic en el botón de abajo</li>
                    <li>Actualiza tu método de pago en el portal de Stripe</li>
                    <li>El cargo se procesará automáticamente</li>
                  </ol>

                  <a href="${appUrl}/dashboard/settings" class="button">Actualizar Método de Pago</a>

                  <p><strong>⏰ Si no actualizas antes del ${data.gracePeriodEnds}:</strong></p>
                  <ul>
                    <li>Tu plan será degradado a <strong>Starter (gratuito)</strong></li>
                    <li>Perderás acceso a features premium (IA, Analytics, CSV Import)</li>
                    <li>Tus datos se mantendrán seguros pero en modo solo lectura si excedes los límites</li>
                  </ul>

                  <p>Si necesitas ayuda, responde a este email.</p>

                  <p>Saludos,<br>El equipo de Casalvi</p>
                </div>
                <div class="footer">
                  <p>Casalvi CRM - Gestión inteligente de propiedades</p>
                  <p><a href="${appUrl}/legal/privacy">Política de Privacidad</a> · <a href="${appUrl}/dashboard/settings">Mi Cuenta</a></p>
                </div>
              </div>
            </body>
          </html>
        `,
      }

    case 'grace_period_expired':
      return {
        subject: '🔒 Tu plan ha sido degradado a Starter',
        html: `
          <!DOCTYPE html>
          <html>
            <head><style>${baseStyles}</style></head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔒 Plan Degradado</h1>
                </div>
                <div class="content">
                  <p>Hola,</p>
                  
                  <div class="alert">
                    <strong>Tu plan ha sido degradado a Starter (gratuito)</strong> porque no pudimos procesar tu pago en los últimos 3 días.
                  </div>

                  <p><strong>Plan anterior:</strong> ${data.previousPlan.toUpperCase()}</p>
                  <p><strong>Plan actual:</strong> STARTER</p>
                  
                  <p><strong>¿Qué significa esto?</strong></p>
                  <ul>
                    <li>❌ Sin acceso a IA de voz</li>
                    <li>❌ Sin analytics avanzadas</li>
                    <li>❌ Sin importación CSV</li>
                    <li>🔒 Máximo 20 contactos y 2 propiedades</li>
                  </ul>

                  <p><strong>Tus datos están seguros</strong> pero si tienes más de 20 contactos, estarán en modo solo lectura hasta que actualices.</p>

                  <a href="${appUrl}/dashboard/settings/plans" class="button">Reactivar Mi Plan</a>

                  <p>Si esto fue un error o necesitas ayuda, responde a este email.</p>

                  <p>Saludos,<br>El equipo de Casalvi</p>
                </div>
                <div class="footer">
                  <p>Casalvi CRM - Gestión inteligente de propiedades</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }

    case 'member_removed':
      return {
        subject: '👥 Has sido removido de una agencia en Casalvi',
        html: `
          <!DOCTYPE html>
          <html>
            <head><style>${baseStyles}</style></head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>👥 Cambio en tu Acceso</h1>
                </div>
                <div class="content">
                  <p>Hola,</p>
                  
                  <div class="alert">
                    <strong>Tu acceso a la agencia "${data.agencyName}" ha sido removido.</strong>
                  </div>

                  <p><strong>Motivo:</strong> La agencia cambió a un plan con menos usuarios permitidos (Plan downgrade).</p>
                  
                  <p>Si crees que esto es un error o necesitas recuperar el acceso, contacta al administrador de la agencia.</p>

                  <p>Si quieres crear tu propia agencia en Casalvi, puedes hacerlo gratis:</p>

                  <a href="${appUrl}/onboarding" class="button">Crear Mi Agencia Gratis</a>

                  <p>Saludos,<br>El equipo de Casalvi</p>
                </div>
                <div class="footer">
                  <p>Casalvi CRM - Gestión inteligente de propiedades</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }

    case 'plan_upgraded':
      return {
        subject: '🎉 Plan actualizado exitosamente',
        html: `
          <!DOCTYPE html>
          <html>
            <head><style>${baseStyles}</style></head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 ¡Bienvenido a ${data.newPlan.toUpperCase()}!</h1>
                </div>
                <div class="content">
                  <p>Hola,</p>
                  
                  <div class="success">
                    <strong>Tu plan ha sido actualizado exitosamente.</strong>
                  </div>

                  <p><strong>Plan anterior:</strong> ${data.oldPlan.toUpperCase()}</p>
                  <p><strong>Plan nuevo:</strong> ${data.newPlan.toUpperCase()}</p>
                  
                  <p><strong>Ahora tienes acceso a:</strong></p>
                  <ul>
                    ${data.newPlan !== 'starter' ? '<li>✅ IA de voz ilimitada</li>' : ''}
                    ${data.newPlan !== 'starter' ? '<li>✅ Analytics avanzadas</li>' : ''}
                    ${data.newPlan !== 'starter' ? '<li>✅ Importación CSV masiva</li>' : ''}
                    ${data.newPlan !== 'starter' ? '<li>✅ Contactos y propiedades ilimitadas</li>' : ''}
                    ${data.newPlan === 'business' || data.newPlan === 'agency' ? `<li>✅ Equipo de hasta ${data.newPlan === 'business' ? '3' : '5'} usuarios</li>` : ''}
                  </ul>

                  <a href="${appUrl}/dashboard" class="button">Ir al Dashboard</a>

                  <p>¡Disfruta de tu nuevo plan!</p>

                  <p>Saludos,<br>El equipo de Casalvi</p>
                </div>
                <div class="footer">
                  <p>Casalvi CRM - Gestión inteligente de propiedades</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }

    case 'plan_downgraded':
      return {
        subject: '📉 Tu plan ha cambiado',
        html: `
          <!DOCTYPE html>
          <html>
            <head><style>${baseStyles}</style></head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📉 Plan Actualizado</h1>
                </div>
                <div class="content">
                  <p>Hola,</p>
                  
                  <p>Tu plan ha cambiado de <strong>${data.oldPlan.toUpperCase()}</strong> a <strong>${data.newPlan.toUpperCase()}</strong>.</p>
                  
                  <p><strong>Cambios en tu cuenta:</strong></p>
                  <ul>
                    ${data.newPlan === 'starter' ? '<li>🔒 Máximo 20 contactos y 2 propiedades</li>' : ''}
                    ${data.newPlan === 'starter' ? '<li>❌ Sin acceso a IA de voz</li>' : ''}
                    ${data.newPlan === 'starter' ? '<li>❌ Sin analytics avanzadas</li>' : ''}
                  </ul>

                  <p>Si cambias de opinión, puedes actualizar tu plan en cualquier momento:</p>

                  <a href="${appUrl}/dashboard/settings/plans" class="button">Ver Planes</a>

                  <p>Saludos,<br>El equipo de Casalvi</p>
                </div>
                <div class="footer">
                  <p>Casalvi CRM - Gestión inteligente de propiedades</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }

    case 'subscription_canceled':
      return {
        subject: '👋 Suscripción cancelada - Te echaremos de menos',
        html: `
          <!DOCTYPE html>
          <html>
            <head><style>${baseStyles}</style></head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>👋 Hasta pronto</h1>
                </div>
                <div class="content">
                  <p>Hola,</p>
                  
                  <p>Hemos procesado la cancelación de tu suscripción.</p>
                  
                  <p><strong>Fin de acceso premium:</strong> ${data.periodEnd}</p>
                  
                  <p>Hasta esa fecha, seguirás teniendo acceso completo a tu plan <strong>${data.canceledPlan.toUpperCase()}</strong>.</p>
                  
                  <p>Después del ${data.periodEnd}, tu cuenta pasará automáticamente al plan <strong>Starter (gratuito)</strong>.</p>

                  <p><strong>Tus datos están seguros</strong> y siempre puedes volver cuando quieras.</p>

                  <a href="${appUrl}/dashboard/settings/plans" class="button">Reactivar Mi Plan</a>

                  <p>Si cancelaste por error o necesitas ayuda, responde a este email.</p>

                  <p>¡Gracias por confiar en nosotros!<br>El equipo de Casalvi</p>
                </div>
                <div class="footer">
                  <p>Casalvi CRM - Gestión inteligente de propiedades</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }

    default:
      return {
        subject: 'Notificación de Casalvi CRM',
        html: `<p>Tienes una nueva notificación en Casalvi CRM.</p>`,
      }
  }
}

/**
 * Helper functions for specific emails
 */

export async function sendGracePeriodStartedEmail(
  userEmail: string,
  data: { gracePeriodEnds: string; currentPlan: string }
) {
  return sendEmail({
    to: userEmail,
    template: 'grace_period_started',
    data,
  })
}

export async function sendGracePeriodExpiredEmail(
  userEmail: string,
  data: { previousPlan: string }
) {
  return sendEmail({
    to: userEmail,
    template: 'grace_period_expired',
    data,
  })
}

export async function sendMemberRemovedEmail(
  userEmail: string,
  data: { agencyName: string }
) {
  return sendEmail({
    to: userEmail,
    template: 'member_removed',
    data,
  })
}

export async function sendPlanUpgradedEmail(
  userEmail: string,
  data: { oldPlan: string; newPlan: string }
) {
  return sendEmail({
    to: userEmail,
    template: 'plan_upgraded',
    data,
  })
}

export async function sendPlanDowngradedEmail(
  userEmail: string,
  data: { oldPlan: string; newPlan: string }
) {
  return sendEmail({
    to: userEmail,
    template: 'plan_downgraded',
    data,
  })
}

export async function sendSubscriptionCanceledEmail(
  userEmail: string,
  data: { canceledPlan: string; periodEnd: string }
) {
  return sendEmail({
    to: userEmail,
    template: 'subscription_canceled',
    data,
  })
}
