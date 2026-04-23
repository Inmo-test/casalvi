'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createError, createSuccess, ErrorCode, type ServerActionResult } from '@/lib/types/server-action'
import {
  createContact as createContactService,
  updateContact as updateContactService,
  deleteContact as deleteContactService,
  importContacts as importContactsService,
} from '@/lib/services/contacts-service'
import type { ContactData } from '@/lib/services/contacts-service'
// === IMPORTS PARA LÍMITES DE SUSCRIPCIÓN ===
import { checkRateLimit } from '@/lib/services/rate-limit'
import { getMyAgency } from '@/app/actions/team'
import { trackEvent } from '@/lib/telemetry'
// ===========================================
// === IMPORTS PARA EMBEDDINGS ===
import { generateEmbedding, buildBuyerEmbeddingText } from '@/lib/services/ai/embeddings'
// =================================
import { cookies } from 'next/headers'

// --- OBTENER CONTACTOS (SERVER ACTION) 📂 ---
export async function getContacts() {
  const supabase = await createClient() // Usar cliente de servidor que usa cookies
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado' }

  // Obtener Agency ID (caché optimizada si es posible) o query directa
  // Por ahora hacemos query segura con RLS
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching contacts:', error)
    return { success: false, error: error.message }
  }

  // 2. SIMULAR METRICAS DE INSIGHTS (Placeholder para Phase 4)
  // En producción, esto vendría de una tabla de analytics o cálculo real
  const dataWithInsights = contacts?.map((c: any) => ({
    ...c,
    insights: {
      churn_risk: Math.random() > 0.8 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low',
      zone_density: Math.random() > 0.7 ? 'hot' : 'normal',
      last_interaction_days: Math.floor(Math.random() * 30) // Mock
    }
  }))

  return { success: true, data: dataWithInsights }
}

