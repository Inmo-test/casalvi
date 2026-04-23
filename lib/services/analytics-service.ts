import { createClient } from '@/lib/supabase/server'

export async function getAgencyAnalytics(agencyId: string, userId?: string) {
  const supabase = await createClient()

  // Definimos el rango (Ej: Últimos 30 días)
  const today = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(today.getDate() - 30)

  // EJECUTAR CONSULTAS EN PARALELO con Promise.all
  const [
    contactsResult,
    propertiesResult,
    activitiesResult,
    contactsWithScoreResult,
    goalsResult
  ] = await Promise.all([
    // 1. CONSULTA DE CONTACTOS (Evolución diaria)
    (() => {
      let query = supabase
        .from('contacts')
        .select('created_at')
        .eq('agency_id', agencyId)
        .gte('created_at', thirtyDaysAgo.toISOString())

      if (userId) {
        query = query.eq('user_id', userId)
      }

      return query
    })(),

    // 2. CONSULTA DE PROPIEDADES
    (() => {
      let propQuery = supabase
        .from('properties')
        .select('created_at, price')
        .eq('agency_id', agencyId)
        .gte('created_at', thirtyDaysAgo.toISOString())

      if (userId) {
        propQuery = propQuery.eq('user_id', userId)
      }

      return propQuery
    })(),

    // 3. CONSULTA DE ACTIVIDADES (Para métricas de eficiencia)
    (() => {
      let activitiesQuery = supabase
        .from('activities')
        .select('outcome, created_at')
        .eq('agency_id', agencyId)
        .gte('created_at', thirtyDaysAgo.toISOString())

      if (userId) {
        activitiesQuery = activitiesQuery.eq('user_id', userId)
      }

      return activitiesQuery
    })(),

    // 4. CONSULTA DE CONTACTOS CON LEAD_SCORE (Para promedio)
    (() => {
      let contactsScoreQuery = supabase
        .from('contacts')
        .select('lead_score')
        .eq('agency_id', agencyId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('lead_score', 'is', null) // Solo los que tienen score

      if (userId) {
        contactsScoreQuery = contactsScoreQuery.eq('user_id', userId)
      }

      return contactsScoreQuery
    })(),

    // 5. OBJETIVOS (GOALS)
    (() => {
      let goalsQuery = supabase
        .from('goals')
        .select('*')
        .eq('agency_id', agencyId)
        .gte('end_date', new Date().toISOString())

      if (userId) {
        goalsQuery = goalsQuery.eq('user_id', userId)
      }

      return goalsQuery
    })()
  ])

  const contactsData = contactsResult.data || []
  const propertiesData = propertiesResult.data || []
  const activitiesData = activitiesResult.data || []
  const contactsWithScore = contactsWithScoreResult.data || []
  const { data: goals, error: goalsError } = goalsResult

  // Si la tabla goals no existe, simplemente retornamos un array vacío
  if (goalsError && goalsError.code === 'PGRST116') {
    console.warn('Tabla "goals" no encontrada. Los objetivos están deshabilitados.')
  }

  // 3. PROCESAR DATOS PARA LA GRÁFICA (Agrupar por día)
  const chartData = processChartData(contactsData, propertiesData, thirtyDaysAgo)

  // 4. CALCULAR MÉTRICAS DE EFICIENCIA
  const totalActivities = activitiesData.length

  // Actividades con outcome de conversión (visitas o reuniones agendadas)
  const conversionVisits = activitiesData.filter((activity: any) => {
    const outcome = activity.outcome
    return outcome === 'meeting_scheduled' ||
      outcome === 'visit_scheduled' ||
      outcome === 'callback_scheduled'
  }).length

  // Tasa de conversión (porcentaje con 1 decimal)
  const conversionRate = totalActivities > 0
    ? Number(((conversionVisits / totalActivities) * 100).toFixed(1))
    : 0

  // Promedio de lead_score (0-100)
  const avgLeadScore = contactsWithScore.length > 0
    ? Number((contactsWithScore.reduce((sum: number, contact: any) => {
      const score = Number(contact.lead_score) || 0
      return sum + Math.max(0, Math.min(100, score)) // Clamp entre 0 y 100
    }, 0) / contactsWithScore.length).toFixed(1))
    : 0

  return {
    chartData,
    goals: goals || [],
    stats: {
      totalContacts: contactsData.length,
      totalProperties: propertiesData.length,
      totalPropertyValue: propertiesData.reduce((sum, p) => sum + (Number(p.price) || 0), 0),
      // NUEVAS MÉTRICAS DE EFICIENCIA
      totalActivities,
      conversionRate,
      avgLeadScore,
    },
  }
}

// Función auxiliar para formatear datos para Recharts
function processChartData(contacts: any[], properties: any[], startDate: Date) {
  const data = []

  const currentDate = new Date(startDate)
  const now = new Date()

  while (currentDate <= now) {
    const dateStr = currentDate.toISOString().split('T')[0] // YYYY-MM-DD

    // Contamos cuántos cayeron en este día
    const contactsCount = contacts.filter((c) => c.created_at.startsWith(dateStr)).length
    const propertiesCount = properties.filter((p) => p.created_at.startsWith(dateStr)).length

    data.push({
      date: dateStr, // Eje X
      contactos: contactsCount,
      propiedades: propertiesCount,
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return data
}

// NUEVO: Obtener comparativa Agente vs Agencia
export async function getAgentComparison(agencyId: string, userId: string) {
  // 1. Obtener datos globales (Benchmark)
  const globalAnalytics = await getAgencyAnalytics(agencyId)

  // 2. Obtener datos del agente
  const agentAnalytics = await getAgencyAnalytics(agencyId, userId)

  // 3. Crear comparativa
  return {
    agent: agentAnalytics.stats,
    agency: globalAnalytics.stats, // Esto son los totales de la agencia, no el promedio por agente.
    // Para comparar "Performance", usamos las tasas (Conversion Rate, Lead Score) que son porcentuales.
    goals: agentAnalytics.goals
  }
}


