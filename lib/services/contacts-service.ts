import { createClient } from '@/lib/supabase/server'

export type ContactData = {
  user_id: string
  agency_id?: string | null
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  role: 'owner' | 'buyer'
  street: string | null
  street_number: string | null
  floor: string | null
  door: string | null
  // Campos específicos de comprador
  budget_max?: number | null
  min_bedrooms?: number | null
  min_bathrooms?: number | null
  preferred_zones?: string[] | null
  financial_status?: string | null
  // Campos específicos de propietario (farming)
  property_occupancy?: string | null
  property_lease_end?: string | null
  property_competitor_name?: string | null
  property_competitor_expiry?: string | null
  // Campos adicionales
  farming_status?: string | null
  created_at?: string
  // Campos de geolocalización
  address_lat?: number | null
  address_lng?: number | null
  google_place_id?: string | null
  formatted_address?: string | null
  // Campo de IA: Embedding para matching semántico
  embedding_preferences?: number[] | null
}

export type Contact = {
  id: string
  user_id: string
  agency_id: string | null
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  role: 'owner' | 'buyer'
  street: string | null
  street_number: string | null
  floor: string | null
  door: string | null
  // Campos de comprador
  budget_max: number | null
  min_bedrooms: number | null
  min_bathrooms: number | null
  preferred_zones: string[] | null
  financial_status: string | null
  // Campos de propietario (farming)
  property_occupancy: string | null
  property_lease_end: string | null
  property_competitor_name: string | null
  property_competitor_expiry: string | null
  // Campos adicionales
  farming_status: string | null
  life_stage: string | null
  conversion_probability: number | null
  created_at: string
  updated_at: string
  // Campos de geolocalización
  address_lat: number | null
  address_lng: number | null
  google_place_id: string | null
  formatted_address: string | null
}

/**
 * Obtiene todos los contactos de un usuario, opcionalmente filtrados por rol
 * @param userId - ID del usuario (mantenido por compatibilidad, pero RLS maneja los permisos)
 * @param role - Opcional: 'owner' o 'buyer' para filtrar
 * @returns Array de contactos o error
 */
export async function getContacts(
  userId: string,
  role?: 'owner' | 'buyer'
): Promise<{
  data: Contact[] | null
  error: string | null
}> {
  const supabase = await createClient()

  // RLS (Row Level Security) maneja los permisos automáticamente
  // Permite ver contactos si: user_id = auth.uid() OR agency_id coincide
  let query = supabase
    .from('contacts')
    .select('*')

  if (role) {
    query = query.eq('role', role)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching contacts:', error)
    return { data: null, error: error.message }
  }

  return { data: data || [], error: null }
}

/**
 * Obtiene un contacto por ID
 * @param contactId - ID del contacto
 * @param userId - ID del usuario (mantenido por compatibilidad, pero RLS maneja los permisos)
 * @returns Contacto o error
 */
export async function getContactById(
  contactId: string,
  userId: string
): Promise<{
  data: Contact | null
  error: string | null
}> {
  const supabase = await createClient()

  // RLS (Row Level Security) maneja los permisos automáticamente
  // Permite ver contactos si: user_id = auth.uid() OR agency_id coincide
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single()

  if (error) {
    console.error('Error fetching contact:', error)
    return { data: null, error: error.message }
  }

  if (!data) {
    return { data: null, error: 'Contacto no encontrado' }
  }

  return { data, error: null }
}

/**
 * Obtiene el agency_id del usuario
 * @param userId - ID del usuario
 * @returns agency_id o null si no pertenece a ninguna agencia
 */
async function getUserAgencyId(userId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('agency_members')
    .select('agency_id')
    .eq('user_id', userId)
    .single()

  return data?.agency_id || null
}

/**
 * Crea un nuevo contacto
 * @param contactData - Datos del contacto
 * @returns Contacto creado o error
 */