export async function createContact(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return createError('No autenticado', ErrorCode.AUTH_REQUIRED)
  }

  try {
    // Campos básicos
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const role = (formData.get('role') as string) || 'owner'

    // Dirección
    const street = formData.get('street') as string
    const streetNumber = formData.get('streetNumber') as string
    const floor = formData.get('floor') as string
    const door = formData.get('door') as string

    // Campos de comprador
    const budgetMaxStr = formData.get('budgetMax') as string
    const minBedroomsStr = formData.get('minBedrooms') as string
    const minBathroomsStr = formData.get('minBathrooms') as string
    const preferredZonesStr = formData.get('preferredZones') as string
    const cityStr = formData.get('city') as string
    const minSurfaceStr = formData.get('minSurface') as string

    // Campos de farming
    const propertyOccupancy = formData.get('propertyOccupancy') as string
    const propertyLeaseEnd = formData.get('propertyLeaseEnd') as string
    const propertyCompetitorName = formData.get('propertyCompetitorName') as string
    const propertyCompetitorExpiry = formData.get('propertyCompetitorExpiry') as string

    if (!firstName) {
      return createError('El nombre es requerido', ErrorCode.VALIDATION_ERROR)
    }

    // 1. Obtener Agencia
    const { agency } = await getMyAgency()
    if (!agency) {
      return createError('No tienes agencia asignada', ErrorCode.NOT_FOUND)
    }

    // 2. Rate Limiting
    const rateLimitCheck = await checkRateLimit(agency.id, 'contacts')
    if (!rateLimitCheck.allowed) {
      return createError(rateLimitCheck.message || 'Límite temporal excedido', ErrorCode.RATE_LIMIT_EXCEEDED)
    }

    // Geo
    const addressLatStr = formData.get('address_lat') as string
    const addressLngStr = formData.get('address_lng') as string
    const googlePlaceId = formData.get('google_place_id') as string
    const formattedAddress = formData.get('formatted_address') as string

    const contactData: ContactData = {
      user_id: user.id,
      first_name: firstName,
      last_name: lastName || null,
      email: email || null,
      phone: phone || null,
      role: role as 'owner' | 'buyer',
      street: street || null,
      street_number: streetNumber || null,
      floor: floor || null,
      door: door || null,
      address_lat: addressLatStr && addressLatStr.trim() !== '' ? parseFloat(addressLatStr) : null,
      address_lng: addressLngStr && addressLngStr.trim() !== '' ? parseFloat(addressLngStr) : null,
      google_place_id: googlePlaceId && googlePlaceId.trim() !== '' ? googlePlaceId : null,
      formatted_address: formattedAddress && formattedAddress.trim() !== '' ? formattedAddress : null,
    }

    if (role === 'buyer') {
      contactData.budget_max = budgetMaxStr && budgetMaxStr.trim() !== '' ? Number(budgetMaxStr) : null
      contactData.min_bedrooms = minBedroomsStr && minBedroomsStr.trim() !== '' ? Number(minBedroomsStr) : null
      contactData.min_bathrooms = minBathroomsStr && minBathroomsStr.trim() !== '' ? Number(minBathroomsStr) : null

      if (preferredZonesStr && preferredZonesStr.trim() !== '') {
        const zonesArray = preferredZonesStr.split(',').map((z) => z.trim()).filter((z) => z.length > 0)
        contactData.preferred_zones = zonesArray.length > 0 ? zonesArray : null
      } else {
        contactData.preferred_zones = null
      }

      if (street && !streetNumber) {
        if (!contactData.preferred_zones) {
          contactData.preferred_zones = [street]
        } else if (!contactData.preferred_zones.includes(street)) {
          contactData.preferred_zones.push(street)
        }
      }
    }

    if (role === 'owner') {
      contactData.property_occupancy = propertyOccupancy || 'unknown'
      if (propertyOccupancy === 'rented') {
        contactData.property_lease_end = propertyLeaseEnd && propertyLeaseEnd.trim() !== '' ? propertyLeaseEnd : null
      } else {
        contactData.property_lease_end = null
      }
      if (propertyOccupancy === 'competitor') {
        contactData.property_competitor_name = propertyCompetitorName && propertyCompetitorName.trim() !== '' ? propertyCompetitorName : null
        contactData.property_competitor_expiry = propertyCompetitorExpiry && propertyCompetitorExpiry.trim() !== '' ? propertyCompetitorExpiry : null
      } else {
        contactData.property_competitor_name = null
        contactData.property_competitor_expiry = null
      }
    }

    if (role === 'buyer') {
      try {
        const embeddingText = buildBuyerEmbeddingText({
          notes: formData.get('notes') as string || null,
          preferred_zones: contactData.preferred_zones || null,
          budget_max: contactData.budget_max || null,
          min_bedrooms: contactData.min_bedrooms || null,
          min_bathrooms: contactData.min_bathrooms || null,
          financial_status: formData.get('financialStatus') as string || null,
          requirements: null,
        })
        if (embeddingText.trim().length > 0) {
          const embedding = await generateEmbedding(embeddingText)
          contactData.embedding_preferences = embedding
          console.log('✅ Embedding generado para comprador')
        }
      } catch (error) {
        console.error('⚠️ Error generando embedding:', error)
      }
    }

    const result = await createContactService(contactData)

    if (result.error) {
      console.error('Error creating contact:', result.error)
      return createError(`Error: ${result.error}`, ErrorCode.DB_ERROR)
    }

    // --- SINCRONIZAR PREFERENCES ---
    if (role === 'buyer' && result.data) {
      try {
        const prefsData = {
          contact_id: result.data.id,
          max_price: contactData.budget_max,
          min_bedrooms: contactData.min_bedrooms,
          min_bathrooms: contactData.min_bathrooms,
          zones: contactData.preferred_zones,
          city: cityStr && cityStr.trim() !== '' ? cityStr.trim() : null,
          min_surface: minSurfaceStr ? Number(minSurfaceStr) : null,
          updated_at: new Date().toISOString()
        }
        await supabase.from('preferences').upsert(prefsData, { onConflict: 'contact_id' })
      } catch (e) {
        console.error("Error creating preferences:", e)
      }
    }

    revalidatePath('/dashboard/contacts')
    revalidatePath('/dashboard', 'layout')
    return createSuccess(result.data)

  } catch (err) {
    console.error('Error inesperado en createContact:', err)
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
    return createError(`Error inesperado: ${errorMsg}`, ErrorCode.UNKNOWN_ERROR)
  }
}

