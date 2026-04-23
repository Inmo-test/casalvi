'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createError, createSuccess, ErrorCode, type ServerActionResult } from '@/lib/types/server-action'
import { analyzeText } from '@/lib/services/ai/analysis'
import { analyzeActivityIntention } from './ai/intelligence'
import {
  createActivity as createActivityService,
  updateActivity as updateActivityService,
  deleteActivity as deleteActivityService,
  completeActivity as completeActivityService,
  verifyActivityAccess,
  importActivities as importActivitiesService,
} from '@/lib/services/activities-service'
import { getContactForActivity, getContactsForMatching } from '@/lib/services/contacts-service'
import type { ActivityData } from '@/lib/services/activities-service'

export async function createActivity(
  contactId: string,
  content: string,
  channel: string = 'note',
  scheduledAt: string | null = null,
  propertyId: string | null = null,
  outcome: string | null = null, // <--- NUEVO PARAMETRO
  metadata: any = {}             // <--- NUEVO PARAMETRO
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return createError('No autenticado', ErrorCode.AUTH_REQUIRED)
  }

  if (!content || content.trim().length === 0) {
    return createError('El contenido es requerido', ErrorCode.VALIDATION_ERROR)
  }

  // Verificar que el contacto existe
  const contactResult = await getContactForActivity(contactId, user.id)

  if (contactResult.error || !contactResult.data) {
    return createError(contactResult.error || 'Contacto no encontrado', ErrorCode.NOT_FOUND)
  }

  // Determinar status
  const hasScheduledDate = scheduledAt && scheduledAt.trim() !== ''
  const status = hasScheduledDate ? ('pending' as const) : ('done' as const)
  const scheduled_at = hasScheduledDate ? scheduledAt : null

  // --- LÓGICA CTO: DETECCIÓN DE CONTENIDO YA PROCESADO ---
  // Si viene con la marca de "Cambios sugeridos" o es un tipo de interacción directa,
  // asumimos que ya pasó por la IA de voz y no necesita re-análisis.
  const isVoiceProcessed = content.includes('[Cambios sugeridos') ||
    channel === 'call' ||
    channel === 'visit' ||
    channel === 'meeting';

  // 1. Crear la actividad base
  const activityData: ActivityData = {
    user_id: user.id,
    contact_id: contactId,
    type: 'note', // En BD siempre es 'note' estructuralmente
    channel: channel, // Aquí va el subtipo real (call, visit, etc)
    raw_content: content.trim(),

    // NUEVOS CAMPOS
    outcome: outcome as any, // TypeScript casting si es necesario
    metadata: metadata || {},

    // AQUÍ ESTÁ EL ARREGLO:
    // Si viene de voz, nace "adulta" (procesada) y con resumen.
    is_processed: isVoiceProcessed,
    ai_summary: isVoiceProcessed ? content.trim() : null, // Copiamos contenido al resumen
    ai_sentiment: isVoiceProcessed ? 'neutral' : null, // Valor por defecto seguro

    scheduled_at: scheduled_at,
    status: status,
    property_id: propertyId,
  }

  // LÓGICA DE NEGOCIO (EFECTOS SECUNDARIOS) 🧠
  // Si el resultado es "No le gusta (Precio Alto)", guardamos esa señal en el contacto/propiedad
  if (outcome === 'liked_price_high' && propertyId) {
    // Aquí podríamos lanzar una actualización de estadísticas de la propiedad
    // await incrementPropertyFeedback(propertyId, 'price_high')
  }

  const result = await createActivityService(activityData)

  if (result.error || !result.data) {
    console.error('Error creating activity:', result.error)
    return createError(result.error || 'Error al crear la actividad', ErrorCode.DB_ERROR)
  }

  const activity = result.data

  // 👇👇👇 DISPARADOR "FIRE AND FORGET" 👇👇👇
  // No usamos 'await' para que la UI no se congele esperando a la IA.
  // La predicción se calculará en segundo plano y aparecerá al refrescar o revalidar.
  Promise.all([
    import('@/app/actions/ai/predictive').then(mod =>
      mod.predictNextStep(contactId).catch(err => console.error('Background Prediction Error:', err))
    ),
    import('@/app/actions/ai/intelligence').then(mod =>
      mod.calculateWinProbability(contactId, true).catch(err => console.error('Background Win Probability Error:', err))
    )
  ]).catch(err => console.error('Background Tasks Error:', err))
  // 👆👆👆 FIN DEL DISPARADOR 👆👆👆

  // 2. Enriquecer con IA (SOLO SI NO ESTÁ PROCESADA)
  // Si ya venía de voz (isVoiceProcessed = true), nos saltamos este paso lento.
  if (!isVoiceProcessed) {
    try {
      const analysis = await analyzeText(content.trim())

      if (analysis) {
        await updateActivityService(activity.id, user.id, {
          ai_summary: analysis.summary,
          ai_sentiment: analysis.sentiment,
          is_processed: true,
        })
      }
    } catch (analysisError) {
      console.error('Error in AI analysis (non-blocking):', analysisError)
    }
  }

  revalidatePath('/dashboard', 'layout')
  return createSuccess(activity)
}