export async function createContact(
  contactData: ContactData
): Promise<{
  data: Contact | null
  error: string | null
}> {
  const supabase = await createClient()

  // Si no se proporciona agency_id, obtenerlo automáticamente del usuario
  if (!contactData.agency_id) {
    const agencyId = await getUserAgencyId(contactData.user_id)
    contactData.agency_id = agencyId
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert(contactData)
    .select()
    .single()

  if (error) {
    console.error('Error creating contact:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

/**
 * Actualiza un contacto existente
 * @param contactId - ID del contacto
 * @param userId - ID del usuario (mantenido por compatibilidad, pero RLS maneja los permisos)
 * @param contactData - Datos actualizados del contacto
 * @returns Contacto actualizado o error
 */
export async function updateContact(
  contactId: string,
  userId: string,
  contactData: Partial<ContactData>
): Promise<{
  data: Contact | null
  error: string | null
}> {
  const supabase = await createClient()

  // RLS (Row Level Security) maneja los permisos automáticamente
  // Permite actualizar si: user_id = auth.uid() OR agency_id coincide
  const { data, error } = await supabase
    .from('contacts')
    .update(contactData)
    .eq('id', contactId)
    .select()
    .single()

  if (error) {
    console.error('Error updating contact:', error)
    return { data: null, error: error.message }
  }

  if (!data) {
    return { data: null, error: 'Contacto no encontrado' }
  }

  return { data, error: null }
}

/**
 * Elimina un contacto
 * @param contactId - ID del contacto
 * @param userId - ID del usuario (para validar acceso)
 * @returns Error si falla, null si tiene éxito
 */
export async function deleteContact(
  contactId: string,
  userId: string
): Promise<{
  error: string | null
}> {
  const supabase = await createClient()

  // Solo el dueño puede eliminar (RLS restringe automáticamente)
  // Usamos .select() para verificar si realmente se eliminó algo
  const { data, error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)
    .eq('user_id', userId)
    .select()

  if (error) {
    console.error('Error deleting contact:', error)
    return { error: error.message }
  }

  // Si no se eliminó nada, significa que RLS lo bloqueó (no es el dueño)
  if (!data || data.length === 0) {
    return { error: '❌ Restringido: Solo el propietario puede eliminar este registro.' }
  }

  return { error: null }
}

/**
 * Importa múltiples contactos en bulk
 * @param contacts - Array de datos de contactos a importar
 * @returns Resultado de la importación con count y data
 */
export async function importContacts(
  contacts: ContactData[]
): Promise<{
  data: Contact[] | null
  error: string | null
  count?: number
}> {
  const supabase = await createClient()

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return { data: null, error: 'El array de contactos está vacío o no es válido' }
  }

  // Optimización de Agency ID (Se mantiene igual)
  const userIds = [...new Set(contacts.map(c => c.user_id))]
  const agencyIdMap = new Map<string, string | null>()

  for (const userId of userIds) {
    const agencyId = await getUserAgencyId(userId)
    agencyIdMap.set(userId, agencyId)
  }

  const contactsWithAgency = contacts.map(contact => ({
    ...contact,
    agency_id: contact.agency_id || agencyIdMap.get(contact.user_id) || null,
  }))

  // CAMBIO CLAVE: Usamos UPSERT en lugar de INSERT
  const { data, error } = await supabase
    .from('contacts')
    .upsert(contactsWithAgency, { 
      onConflict: 'user_id, email', // Si coincide usuario+email, actualizamos
      ignoreDuplicates: false // false = Sobreescribir con los datos nuevos del CSV
    })
    .select()

  if (error) {
    console.error('Error importing contacts:', error)
    return { data: null, error: error.message }
  }

  return { data: data || [], error: null, count: contacts.length }
}

/**
 * Obtiene un contacto con campos específicos para actividades (verificación)
 * @param contactId - ID del contacto
 * @param userId - ID del usuario (mantenido por compatibilidad, pero RLS maneja los permisos)
 * @returns Contacto con campos específicos o error
 */
export async function getContactForActivity(
  contactId: string,
  userId: string
): Promise<{
  data: { id: string; role: string; life_stage: string | null; conversion_probability: number | null } | null
  error: string | null
}> {
  const supabase = await createClient()

  // RLS (Row Level Security) maneja los permisos automáticamente
  // Permite ver contactos si: user_id = auth.uid() OR agency_id coincide
  const { data, error } = await supabase
    .from('contacts')
    .select('id, role, life_stage, conversion_probability')
    .eq('id', contactId)
    .single()

  if (error) {
    console.error('Error fetching contact for activity:', error)
    return { data: null, error: error.message }
  }

  if (!data) {
    return { data: null, error: 'Contacto no encontrado' }
  }

  return { data, error: null }
}

/**
 * Obtiene todos los contactos para matching de actividades (importación CSV)
 * @param userId - ID del usuario (mantenido por compatibilidad, pero RLS maneja los permisos)
 * @returns Array de contactos con id, first_name, last_name, email, phone
 */
export async function getContactsForMatching(
  userId: string
): Promise<{
  data: Array<{
    id: string
    first_name: string
    last_name: string | null
    email: string | null
    phone: string | null
  }> | null
  error: string | null
}> {
  const supabase = await createClient()

  // RLS (Row Level Security) maneja los permisos automáticamente
  // Permite ver contactos si: user_id = auth.uid() OR agency_id coincide
  const { data, error } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email, phone')

  if (error) {
    console.error('Error fetching contacts for matching:', error)
    return { data: null, error: error.message }
  }

  return { data: data || [], error: null }
}