export async function updateContact(contactId: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  try {
    // Extraer campos del formData
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const role = (formData.get('role') as string) || 'owner'

    // 1. Obtener Agencia y Verificar Permiso (IDOR Protection)
    const { agency } = await getMyAgency()
    if (!agency) return { error: 'No tienes agencia asignada' }

    // 2. Verificar que el contacto pertenece a la agencia O al usuario (Self-healing)
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id, agency_id, user_id')
      .eq('id', contactId)
      .single()

    if (!existingContact) {
      return { error: 'No tienes permisos para editar este contacto o no existe.' }
    }

    // Lógica de Permisos + Auto-Fix
    // Caso A: Pertenece a mi agencia -> OK
    // Caso B: Es huérfano (sin agencia) PERO yo lo creé -> OK y lo arreglamos
    let shouldAutoFixAgency = false

    if (existingContact.agency_id === agency.id) {
      // Todo correcto
    } else if (!existingContact.agency_id && existingContact.user_id === user.id) {
      // Es un contacto huérfano creado por mí (posible bug de voz anterior). Lo adoptamos.
      shouldAutoFixAgency = true
    } else {
      // Caso C: Pertenece a otra agencia o no es mío -> Error
      return { error: 'No tienes permisos para editar este contacto (pertenece a otra agencia).' }
    }

    // Dirección
    const street = formData.get('street') as string
    const streetNumber = formData.get('streetNumber') as string
    const floor = formData.get('floor') as string
    const door = formData.get('door') as string

    // Campos de comprador
    const budgetMaxStr = formData.get('budgetMax') as string
    const minBedroomsStr = formData.get('minBedrooms') as string
    const minBathroomsStr = formData.get('minBathrooms') as string
    const preferredZonesStr = formData.get('preferredZones') as string
    const cityStr = formData.get('city') as string
    const minSurfaceStr = formData.get('minSurface') as string

    // Campos de farming para propietarios
    const propertyOccupancy = formData.get('propertyOccupancy') as string
    const propertyLeaseEnd = formData.get('propertyLeaseEnd') as string
    const propertyCompetitorName = formData.get('propertyCompetitorName') as string
    const propertyCompetitorExpiry = formData.get('propertyCompetitorExpiry') as string

    // Geo
    const addressLatStr = formData.get('address_lat') as string
    const addressLngStr = formData.get('address_lng') as string
    const googlePlaceId = formData.get('google_place_id') as string
    const formattedAddress = formData.get('formatted_address') as string

    if (!firstName) {
      return createError('El nombre es requerido', ErrorCode.VALIDATION_ERROR)
    }

    // Preparar objeto de actualización
    const updateData: Partial<ContactData> = {
      first_name: firstName,
      last_name: lastName || null,
      email: email || null,
      phone: phone || null,
      role: role as 'owner' | 'buyer',
      street: street || null,
      street_number: streetNumber || null,
      floor: floor || null,
      door: door || null,
      address_lat: addressLatStr && addressLatStr.trim() !== '' ? parseFloat(addressLatStr) : null,
      address_lng: addressLngStr && addressLngStr.trim() !== '' ? parseFloat(addressLngStr) : null,
      google_place_id: googlePlaceId && googlePlaceId.trim() !== '' ? googlePlaceId : null,
      formatted_address: formattedAddress && formattedAddress.trim() !== '' ? formattedAddress : null,
    }

    // Auto-fix agency assignment if needed
    if (shouldAutoFixAgency) {
      updateData.agency_id = agency.id
    }

    if (role === 'buyer') {
      updateData.budget_max = budgetMaxStr && budgetMaxStr.trim() !== '' ? Number(budgetMaxStr) : null
      updateData.min_bedrooms = minBedroomsStr && minBedroomsStr.trim() !== '' ? Number(minBedroomsStr) : null
      updateData.min_bathrooms = minBathroomsStr && minBathroomsStr.trim() !== '' ? Number(minBathroomsStr) : null

      if (preferredZonesStr && preferredZonesStr.trim() !== '') {
        const zonesArray = preferredZonesStr.split(',').map((z) => z.trim()).filter((z) => z.length > 0)
        updateData.preferred_zones = zonesArray.length > 0 ? zonesArray : null
      } else {
        updateData.preferred_zones = null
      }

      if (street && !streetNumber) {
        if (!updateData.preferred_zones) {
          updateData.preferred_zones = [street]
        } else if (!updateData.preferred_zones.includes(street)) {
          updateData.preferred_zones.push(street)
        }
      }
    }

    if (role === 'owner') {
      updateData.property_occupancy = propertyOccupancy || 'unknown'
      if (propertyOccupancy === 'rented') {
        updateData.property_lease_end = propertyLeaseEnd && propertyLeaseEnd.trim() !== '' ? propertyLeaseEnd : null
      } else {
        updateData.property_lease_end = null
      }
      if (propertyOccupancy === 'competitor') {
        updateData.property_competitor_name = propertyCompetitorName && propertyCompetitorName.trim() !== '' ? propertyCompetitorName : null
        updateData.property_competitor_expiry = propertyCompetitorExpiry && propertyCompetitorExpiry.trim() !== '' ? propertyCompetitorExpiry : null
      } else {
        updateData.property_competitor_name = null
        updateData.property_competitor_expiry = null
      }
    }

    if (role === 'buyer') {
      try {
        const { data: currentContact } = await supabase
          .from('contacts')
          .select('notes')
          .eq('id', contactId)
          .single()

        const embeddingText = buildBuyerEmbeddingText({
          notes: formData.get('notes') as string || currentContact?.notes || null,
          preferred_zones: updateData.preferred_zones || null,
          budget_max: updateData.budget_max || null,
          min_bedrooms: updateData.min_bedrooms || null,
          min_bathrooms: updateData.min_bathrooms || null,
          financial_status: formData.get('financialStatus') as string || null,
          requirements: null,
        })

        if (embeddingText.trim().length > 0) {
          const embedding = await generateEmbedding(embeddingText)
          updateData.embedding_preferences = embedding
        }
      } catch (error) {
        console.error('⚠️ Error generando embedding:', error)
      }
    }

    const result = await updateContactService(contactId, user.id, updateData)

    if (result.error) {
      console.error('Error updating contact:', result.error)
      return createError(result.error, ErrorCode.DB_ERROR)
    }

    // --- SYNC PREFERENCES ---
    if (role === 'buyer' && result.data) {
      try {
        const prefsData = {
          contact_id: result.data.id,
          max_price: updateData.budget_max,
          min_bedrooms: updateData.min_bedrooms,
          min_bathrooms: updateData.min_bathrooms,
          zones: updateData.preferred_zones,
          city: cityStr && cityStr.trim() !== '' ? cityStr.trim() : null,
          min_surface: minSurfaceStr ? Number(minSurfaceStr) : null,
          updated_at: new Date().toISOString()
        }
        await supabase.from('preferences').upsert(prefsData, { onConflict: 'contact_id' })
      } catch (e) {
        console.error("Error creating preferences:", e)
      }
    }

    revalidatePath('/dashboard/contacts')
    revalidatePath('/dashboard', 'layout')
    return createSuccess(result.data)

  } catch (err) {
    console.error('Error inesperado en updateContact:', err)
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
    return createError(`Error inesperado: ${errorMsg}`, ErrorCode.UNKNOWN_ERROR)
  }
}

