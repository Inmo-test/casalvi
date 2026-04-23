import { createClient } from '@/lib/supabase/server'

// DEFINICIÓN DE OUTCOMES (Resultados permitidos)
export type ActivityOutcome = 
  // Llamadas
  | 'answered_interested'     // Contestó - Interesado
  | 'answered_not_interested' // Contestó - No interesado
  | 'no_answer'               // No contestó
  | 'callback_scheduled'      // Agendada otra llamada
  | 'meeting_scheduled'       // Agendada visita/reunión
  // Visitas
  | 'liked_offer'             // Le gusta -> Oferta
  | 'liked_price_high'        // Le gusta -> Precio alto
  | 'disliked_zone'           // No le gusta zona
  | 'disliked_property'       // No le gusta el piso
  | 'discarded'               // Descartado
  // Reuniones/Contratos
  | 'signed'                  // Firmado
  | 'negotiating'             // Negociando
  | 'rejected'                // Rechazado
  // General
  | 'positive'                // Genérico positivo
  | 'negative'                // Genérico negativo
  | 'neutral';                // Genérico neutral

export type ActivityData = {
  user_id: string
  agency_id?: string | null
  contact_id: string
  property_id?: string | null
  type: string
  channel: string
  outcome?: ActivityOutcome | null // <--- NUEVO
  metadata?: Record<string, any>   // <--- NUEVO
  raw_content: string
  is_processed?: boolean
  scheduled_at?: string | null
  status?: 'pending' | 'done'
  ai_summary?: string | null
  ai_sentiment?: string | null
  created_at?: string
}

export type Activity = {
  id: string
  user_id: string
  agency_id: string | null
  contact_id: string
  type: string
  channel: string
  outcome: ActivityOutcome | null // <--- NUEVO
  metadata: Record<string, any>   // <--- NUEVO
  raw_content: string
  ai_summary: string | null
  ai_sentiment: string | null
  is_processed: boolean
  scheduled_at: string | null
  status: 'pending' | 'done'
  created_at: string
  updated_at: string
}

export type ActivityWithContact = Activity & {
  contact: {
    id: string
    first_name: string
    last_name: string | null
  }
}

/**
 * Obtiene actividades filtradas por diferentes criterios
 * @param userId - ID del usuario (mantenido por compatibilidad, pero RLS maneja los permisos)
 * @param filters - Filtros opcionales (contactId, status, scheduled_at)
 * @returns Array de actividades o error
 */
export async function getActivities(
  userId: string,
  filters?: {
    contactId?: string
    status?: 'pending' | 'done'
    scheduledAtFrom?: string
    scheduledAtTo?: string
  }
): Promise<{
  data: Activity[] | null
  error: string | null
}> {
  const supabase = await createClient()

  // RLS (Row Level Security) maneja los permisos automáticamente
  // Permite ver actividades si: user_id = auth.uid() OR agency_id coincide
  let query = supabase.from('activities').select('*')

  if (filters?.contactId) {
    query = query.eq('contact_id', filters.contactId)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.scheduledAtFrom) {
    query = query.gte('scheduled_at', filters.scheduledAtFrom)
  }

  if (filters?.scheduledAtTo) {
    query = query.lte('scheduled_at', filters.scheduledAtTo)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching activities:', error)
    return { data: null, error: error.message }
  }

  return { data: data || [], error: null }
}

/**
 * Obtiene actividades con información del contacto
 * @param userId - ID del usuario (mantenido por compatibilidad, pero RLS maneja los permisos)
 * @param filters - Filtros opcionales
 * @returns Array de actividades con contacto o error
 */
export async function getActivitiesWithContact(
  userId: string,
  filters?: {
    contactId?: string
    status?: 'pending' | 'done'
    scheduledAtFrom?: string
    scheduledAtTo?: string
  }
): Promise<{
  data: ActivityWithContact[] | null
  error: string | null
}> {
  const supabase = await createClient()

  // RLS (Row Level Security) maneja los permisos automáticamente
  // Permite ver actividades si: user_id = auth.uid() OR agency_id coincide
  let query = supabase
    .from('activities')
    .select(`
      *,
      contact:contacts(id, first_name, last_name)
    `)

  if (filters?.contactId) {
    query = query.eq('contact_id', filters.contactId)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.scheduledAtFrom) {
    query = query.gte('scheduled_at', filters.scheduledAtFrom)
  }

  if (filters?.scheduledAtTo) {
    query = query.lte('scheduled_at', filters.scheduledAtTo)
  }

  const { data, error } = await query.order('scheduled_at', { ascending: true })

  if (error) {
    console.error('Error fetching activities with contact:', error)
    return { data: null, error: error.message }
  }

  // Normalizar contact (puede ser array o objeto)
  const normalizedData = (data || []).map((activity: any) => ({
    ...activity,
    contact: Array.isArray(activity.contact) ? activity.contact[0] : activity.contact,
  }))

  return { data: normalizedData, error: null }
}

/**
 * Obtiene una actividad por ID
 * @param activityId - ID de la actividad
 * @param userId - ID del usuario (mantenido por compatibilidad, pero RLS maneja los permisos)
 * @returns Actividad o error
 */