export async function deleteActivity(activityId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return createError('No autenticado', ErrorCode.AUTH_REQUIRED)
  }

  // 1. Obtener actividad antes de borrar para saber el contact_id
  let contactId: string | null = null
  const { data: activityData } = await supabase.from('activities').select('contact_id').eq('id', activityId).single()
  if (activityData) {
    contactId = activityData.contact_id
  }

  const result = await deleteActivityService(activityId, user.id)

  if (result.error) {
    return createError(result.error, ErrorCode.DB_ERROR)
  }

  revalidatePath('/dashboard', 'layout')

  // FIRE AND FORGET RECALC
  if (contactId) {
    Promise.all([
      import('@/app/actions/ai/predictive').then(mod =>
        mod.predictNextStep(contactId!).catch(err => console.error('Background Prediction Error:', err))
      ),
      import('@/app/actions/ai/intelligence').then(mod =>
        mod.calculateWinProbability(contactId!, true).catch(err => console.error('Background Win Probability Error:', err))
      )
    ]).catch(err => console.error('Background Tasks Error:', err))
  }

  return createSuccess(undefined)
}

// Nueva función que también limpia el caché de IA
export async function deleteActivityWithCacheCleanup(activityId: string, resourceId: string, resourceType: 'contact' | 'property') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return createError('No autorizado', ErrorCode.AUTH_REQUIRED)

  // 1. Borrar la actividad
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', activityId)

  if (error) return createError('Error al eliminar actividad', ErrorCode.DB_ERROR)

  // 2. LIMPIEZA DE CEREBRO (RESET IA) 🧠✨
  // Al borrar un dato, el análisis anterior ya no es válido. Lo borramos para forzar uno nuevo.
  if (resourceType === 'property') {
    await supabase.from('properties').update({
      ai_advice_cache: null // Borramos el consejo guardado
    }).eq('id', resourceId)

    revalidatePath(`/dashboard/properties/${resourceId}`)
  } else {
    await supabase.from('contacts').update({
      ai_analysis_cache: null // Borramos el análisis de probabilidad
    }).eq('id', resourceId)

    revalidatePath(`/dashboard/contacts/${resourceId}`)
  }

  revalidatePath('/dashboard', 'layout')
  return createSuccess(undefined)
}

export async function completeActivity(activityId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return createError('No autenticado', ErrorCode.AUTH_REQUIRED)
  }

  const result = await completeActivityService(activityId, user.id)

  if (result.error) {
    return createError(result.error, ErrorCode.DB_ERROR)
  }

  revalidatePath('/dashboard/agenda')
  revalidatePath('/dashboard', 'layout')
  return createSuccess(undefined)
}