export async function deleteContact(contactId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const result = await deleteContactService(contactId, user.id)

  if (result.error) {
    return createError(result.error, ErrorCode.DB_ERROR)
  }

  revalidatePath('/dashboard/contacts')
  revalidatePath('/dashboard', 'layout')
  return createSuccess(undefined)
}

export async function canImportCSV(): Promise<{ allowed: boolean; message?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { allowed: false, message: 'No autenticado' }
  return { allowed: true }
}

export async function importContacts(contacts: any[]) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return createError('No autenticado', ErrorCode.AUTH_REQUIRED)
  }

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return createError('El array de contactos está vacío o no es válido', ErrorCode.VALIDATION_ERROR)
  }

  // 1. Obtener Agencia
  const { agency } = await getMyAgency()
  if (!agency) {
    return createError('No tienes agencia asignada', ErrorCode.NOT_FOUND)
  }

  // 2. 🛡️ SEGURIDAD: VERIFICAR PERMISO DE IMPORTACIÓN + RATE LIMITING 🔒
  const rateLimitCheck = await checkRateLimit(agency.id, 'csv_import')
  if (!rateLimitCheck.allowed) {
    return createError(rateLimitCheck.message || 'Límite temporal de importaciones excedido', ErrorCode.RATE_LIMIT_EXCEEDED)
  }

  try {
    // Mapear y sanear los datos
    const sanitizedContacts: ContactData[] = contacts.map((contact) => {
      // 1. Sanear Strings Básicos (Trim + Null si vacío)
      const sanitizeString = (val: any) => (val && typeof val === 'string' && val.trim().length > 0 ? val.trim() : null)

      const firstName = sanitizeString(contact.first_name || contact.firstName || contact.nombre) || 'Sin Nombre'

      const lastName = sanitizeString(contact.last_name || contact.lastName || contact.apellidos)

      // CRÍTICO: El email debe estar limpio para que el índice único funcione
      const email = sanitizeString(contact.email || contact.correo || contact.mail)

      const phone = sanitizeString(contact.phone || contact.telefono || contact.tel)

      // Sanear role
      const role = (contact.role || 'owner') as 'owner' | 'buyer'

      // Sanear farming_status
      const farmingStatus = contact.farming_status || contact.farmingStatus || 'not_started'

      // Sanear dirección
      const street = sanitizeString(contact.street || contact.calle)

      const streetNumber = sanitizeString(contact.street_number || contact.streetNumber || contact.numero)

      const floor = sanitizeString(contact.floor || contact.piso)

      const door = sanitizeString(contact.door || contact.puerta)

      // Sanear campos de comprador (Numéricos)
      const parseNumber = (val: any) => (val ? Number(val) : null)

      const budgetMax = parseNumber(contact.budget_max || contact.budgetMax || contact.presupuesto)

      const minBedrooms = parseNumber(contact.min_bedrooms || contact.minBedrooms || contact.habitaciones)

      const minBathrooms = parseNumber(contact.min_bathrooms || contact.minBathrooms || contact.banos)

      // Sanear preferred_zones
      let preferredZones = null

      const zonesValue = contact.preferred_zones || contact.preferredZones || contact.zonas

      if (zonesValue) {
        if (Array.isArray(zonesValue)) {
          preferredZones = zonesValue.filter((z) => z && z.trim().length > 0)
        } else if (typeof zonesValue === 'string') {
          preferredZones = zonesValue.split(',').map((z) => z.trim()).filter((z) => z.length > 0)
        }
      }

      // Sanear campos de farming
      const propertyOccupancy = contact.property_occupancy || contact.propertyOccupancy || contact.ocupacion || 'unknown'

      const propertyLeaseEnd = contact.property_lease_end || contact.propertyLeaseEnd || contact.fin_contrato || null

      const propertyCompetitorName = contact.property_competitor_name || contact.propertyCompetitorName || contact.agencia_competidora || null

      const propertyCompetitorExpiry = contact.property_competitor_expiry || contact.propertyCompetitorExpiry || contact.fin_exclusiva || null

      // Construir objeto
      const contactData: ContactData = {
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        role: role,
        farming_status: farmingStatus,
        street: street,
        street_number: streetNumber,
        floor: floor,
        door: door,
        created_at: new Date().toISOString(),
      }

      // Añadir campos específicos
      if (role === 'buyer') {
        contactData.budget_max = budgetMax
        contactData.min_bedrooms = minBedrooms
        contactData.min_bathrooms = minBathrooms
        contactData.preferred_zones = preferredZones
      }

      if (role === 'owner') {
        contactData.property_occupancy = propertyOccupancy

        if (propertyOccupancy === 'rented' && propertyLeaseEnd) contactData.property_lease_end = propertyLeaseEnd

        if (propertyOccupancy === 'competitor') {
          contactData.property_competitor_name = propertyCompetitorName
          contactData.property_competitor_expiry = propertyCompetitorExpiry
        }
      }

      return contactData
    })

    // Insertar/Actualizar usando el servicio
    const result = await importContactsService(sanitizedContacts)

    if (result.error) {
      // Manejar error de duplicados si aún ocurre
      if (result.error.includes('duplicate key') || result.error.includes('violates unique constraint')) {
        return createError('Error de duplicados: Revisa que no haya teléfonos repetidos (el sistema usa Email para actualizar, pero Teléfono debe ser único).', ErrorCode.VALIDATION_ERROR)
      }

      return createError(`Error de base de datos: ${result.error}`, ErrorCode.DB_ERROR)
    }

    // Revalidar
    revalidatePath('/dashboard/contacts')
    revalidatePath('/dashboard', 'layout')

    // Track telemetry
    await trackEvent(agency.id, 'CSV_IMPORTED', {
      contacts_imported: result.count || sanitizedContacts.length,
      plan: agency.billing_plan
    })

    return {
      success: true,
      count: result.count || sanitizedContacts.length,
      data: result.data,
    }
  } catch (err) {
    console.error('Error inesperado en importContacts:', err)
    return createError(`Error inesperado: ${err instanceof Error ? err.message : 'Desconocido'}`, ErrorCode.UNKNOWN_ERROR)
  }
}

