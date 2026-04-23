'use server'

import { createClient } from '@/lib/supabase/server'
import { getMyAgency } from '@/app/actions/team'

/**
 * Execute voice command after user confirmation
 * Used in conversational flow: Command → Confirmation → Execution
 */
export async function executeVoiceEntities(entities: any[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  // 1. Obtener Agencia (Crucial para RLS y permisos)
  const { agency } = await getMyAgency()
  if (!agency) {
    return { error: 'No tienes agencia asignada' }
  }

  const results = []
  const errors = []

  // Track the most recent contact ID to link subsequent orphaned activities
  let lastContactId: string | null = null

  try {
    // Execute each entity
    for (const entity of entities) {
      console.log(`[Execute] Processing entity:`, entity)

      // CONTACT CREATION
      if (entity.type === 'contact' && entity.action === 'create') {
        const { data, error } = await supabase
          .from('contacts')
          .insert({
            first_name: entity.data.firstName,
            last_name: entity.data.lastName,
            phone: entity.data.phone,
            email: entity.data.email,
            role: entity.data.role || 'buyer',
            user_id: user.id,
            agency_id: agency.id // <-- FIXED: Assign agency ownership
          })
          .select()
          .single()

        if (error) {
          errors.push({ entity, error: error.message })
          continue
        }

        lastContactId = data.id // Track for future activities
        console.log(`[Execute] ✅ Contact created/updated. Tracking ID for linking: ${lastContactId}`)

        results.push({
          type: 'contact',
          action: 'created',
          id: data.id,
          name: `${data.first_name} ${data.last_name || ''}`.trim()
        })
      }

      // CONTACT UPDATE
      if (entity.type === 'contact' && entity.action === 'update') {
        const { error } = await supabase
          .from('contacts')
          .update(entity.data.changes)
          .eq('id', entity.data.contactId)

        if (error) {
          errors.push({ entity, error: error.message })
          continue
        }

        lastContactId = entity.data.contactId // Track for future activities
        console.log(`[Execute] ✅ Contact updated. Tracking ID for linking: ${lastContactId}`)

        results.push({
          type: 'contact',
          action: 'updated',
          id: entity.data.contactId
        })
      }

      // ACTIVITY CREATION
      if (entity.type === 'activity' && entity.action === 'create') {
        // SMART LINKING: If no contactId provided, use the last processed contact
        const targetContactId = entity.data.contactId || lastContactId

        console.log(`[Execute] Linking activity. Explicit ID: ${entity.data.contactId}, Last Tracked ID: ${lastContactId} → Used: ${targetContactId}`)

        if (!targetContactId) {
          errors.push({ entity, error: 'No contact associated with this activity' })
          console.warn('[Execute] Activity skipped: No contact ID available')
          continue
        }

        const { data, error } = await supabase
          .from('activities')
          .insert({
            contact_id: targetContactId,
            type: entity.data.activityType || 'note',
            raw_content: entity.data.details || '',
            outcome: entity.data.outcome,
            scheduled_at: entity.data.date,
            user_id: user.id,
            channel: 'voice_assistant'
          })
          .select()
          .single()

        if (error) {
          console.error('[Execute] ❌ Activity insertion failed:', error.message)
          errors.push({ entity, error: error.message })
          continue
        }

        console.log(`[Execute] ✅ Activity created successfully! ID: ${data.id}`)

        results.push({
          type: 'activity',
          action: 'created',
          id: data.id,
          activityType: data.type
        })
      }

      // PROPERTY CREATION - DESACTIVADO (No crear propiedades desde voz)
      // if (entity.type === 'property' && entity.action === 'create') {
      //   const { data, error } = await supabase
      //     .from('properties')
      //     .insert({
      //       address: entity.data.address,
      //       price: entity.data.price,
      //       zone: entity.data.zone,
      //       user_id: user.id
      //     })
      //     .select()
      //     .single()

      //   if (error) {
      //     errors.push({ entity, error: error.message })
      //     continue
      //   }

      //   results.push({
      //     type: 'property',
      //     action: 'created',
      //     id: data.id,
      //     address: data.address
      //   })
      // }
    }

    // If any errors, consider it a partial failure
    if (errors.length > 0) {
      return {
        success: false,
        partialSuccess: results.length > 0,
        results,
        errors,
        message: `${results.length} exitosas, ${errors.length} errores`
      }
    }

    return {
      success: true,
      results,
      message: `✅ ${results.length} acciones completadas`
    }

  } catch (error) {
    console.error('[Execute] Fatal error:', error)
    return {
      success: false,
      error: 'Error crítico ejecutando acciones',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Handle voice follow-up command (confirmation/cancellation)
 */
export async function handleVoiceFollowUp(formData: FormData) {
  try {
    const conversationId = formData.get('conversationId') as string
    const file = formData.get('file') as File
    const pendingAction = formData.get('pendingAction')

    if (!file || !conversationId) {
      return { error: 'Datos incompletos' }
    }

    // Transcribe follow-up
    const { transcribeAudioWithGroq } = await import('@/lib/services/ai/groq')
    const transcribedText = await transcribeAudioWithGroq(file)

    if (!transcribedText) {
      return { error: 'No se pudo transcribir el audio' }
    }

    console.log(`[Follow-up] Transcribed: "${transcribedText}"`)

    // Detect confirmation/rejection
    const normalized = transcribedText.toLowerCase().trim()
    const isConfirmation = /^(s[ií]|ok|vale|claro|adelante|yes)/.test(normalized)
    const isRejection = /^(no|cancela|para|stop)/.test(normalized)

    if (isConfirmation) {
      // Parse pending action
      const action = typeof pendingAction === 'string' ? JSON.parse(pendingAction) : pendingAction

      // Execute entities
      const result = await executeVoiceEntities(action.entities || [])

      return {
        executed: true,
        confirmed: true,
        transcript: transcribedText,
        result
      }
    }

    if (isRejection) {
      return {
        executed: false,
        cancelled: true,
        transcript: transcribedText,
        message: 'Acción cancelada'
      }
    }

    // Ambiguous
    return {
      executed: false,
      needsClarification: true,
      transcript: transcribedText,
      message: 'No entendí. Di "sí" para confirmar o "no" para cancelar.'
    }

  } catch (error) {
    console.error('[Follow-up] Error:', error)
    return {
      error: 'Error procesando respuesta',
      details: error instanceof Error ? error.message : 'Unknown'
    }
  }
}