export async function updateActivity(
  activityId: string,
  data: {
    raw_content?: string
    scheduled_at?: string | null
    status?: 'pending' | 'done'
    channel?: string
  }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return createError('No autenticado', ErrorCode.AUTH_REQUIRED)
  }

  if (!activityId || activityId.trim().length === 0) {
    return createError('El ID de la actividad es requerido', ErrorCode.VALIDATION_ERROR)
  }

  try {
    // Verificar que la actividad existe y pertenece al usuario
    const verifyResult = await verifyActivityAccess(activityId, user.id)

    if (verifyResult.error || !verifyResult.data) {
      return createError(
        verifyResult.error || 'Actividad no encontrada o no tienes permisos para editarla',
        ErrorCode.NOT_FOUND
      )
    }

    const existingActivity = verifyResult.data

    // Preparar el objeto de actualización
    const updateData: Partial<ActivityData> = {}

    if (data.raw_content !== undefined) {
      if (!data.raw_content || data.raw_content.trim().length === 0) {
        return createError('El contenido no puede estar vacío', ErrorCode.VALIDATION_ERROR)
      }
      updateData.raw_content = data.raw_content.trim()
    }

    if (data.scheduled_at !== undefined) {
      updateData.scheduled_at = data.scheduled_at ? data.scheduled_at.trim() : null
    }

    if (data.status !== undefined) {
      if (data.status !== 'pending' && data.status !== 'done') {
        return createError('El estado debe ser "pending" o "done"', ErrorCode.VALIDATION_ERROR)
      }
      updateData.status = data.status

      // Si cambia el status, actualizar updated_at (esto se maneja automáticamente en la BD)
    }

    if (data.channel !== undefined) {
      if (!data.channel || data.channel.trim().length === 0) {
        return createError('El canal no puede estar vacío', ErrorCode.VALIDATION_ERROR)
      }
      updateData.channel = data.channel.trim()
    }

    // Si no hay nada que actualizar
    if (Object.keys(updateData).length === 0) {
      return createError('No hay campos para actualizar', ErrorCode.VALIDATION_ERROR)
    }

    // Actualizar la actividad usando el servicio
    const result = await updateActivityService(activityId, user.id, updateData)

    if (result.error) {
      console.error('Error updating activity:', result.error)
      return createError(`Error al actualizar la actividad: ${result.error}`, ErrorCode.DB_ERROR)
    }

    revalidatePath('/dashboard/agenda')
    revalidatePath('/dashboard', 'layout')

    // FIRE AND FORGET: Recalcular Score y Next Step si la actividad pertenece a un contacto
    const activityWithContact = existingActivity as any
    if (activityWithContact.contact_id) {
      Promise.all([
        import('@/app/actions/ai/predictive').then(mod =>
          mod.predictNextStep(activityWithContact.contact_id).catch(err => console.error('Background Prediction Error:', err))
        ),
        import('@/app/actions/ai/intelligence').then(mod =>
          mod.calculateWinProbability(activityWithContact.contact_id, true).catch(err => console.error('Background Win Probability Error:', err))
        )
      ]).catch(err => console.error('Background Tasks Error:', err))
    }

    return createSuccess(undefined)
  } catch (error) {
    console.error('Error inesperado en updateActivity:', error)
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    return createError(`Error inesperado: ${errorMsg}`, ErrorCode.UNKNOWN_ERROR)
  }
}