/**
 * REVERSE MATCHING ACTION (PRODUCCIÓN)
 * Busca propiedades que encajen con un contacto específico (Comprador)
 * Usa la tabla 'preferences' como fuente de verdad
 */
export async function findMatchingProperties(contactId: string) {
  const supabase = await createClient()

  // 1. Obtener las Preferencias del Contacto
  const { data: prefs } = await supabase
    .from('preferences')
    .select('*')
    .eq('contact_id', contactId)
    .single()

  if (!prefs) return { success: false, data: [] }

  // 2. Obtener TODAS las propiedades activas de la agencia
  // (Optimizaremos esto en el futuro filtrando por DB, ahora filtramos en memoria para el scoring)
  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('agency_id', prefs.agency_id)
    .eq('status', 'active') // Solo propiedades disponibles
    .order('created_at', { ascending: false })

  if (!properties) return { success: true, data: [] }

  // 3. CALCULAR EL MATCHING SCORE (A la inversa) 🧮
  const matches = properties.map(property => {
    let score = 0
    let breakdown = {
      budget: { passed: false, score: 0, message: 'Se pasa de presupuesto' },
      bedrooms: { passed: false, score: 0, message: 'Pocas Habitaciones' },
      zone: { passed: false, score: 0, message: 'Otra zona' },
      financial: { passed: true, score: 10, message: 'OK' }, // Heredado del estado del comprador
      surface: { passed: false, score: 0, message: 'Pequeño' }, // Nuevo
      city: { passed: false, score: 0, message: 'Otra ciudad' } // Nuevo
    }

    // A. Presupuesto (30 puntos)
    // ¿El precio de la casa es MENOR o IGUAL a lo que el cliente quiere pagar?
    if (prefs.max_price && property.price <= prefs.max_price) {
      score += 30
      breakdown.budget = { passed: true, score: 30, message: 'Precio OK' }
    } else if (prefs.max_price && property.price <= (prefs.max_price * 1.1)) {
      // Si se pasa solo por un 10%, es "Negociable"
      score += 15
      breakdown.budget = { passed: false, score: 15, message: 'Negociable' }
    }

    // B. Habitaciones (15 puntos)
    if (!prefs.min_bedrooms || (property.bedrooms && property.bedrooms >= prefs.min_bedrooms)) {
      score += 15
      breakdown.bedrooms = { passed: true, score: 15, message: 'Habitaciones OK' }
    }

    // C. Zona (25 puntos)
    // ¿La zona de la casa está en la lista de deseos del cliente?
    if (!prefs.zones || prefs.zones.length === 0 || (property.zone && prefs.zones.includes(property.zone))) {
      score += 25
      breakdown.zone = { passed: true, score: 25, message: 'Zona OK' }
    }

    // D. Superficie (10 puntos) - NUEVO
    // Usamos 'min_surface' de prefs y comparison con property.size
    if (!prefs.min_surface || (property.size && property.size >= prefs.min_surface)) {
      score += 10
      breakdown.surface = { passed: true, score: 10, message: 'Sup. OK' }
    }

    // E. Ciudad (10 puntos) - NUEVO
    // Buscamos la ciudad en formatted_address
    if (!prefs.city || (property.formatted_address && property.formatted_address.toLowerCase().includes(prefs.city.toLowerCase()))) {
      score += 10
      breakdown.city = { passed: true, score: 10, message: 'Ciudad OK' }
    }

    // F. Estado Financiero del Comprador (10 puntos)
    // Si el comprador tiene dinero, cualquier casa es un mejor match
    if (prefs.financial_status === 'cash' || prefs.financial_status === 'approved') {
      score += 10
      breakdown.financial = { passed: true, score: 10, message: 'Solvente' }
    } else if (prefs.financial_status === 'studying') {
      // Bonus pequeño para los que están en ello
      score += 5
      breakdown.financial = { passed: true, score: 5, message: 'Estudiando' }
    }

    return {
      ...property,
      matchScore: Math.min(100, score),
      breakdown
    }
  })

  // 4. Filtrar y Ordenar
  const validMatches = matches
    .filter(m => m.matchScore > 30) // Solo mostramos coincidencias decentes
    .sort((a, b) => b.matchScore - a.matchScore)

  return { success: true, data: validMatches }
}

