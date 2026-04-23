'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function generateDemoData() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  try {
    // Perfil 1: El Propietario Urgente
    const { data: contact1, error: error1 } = await supabase
      .from('contacts')
      .insert({
        user_id: user.id,
        first_name: 'Antonio',
        last_name: 'Recio',
        role: 'owner',
        street: 'Mirador de Montepinar',
        street_number: '1',
        floor: 'Bajo',
        door: 'A',
        phone: '+34 912 345 001',
        email: 'antonio.recio@montepinar.es',
        farming_status: 'in_progress',
        life_stage: 'lead',
        conversion_probability: 85,
      })
      .select()
      .single()

    if (error1) {
      console.error('Error creating contact 1:', error1)
      return { error: `Error al crear contacto Antonio: ${error1.message}` }
    }

    if (contact1) {
      const { error: actError1 } = await supabase.from('activities').insert({
        user_id: user.id,
        contact_id: contact1.id,
        channel: 'visit',
        raw_content: 'Visita al inmueble. Antonio dice que no aguanta más a los vecinos y quiere vender YA. Está muy decidido y tiene prisa.',
        ai_summary: 'Propietario urgente, quiere vender inmediatamente',
        ai_sentiment: 'urgent',
        is_processed: true,
      })
      
      if (actError1) {
        console.error('Error creating activity 1:', actError1)
        return { error: `Error al crear actividad de Antonio: ${actError1.message}` }
      }
    }

    // Perfil 2: El Inversor
    const { data: contact2, error: error2 } = await supabase
      .from('contacts')
      .insert({
        user_id: user.id,
        first_name: 'Amancio',
        last_name: 'Ortega',
        role: 'buyer',
        phone: '+34 912 345 002',
        email: 'amancio@inversiones.com',
        company: 'Inversiones AO',
        life_stage: 'lead',
        conversion_probability: 90,
      })
      .select()
      .single()

    if (error2) {
      console.error('Error creating contact 2:', error2)
      return { error: `Error al crear contacto Amancio: ${error2.message}` }
    }

    if (contact2) {
      const { error: actError2 } = await supabase.from('activities').insert({
        user_id: user.id,
        contact_id: contact2.id,
        channel: 'call',
        raw_content: 'Llamada telefónica. Amancio busca local comercial en zona centro para expandir su negocio. Presupuesto muy alto, sin límite prácticamente. Quiere algo en ubicación premium.',
        ai_summary: 'Inversor con presupuesto alto, busca local centro',
        ai_sentiment: 'positive',
        is_processed: true,
      })
      
      if (actError2) {
        console.error('Error creating activity 2:', actError2)
        return { error: `Error al crear actividad de Amancio: ${actError2.message}` }
      }
    }

    // Perfil 3: La Pareja Joven
    const { data: contact3, error: error3 } = await supabase
      .from('contacts')
      .insert({
        user_id: user.id,
        first_name: 'Laura',
        last_name: 'Martínez',
        role: 'buyer',
        phone: '+34 912 345 003',
        email: 'laura.martinez@gmail.com',
        street: 'Atocha',
        life_stage: 'lead',
        conversion_probability: 75,
      })
      .select()
      .single()

    if (error3) {
      console.error('Error creating contact 3:', error3)
      return { error: `Error al crear contacto Laura: ${error3.message}` }
    }

    if (contact3) {
      const { error: actError3 } = await supabase.from('activities').insert({
        user_id: user.id,
        contact_id: contact3.id,
        channel: 'whatsapp',
        raw_content: 'Mensajes por WhatsApp. Laura me cuenta que les ha nacido el bebé hace dos meses y el piso de 2 habitaciones se les queda pequeño. Buscan urgentemente algo de 3 habitaciones en la misma zona porque la niña va a la guardería cerca.',
        ai_summary: 'Familia creciendo, necesita piso más grande urgente',
        ai_sentiment: 'urgent',
        is_processed: true,
      })
      
      if (actError3) {
        console.error('Error creating activity 3:', actError3)
        return { error: `Error al crear actividad de Laura: ${actError3.message}` }
      }
    }

    // Perfil 4: El Portero (Informador)
    const { data: contact4, error: error4 } = await supabase
      .from('contacts')
      .insert({
        user_id: user.id,
        first_name: 'Manuel',
        last_name: 'García',
        role: 'owner',
        street: 'Mayor',
        street_number: '10',
        phone: '+34 912 345 004',
        life_stage: 'prospect',
        conversion_probability: 40,
      })
      .select()
      .single()

    if (error4) {
      console.error('Error creating contact 4:', error4)
      return { error: `Error al crear contacto Manuel: ${error4.message}` }
    }

    if (contact4) {
      const { error: actError4 } = await supabase.from('activities').insert({
        user_id: user.id,
        contact_id: contact4.id,
        channel: 'street_encounter',
        raw_content: 'Encuentro casual en la calle. Manuel es el portero del edificio. Me chivó que la señora del 5º derecha se muda a una residencia de ancianos el mes que viene. La familia va a vender el piso seguro.',
        ai_summary: 'Portero informa oportunidad: 5º derecha en venta',
        ai_sentiment: 'positive',
        is_processed: true,
      })
      
      if (actError4) {
        console.error('Error creating activity 4:', actError4)
        return { error: `Error al crear actividad de Manuel: ${actError4.message}` }
      }
    }

    // Perfil 5: El Jubilado Indeciso
    const { data: contact5, error: error5 } = await supabase
      .from('contacts')
      .insert({
        user_id: user.id,
        first_name: 'José Luis',
        last_name: 'Fernández',
        role: 'owner',
        street: 'Gran Vía',
        street_number: '28',
        floor: '3',
        door: 'C',
        phone: '+34 912 345 005',
        email: 'joseluis@gmail.com',
        farming_status: 'in_progress',
        life_stage: 'prospect',
        conversion_probability: 45,
      })
      .select()
      .single()

    if (error5) {
      console.error('Error creating contact 5:', error5)
      return { error: `Error al crear contacto José Luis: ${error5.message}` }
    }

    if (contact5) {
      const { error: actError5 } = await supabase.from('activities').insert({
        user_id: user.id,
        contact_id: contact5.id,
        channel: 'call',
        raw_content: 'Llamada. José Luis está pensando en vender porque el piso es muy grande para él solo después de que falleció su esposa. Pero dice que todavía no está seguro, que lo tiene que pensar bien. Parece que necesita más tiempo.',
        ai_summary: 'Jubilado considerando vender, necesita tiempo',
        ai_sentiment: 'neutral',
        is_processed: true,
      })
      
      if (actError5) {
        console.error('Error creating activity 5:', actError5)
        return { error: `Error al crear actividad de José Luis: ${actError5.message}` }
      }
    }

    revalidatePath('/dashboard', 'layout')
    return { 
      success: true, 
      message: '✅ Escenario de demo generado exitosamente. 5 contactos y 5 actividades creados con análisis de IA.' 
    }
  } catch (error) {
    console.error('Error generating demo data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return { error: `Error inesperado al generar datos: ${errorMessage}` }
  }
}

