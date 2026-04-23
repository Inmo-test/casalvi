'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  analyzeText,
  calculateUpdatedContactFields,
} from '@/lib/services/ai/analysis'

export async function processPendingBatch(limit: number = 5) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  try {
    // 1. Buscar actividades pendientes de procesar
    // RLS (Row Level Security) maneja los permisos automáticamente
    // Permite ver actividades si: user_id = auth.uid() OR agency_id coincide
    const { data: pendingActivities, error: fetchError } = await supabase
      .from('activities')
      .select('id, contact_id, raw_content, created_at')
      .eq('is_processed', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (fetchError) {
      console.error('Error fetching pending activities:', fetchError)
      return { error: `Error al obtener actividades pendientes: ${fetchError.message}` }
    }

    if (!pendingActivities || pendingActivities.length === 0) {
      // Contar el total de pendientes para el retorno
      // RLS maneja los permisos automáticamente
      const { count } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('is_processed', false)

      return {
        processed: 0,
        remaining: count || 0,
      }
    }

    let processedCount = 0

    // 2. Procesar cada actividad
    for (const activity of pendingActivities) {
      try {
        // Obtener el contacto asociado
        // RLS maneja los permisos automáticamente
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .select('id, role, life_stage, conversion_probability')
          .eq('id', activity.contact_id)
          .single()

        if (contactError || !contact) {
          console.error(`Error fetching contact ${activity.contact_id}:`, contactError)
          // Marcar como procesada para no intentarlo infinitamente
          await supabase
            .from('activities')
            .update({ is_processed: true })
            .eq('id', activity.id)
          continue
        }

        if (!activity.raw_content || activity.raw_content.trim().length < 10) {
          // Marcar como procesada aunque no haya contenido suficiente
          await supabase
            .from('activities')
            .update({ is_processed: true })
            .eq('id', activity.id)

          continue
        }

        // 3. Analizar el texto con OpenAI
        const analysis = await analyzeText(activity.raw_content.trim())

        if (!analysis) {
          // Si el análisis falla, marcar como procesada para no intentarlo infinitamente
          await supabase
            .from('activities')
            .update({ is_processed: true })
            .eq('id', activity.id)

          console.warn(`⚠️ No se pudo analizar la actividad ${activity.id}`)
          continue
        }

        // 4. Actualizar la actividad con el análisis de IA
        const { error: updateActivityError } = await supabase
          .from('activities')
          .update({
            ai_summary: analysis.summary,
            ai_sentiment: analysis.sentiment,
            is_processed: true,
          })
          .eq('id', activity.id)

        if (updateActivityError) {
          console.error(`Error updating activity ${activity.id}:`, updateActivityError)
          continue
        }

        // 5. Actualizar el contacto si es necesario
        const updatedFields = calculateUpdatedContactFields(
          contact.life_stage,
          contact.conversion_probability,
          analysis.life_stage,
          analysis.probability_score
        )

        // Preparar actualización del contacto
        const contactUpdate: any = {}

        if (updatedFields.shouldUpdate) {
          contactUpdate.life_stage = updatedFields.life_stage
          contactUpdate.conversion_probability = updatedFields.conversion_probability
        }

        // 6. Actualizar buyer_preferences si la IA los detectó
        if (analysis.buyer_preferences) {
          const prefs = analysis.buyer_preferences

          if (prefs.budget_max !== null) {
            contactUpdate.budget_max = prefs.budget_max
          }

          if (prefs.min_bedrooms !== null) {
            contactUpdate.min_bedrooms = prefs.min_bedrooms
          }

          if (prefs.zones !== null && prefs.zones.length > 0) {
            contactUpdate.zones = prefs.zones
          }

          if (prefs.financial_signal) {
            contactUpdate.financial_status = prefs.financial_signal
          }
        }

        // Actualizar contacto si hay cambios
        if (Object.keys(contactUpdate).length > 0) {
          const { error: updateContactError } = await supabase
            .from('contacts')
            .update(contactUpdate)
            .eq('id', activity.contact_id)

          if (updateContactError) {
            console.error(`Error updating contact ${activity.contact_id}:`, updateContactError)
          }
        }

        // 7. Actualizar contacto con datos de farming si la IA detectó property_intelligence y el contacto es propietario
        if (analysis.property_intelligence && contact.role === 'owner') {
          const propertyIntel = analysis.property_intelligence
          const contactUpdateFarming: any = {}

          // Mapear campos de farming a la tabla contacts
          if (propertyIntel.occupancy) {
            contactUpdateFarming.property_occupancy = propertyIntel.occupancy
          }

          // Actualizar lease_end_date si se detectó
          if (propertyIntel.lease_end_date) {
            if (propertyIntel.occupancy === 'rented') {
              contactUpdateFarming.property_lease_end = propertyIntel.lease_end_date
            } else if (propertyIntel.occupancy === 'competitor') {
              contactUpdateFarming.property_competitor_expiry = propertyIntel.lease_end_date
            }
          }

          // Actualizar información de competencia si se detectó
          if (propertyIntel.competitor_name && propertyIntel.occupancy === 'competitor') {
            contactUpdateFarming.property_competitor_name = propertyIntel.competitor_name
          }

          // Actualizar el contacto si hay cambios de farming
          // RLS maneja los permisos automáticamente
          if (Object.keys(contactUpdateFarming).length > 0) {
            const { error: updateContactFarmingError } = await supabase
              .from('contacts')
              .update(contactUpdateFarming)
              .eq('id', activity.contact_id)

            if (updateContactFarmingError) {
              console.error(
                `Error updating contact ${activity.contact_id} with farming intelligence:`,
                updateContactFarmingError
              )
            } else {
              console.log(
                `✅ Contacto ${activity.contact_id} actualizado con inteligencia de farming:`,
                contactUpdateFarming
              )
            }
          }
        }

        processedCount++
        console.log(`✅ Actividad ${activity.id} procesada exitosamente`)
      } catch (activityError) {
        console.error(`Error processing activity ${activity.id}:`, activityError)
        // Continuar con la siguiente actividad incluso si esta falla
      }
    }

    // 8. Contar actividades restantes pendientes
    // RLS maneja los permisos automáticamente
    const { count: remainingCount } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('is_processed', false)

    // 9. Revalidar rutas
    revalidatePath('/dashboard', 'layout')
    revalidatePath('/dashboard/contacts')

    console.log(
      `✅ Procesamiento en lote completado: ${processedCount} procesadas, ${remainingCount || 0} pendientes`
    )

    return {
      processed: processedCount,
      remaining: remainingCount || 0,
    }
  } catch (error) {
    console.error('Error inesperado en processPendingBatch:', error)
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    return { error: `Error inesperado: ${errorMsg}` }
  }
}

export async function getPendingCount() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado', count: 0 }
  }

  try {
    // RLS (Row Level Security) maneja los permisos automáticamente
    // Permite ver actividades si: user_id = auth.uid() OR agency_id coincide
    const { count, error } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('is_processed', false)

    if (error) {
      console.error('Error counting pending activities:', error)
      return { error: error.message, count: 0 }
    }

    return { count: count || 0 }
  } catch (error) {
    console.error('Error inesperado en getPendingCount:', error)
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    return { error: errorMsg, count: 0 }
  }
}

