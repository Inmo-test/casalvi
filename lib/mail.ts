import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789')

// ✅ AQUÍ USAMOS TU NUEVO CORREO
const FROM_EMAIL = 'Casalvi <hola@casalvi.com>'

export async function sendAppointmentEmail({
  to,
  clientName,
  agentName,
  date,
  address,
  type
}: {
  to: string
  clientName: string
  agentName: string
  date: Date
  address: string
  type: string
}) {
  if (!to || !to.includes('@')) return

  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/Madrid'
  }).format(date)

  const subject = `Confirmación de ${type}: ${formattedDate}`

  // Plantilla HTML simple y profesional
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Confirmación de Cita</h2>
      <p>Hola <strong>${clientName}</strong>,</p>
      <p>Te confirmamos tu cita con <strong>${agentName}</strong>.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>📅 Fecha:</strong> ${formattedDate}</p>
        <p style="margin: 5px 0;"><strong>📍 Lugar:</strong> ${address}</p>
        <p style="margin: 5px 0;"><strong>🏠 Tipo:</strong> ${type}</p>
      </div>
      <p>Si necesitas cambiar la hora, por favor contacta con nosotros.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280;">Gestionado por Casalvi CRM</p>
    </div>
  `

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: subject,
      html: html,
    })

    return { success: true, id: data.data?.id }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