export async function importActivities(activities: any[]) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return createError('No autenticado', ErrorCode.AUTH_REQUIRED)
  }

  if (!Array.isArray(activities) || activities.length === 0) {
    return createError('El array de actividades está vacío o no es válido', ErrorCode.VALIDATION_ERROR)
  }

  console.log(`🔍 DEBUG: Recibidas ${activities.length} actividades para procesar`)
  console.log(
    '🔍 DEBUG: Primeras 3 actividades recibidas:',
    JSON.stringify(activities.slice(0, 3), null, 2)
  )

  try {
    // Paso Previo: Obtener TODOS los contactos del usuario usando el servicio
    const contactsResult = await getContactsForMatching(user.id)

    if (contactsResult.error) {
      console.error('Error fetching contacts:', contactsResult.error)
      return createError(`Error al obtener contactos: ${contactsResult.error}`, ErrorCode.DB_ERROR)
    }

    const allContacts = contactsResult.data || []

    if (allContacts.length === 0) {
      return {
        error: 'No se encontraron contactos. Primero importa o crea contactos.',
      }
    }

    // Crear mapas para búsqueda rápida (lógica de matching en la action)
    const contactMapByEmail = new Map<string, string>()
    const contactMapByPhone = new Map<string, string>()
    const contactMapByName = new Map<string, string>()

    // Normalizar y llenar los mapas
    for (const contact of allContacts) {
      // Mapa por email (normalizado a lowercase)
      if (contact.email) {
        const normalizedEmail = contact.email.trim().toLowerCase()
        contactMapByEmail.set(normalizedEmail, contact.id)
      }

      // Mapa por teléfono (normalizado: quitar espacios, guiones, paréntesis)
      if (contact.phone) {
        const normalizedPhone = contact.phone.replace(/[\s\-\(\)]/g, '').trim()
        if (normalizedPhone) {
          contactMapByPhone.set(normalizedPhone, contact.id)
        }
      }

      // Mapa por nombre completo (normalizado: lowercase, sin espacios extra)
      const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`
        .trim()
        .toLowerCase()
      if (fullName) {
        contactMapByName.set(fullName, contact.id)
      }
    }

    // Logs de depuración
    console.log(`🔍 DEBUG: Cargados ${allContacts.length} contactos para vincular.`)
    console.log('🔍 DEBUG: Emails disponibles:', Array.from(contactMapByEmail.keys()))
    console.log('🔍 DEBUG: Teléfonos disponibles:', Array.from(contactMapByPhone.keys()))
    console.log('🔍 DEBUG: Nombres disponibles:', Array.from(contactMapByName.keys()))

    // Mapeo de tipos/canales del CSV a valores válidos de BD
    const mapChannelToDb = (channelStr: string): string => {
      if (!channelStr) return 'note'

      const normalized = channelStr.trim().toLowerCase()
      const channelMap: Record<string, string> = {
        llamada: 'call',
        call: 'call',
        telefono: 'call',
        teléfono: 'call',
        visita: 'visit',
        visit: 'visit',
        'visita presencial': 'visit',
        whatsapp: 'whatsapp',
        wa: 'whatsapp',
        encuentro: 'street_encounter',
        'encuentro en calle': 'street_encounter',
        calle: 'street_encounter',
        nota: 'note',
        note: 'note',
        email: 'note', // Por defecto, email se trata como nota
        correo: 'note',
      }

      return channelMap[normalized] || 'note'
    }

    // Procesar cada actividad del CSV (lógica de matching en la action)
    const activitiesToInsert: ActivityData[] = []
    let errors = 0
    const errorsDetails: string[] = []

    for (let i = 0; i < activities.length; i++) {
      const row = activities[i]

      console.log(`🔍 DEBUG: Procesando fila ${i + 1}:`, JSON.stringify(row, null, 2))

      // Intentar encontrar el contacto (en orden: email, teléfono, nombre)
      let contactId: string | null = null

      // 1. Buscar por Email
      if (row.email || row.correo || row.Email || row.Correo) {
        const email = (row.email || row.correo || row.Email || row.Correo)
          .trim()
          .toLowerCase()
        console.log(`🔍 DEBUG: Buscando por email: '${email}'`)
        if (contactMapByEmail.has(email)) {
          contactId = contactMapByEmail.get(email)!
          console.log(`✅ DEBUG: Contacto encontrado por email: ${contactId}`)
        } else {
          console.log(`❌ DEBUG: Email '${email}' no encontrado en el mapa`)
        }
      }

      // 2. Buscar por Teléfono (si no se encontró por email)
      if (
        !contactId &&
        (row.phone ||
          row.telefono ||
          row.teléfono ||
          row.Phone ||
          row.Teléfono ||
          row.Telefono)
      ) {
        const phoneRaw =
          row.phone || row.telefono || row.teléfono || row.Phone || row.Teléfono || row.Telefono
        const phone = phoneRaw.toString().replace(/[\s\-\(\)]/g, '').trim()
        console.log(
          `🔍 DEBUG: Buscando por teléfono: '${phoneRaw}' (Normalizado: '${phone}')`
        )
        if (phone && contactMapByPhone.has(phone)) {
          contactId = contactMapByPhone.get(phone)!
          console.log(`✅ DEBUG: Contacto encontrado por teléfono: ${contactId}`)
        } else if (phone) {
          console.log(`❌ DEBUG: Teléfono '${phone}' no encontrado en el mapa`)
        }
      }

      // 3. Buscar por Nombre Completo (si no se encontró antes)
      if (!contactId) {
        const firstName = (
          row.first_name ||
          row.nombre ||
          row.firstName ||
          row.Nombre ||
          ''
        ).trim()
        const lastName = (
          row.last_name ||
          row.apellidos ||
          row.lastName ||
          row.Apellidos ||
          row.apellido ||
          ''
        ).trim()
        const fullName = `${firstName} ${lastName}`.trim().toLowerCase()
        const normalizedFullName = fullName.toLowerCase()

        if (fullName) {
          console.log(
            `🔍 DEBUG: Buscando por nombre: '${firstName} ${lastName}' (Normalizado: '${normalizedFullName}')`
          )
          if (contactMapByName.has(normalizedFullName)) {
            contactId = contactMapByName.get(normalizedFullName)!
            console.log(`✅ DEBUG: Contacto encontrado por nombre: ${contactId}`)
          } else {
            console.log(`❌ DEBUG: Nombre '${normalizedFullName}' no encontrado en el mapa`)
          }
        }
      }

      // Si no se encontró el contacto, registrar error y continuar
      if (!contactId) {
        errors++
        const rowIdentifier =
          row.email || row.phone || row.first_name || row.nombre || `Fila ${i + 1}`
        const errorMsg = `No se encontró contacto para: ${rowIdentifier}`
        console.log(
          `❌ ERROR: No se encontró coincidencia para fila ${i + 1}. Identificador usado: '${rowIdentifier}'`
        )
        console.log(`❌ ERROR: Datos completos de la fila:`, JSON.stringify(row, null, 2))
        errorsDetails.push(errorMsg)
        continue
      }

      // Mapear campos del CSV
      const content =
        row.content ||
        row.contenido ||
        row.Content ||
        row.descripcion ||
        row.Descripcion ||
        row.notas ||
        ''
      const channelStr =
        row.channel || row.canal || row.tipo || row.Type || row.type || 'note'
      const channel = mapChannelToDb(channelStr)

      // Mapear fecha (created_at)
      let created_at: string = new Date().toISOString()
      if (row.fecha || row.Fecha || row.date || row.Date || row.created_at) {
        const dateStr = row.fecha || row.Fecha || row.date || row.Date || row.created_at
        try {
          const parsedDate = new Date(dateStr)
          if (!isNaN(parsedDate.getTime())) {
            created_at = parsedDate.toISOString()
          }
        } catch (e) {
          // Si falla el parseo, usar fecha actual
          console.warn(`Error parsing date "${dateStr}", using current date`)
        }
      }

      // Preparar objeto de inserción
      const activityData: ActivityData = {
        user_id: user.id,
        contact_id: contactId,
        type: 'note', // Por defecto
        channel: channel,
        raw_content: content.trim() || 'Actividad importada',
        is_processed: false, // No procesar con IA para historial antiguo (ahorra tokens)
        created_at: created_at,
        status: 'done', // Por defecto, las actividades importadas están completadas
      }

      // Si hay fecha programada, establecer scheduled_at y status
      if (row.scheduled_at || row.scheduledAt || row.fecha_programada || row.Fecha_Programada) {
        const scheduledDateStr =
          row.scheduled_at || row.scheduledAt || row.fecha_programada || row.Fecha_Programada
        try {
          const parsedScheduledDate = new Date(scheduledDateStr)
          if (!isNaN(parsedScheduledDate.getTime())) {
            activityData.scheduled_at = parsedScheduledDate.toISOString()
            activityData.status = 'pending'
          }
        } catch (e) {
          console.warn(`Error parsing scheduled date "${scheduledDateStr}"`)
        }
      }

      activitiesToInsert.push(activityData)
    }

    // Si no hay actividades válidas para insertar
    if (activitiesToInsert.length === 0) {
      return {
        error: `No se pudo vincular ninguna actividad a contactos. Errores: ${errors}`,
        count: 0,
        errors: errors,
        errorsDetails: errorsDetails.slice(0, 10), // Primeros 10 errores
      }
    }

    // Insertar todas las actividades usando el servicio
    const result = await importActivitiesService(activitiesToInsert)

    if (result.error) {
      console.error('Error inserting activities:', result.error)
      return createError(`Error de base de datos: ${result.error}`, ErrorCode.DB_ERROR)
    }

    console.log(`✅ ${activitiesToInsert.length} actividades importadas exitosamente`)

    // Revalidar rutas
    revalidatePath('/dashboard', 'layout')

    return {
      success: true,
      count: result.count || activitiesToInsert.length,
      errors: errors,
      errorsDetails:
        errors > 0 ? errorsDetails.slice(0, 10) : undefined, // Solo incluir si hay errores
    }
  } catch (err) {
    console.error('Error inesperado en importActivities:', err)
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
    return createError(`Error inesperado: ${errorMsg}`, ErrorCode.UNKNOWN_ERROR)
  }
}

export async function createPropertyActivity(data: {
  propertyId: string
  contactId?: string
  type: 'call' | 'visit' | 'email' | 'note' | 'meeting'
  content: string
  outcome?: string
}) {
  const supabase = await createClient()
  console.log('🔍 DEBUG: createPropertyActivity params:', { propId: data.propertyId, contactId: data.contactId, contentSnippet: data.content.slice(0, 20) })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return createError('No autenticado', ErrorCode.AUTH_REQUIRED)

  const { data: userData } = await supabase.from('agency_members').select('agency_id').eq('user_id', user.id).single()

  // 1. INSERTAR ACTIVIDAD COMO SIEMPRE
  const activity = {
    agency_id: userData?.agency_id,
    user_id: user.id,
    property_id: data.propertyId,
    contact_id: data.contactId || null,
    type: 'note',
    channel: data.type,
    raw_content: data.content,
    status: 'done',
    created_at: new Date().toISOString()
  }

  const { error: insertError } = await supabase.from('activities').insert(activity)
  if (insertError) return createError(insertError.message, ErrorCode.DB_ERROR)

  // 2. PROCESO DE INTELIGENCIA HÍBRIDA (Solo si hay contacto)
  if (data.contactId) {
    // Disparamos el análisis (Parser)
    const analysis = await analyzeActivityIntention(data.content, data.type)

    if (analysis) {
      // OBTENER DATOS ACTUALES PARA LA MATEMÁTICA
      const { data: contact } = await supabase
        .from('contacts')
        .select('intelligence_score, last_scoring_update')
        .eq('id', data.contactId)
        .single()

      // 1. Pesos base de interacción
      const interactionWeights = { note: 2, call: 5, visit: 15, email: 2, meeting: 10 }
      let impact = interactionWeights[data.type] || 2

      // 2. FILTRO DE RUIDO Y SENTIMIENTO
      // Si el sentimiento es negativo (-1 a -0.1)
      if (analysis.sentiment < 0) {
        if (analysis.is_noise) {
          // Es ruido: Solo quitamos los puntos de la interacción actual para no premiar el "enfado"
          impact = 0
        } else {
          // Es señal negativa real: Penalizamos el score total (rechazo de propiedad)
          impact = -20 // Un rechazo en visita duele más que el tiempo que ganamos
        }
      } else if (analysis.sentiment > 0.5) {
        // Boost por entusiasmo
        impact += 10
      }

      // 3. CÁLCULO FINAL CON DECAIMIENTO
      const lastUpdate = contact?.last_scoring_update ? new Date(contact.last_scoring_update) : new Date()
      const daysInactivity = Math.max(0, (new Date().getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24))

      const currentScore = contact?.intelligence_score || 0

      // Nueva fórmula: Score Anterior + Impacto (Positivo o Negativo) + (Urgencia IA) - Decaimiento
      let newScore = currentScore + impact + (analysis.urgency * 0.5) - (daysInactivity * 0.5)

      // 4. LÍMITES DE SEGURIDAD (Clamping)
      newScore = Math.min(100, Math.max(0, newScore))

      // 5. ACTUALIZAR CONTACTO
      await supabase.from('contacts').update({
        intelligence_score: newScore,
        urgency_level: analysis.urgency,
        behavior_tags: analysis.tags,
        last_scoring_update: new Date().toISOString()
      }).eq('id', data.contactId)
    }
  }

  revalidatePath(`/dashboard/properties/${data.propertyId}`)
  if (data.contactId) {
    revalidatePath(`/dashboard/contacts/${data.contactId}`)
  }
  return { success: true }
}