/**
 * BUSCADOR DE CONTACTOS (Para Comandos de Voz)
 * MEJORA: Usa búsqueda difusa (fuzzy search) con trigramas para encontrar variaciones
 * Ej: "Darwish" encontrará "Darwis", "Juancito" encontrará "Juan"
 */
export async function findContactByName(nameQuery: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return createError('No autenticado', ErrorCode.AUTH_REQUIRED)

  // 1. Obtener agency_id del usuario
  const { agency } = await getMyAgency()
  if (!agency) {
    return createError('No tienes agencia asignada', ErrorCode.NOT_FOUND)
  }

  // 2. Limpieza: Quitamos espacios extra
  const cleanName = nameQuery.trim()

  if (!cleanName || cleanName.length < 2) {
    return { success: true, data: [] }
  }

  console.log(`🔎 Buscando contacto con búsqueda difusa: "${cleanName}"`)

  // 3. MEJORA: Usar RPC de búsqueda difusa (fuzzy search)
  // Esto permite encontrar "Darwish" cuando buscas "Darwis" o viceversa
  const { data, error } = await supabase.rpc('search_contacts_fuzzy', {
    search_query: cleanName,
    p_agency_id: agency.id,
    match_threshold: 0.3 // Umbral de similitud (0.3 = 30% de similitud mínima)
  })

  if (error) {
    console.error('Error en búsqueda difusa:', error)
    // Fallback a búsqueda simple si la RPC falla
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, role')
      .eq('agency_id', agency.id)
      .or(`first_name.ilike.%${cleanName}%,last_name.ilike.%${cleanName}%`)
      .limit(5)

    if (fallbackError) {
      return createError(fallbackError.message, ErrorCode.DB_ERROR)
    }

    return { success: true, data: fallbackData || [] }
  }

  // Debug: Ver qué encontró
  if (data && data.length > 0) {
    console.log(`✅ Encontrado con búsqueda difusa: ${data[0].first_name} ${data[0].last_name || ''}`)
  } else {
    console.log(`❌ No se encontraron coincidencias para "${cleanName}"`)
  }

  // Mapear solo los campos necesarios
  const mappedData = (data || []).map((contact: any) => ({
    id: contact.id,
    first_name: contact.first_name,
    last_name: contact.last_name,
    role: contact.role
  }))

  return { success: true, data: mappedData }
}