export async function getActivityById(
  activityId: string,
  userId: string
): Promise<{
  data: Activity | null
  error: string | null
}> {
  const supabase = await createClient()

  // RLS (Row Level Security) maneja los permisos automáticamente
  // Permite ver actividades si: user_id = auth.uid() OR agency_id coincide
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('id', activityId)
    .single()

  if (error) {
    console.error('Error fetching activity:', error)
    return { data: null, error: error.message }
  }

  if (!data) {
    return { data: null, error: 'Actividad no encontrada' }
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
 * Crea una nueva actividad
 * @param activityData - Datos de la actividad
 * @returns Actividad creada o error
 */
export async function createActivity(
  activityData: ActivityData
): Promise<{
  data: Activity | null
  error: string | null
}> {
  const supabase = await createClient()

  // Si no se proporciona agency_id, obtenerlo automáticamente del usuario
  if (!activityData.agency_id) {
    const agencyId = await getUserAgencyId(activityData.user_id)
    activityData.agency_id = agencyId
  }

  const { data, error } = await supabase
    .from('activities')
    .insert(activityData)
    .select()
    .single()

  if (error) {
    console.error('Error creating activity:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

/**
 * Actualiza una actividad existente
 * @param activityId - ID de la actividad
 * @param userId - ID del usuario (mantenido por compatibilidad, pero RLS maneja los permisos)
 * @param activityData - Datos actualizados de la actividad
 * @returns Actividad actualizada o error
 */
export async function updateActivity(
  activityId: string,
  userId: string,
  activityData: Partial<ActivityData>
): Promise<{
  data: Activity | null
  error: string | null
}> {
  const supabase = await createClient()

  // RLS (Row Level Security) maneja los permisos automáticamente
  // Permite actualizar si: user_id = auth.uid() OR agency_id coincide
  const { data, error } = await supabase
    .from('activities')
    .update(activityData)
    .eq('id', activityId)
    .select()
    .single()

  if (error) {
    console.error('Error updating activity:', error)
    return { data: null, error: error.message }
  }

  if (!data) {
    return { data: null, error: 'Actividad no encontrada' }
  }

  return { data, error: null }
}

/**
 * Actualiza el status de una actividad a 'done'
 * @param activityId - ID de la actividad
 * @param userId - ID del usuario (mantenido por compatibilidad, pero RLS maneja los permisos)
 * @returns Error si falla, null si tiene éxito
 */
export async function completeActivity(
  activityId: string,
  userId: string
): Promise<{
  error: string | null
}> {
  const supabase = await createClient()

  // RLS (Row Level Security) maneja los permisos automáticamente
  // Permite actualizar si: user_id = auth.uid() OR agency_id coincide
  // Esto permite que cualquier miembro del equipo complete actividades compartidas
  const { data, error } = await supabase
    .from('activities')
    .update({ status: 'done' })
    .eq('id', activityId)
    .select('id')
    .single()

  if (error) {
    console.error('Error completing activity:', error)
    return { error: error.message }
  }

  if (!data) {
    return { error: 'Actividad no encontrada o no tienes permisos' }
  }

  return { error: null }
}

/**
 * Elimina una actividad
 * @param activityId - ID de la actividad
 * @param userId - ID del usuario (para validar acceso)
 * @returns Error si falla, null si tiene éxito
 */
export async function deleteActivity(
  activityId: string,
  userId: string
): Promise<{
  error: string | null
}> {
  const supabase = await createClient()

  // Solo el dueño puede eliminar (RLS restringe automáticamente)
  // Usamos .select() para verificar si realmente se eliminó algo
  const { data, error } = await supabase
    .from('activities')
    .delete()
    .eq('id', activityId)
    .eq('user_id', userId)
    .select()

  if (error) {
    console.error('Error deleting activity:', error)
    return { error: error.message }
  }

  // Si no se eliminó nada, significa que RLS lo bloqueó (no es el dueño)
  if (!data || data.length === 0) {
    return { error: '❌ Restringido: Solo el propietario puede eliminar este registro.' }
  }

  return { error: null }
}

/**
 * Importa múltiples actividades en bulk
 * @param activities - Array de datos de actividades a importar
 * @returns Resultado de la importación con count y data
 */
export async function importActivities(
  activities: ActivityData[]
): Promise<{
  data: Activity[] | null
  error: string | null
  count?: number
}> {
  const supabase = await createClient()

  if (!Array.isArray(activities) || activities.length === 0) {
    return { data: null, error: 'El array de actividades está vacío o no es válido' }
  }

  // Asegurar que todas las actividades tengan agency_id
  // Agrupar por user_id para optimizar las queries
  const userIds = [...new Set(activities.map(a => a.user_id))]
  const agencyIdMap = new Map<string, string | null>()

  // Obtener agency_id para cada user_id único
  for (const userId of userIds) {
    const agencyId = await getUserAgencyId(userId)
    agencyIdMap.set(userId, agencyId)
  }

  // Asignar agency_id a las actividades que no lo tengan
  const activitiesWithAgency = activities.map(activity => ({
    ...activity,
    agency_id: activity.agency_id || agencyIdMap.get(activity.user_id) || null,
  }))

  const { data, error } = await supabase
    .from('activities')
    .insert(activitiesWithAgency)
    .select()

  if (error) {
    console.error('Error importing activities:', error)
    return { data: null, error: error.message }
  }

  return { data: data || [], error: null, count: activities.length }
}

/**
 * Verifica que una actividad existe y pertenece al usuario
 * @param activityId - ID de la actividad
 * @param userId - ID del usuario (mantenido por compatibilidad, pero RLS maneja los permisos)
 * @returns Datos básicos de la actividad o error
 */
export async function verifyActivityAccess(
  activityId: string,
  userId: string
): Promise<{
  data: { id: string; status: string } | null
  error: string | null
}> {
  const supabase = await createClient()

  // RLS (Row Level Security) maneja los permisos automáticamente
  // Permite ver actividades si: user_id = auth.uid() OR agency_id coincide
  const { data, error } = await supabase
    .from('activities')
    .select('id, status')
    .eq('id', activityId)
    .single()

  if (error || !data) {
    return { data: null, error: 'Actividad no encontrada o no tienes permisos' }
  }

  return { data, error: null }
}

