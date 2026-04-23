'use server'

import { createClient } from '@/lib/supabase/server'
import { getMyAgency } from '@/app/actions/team'
import { revalidatePath } from 'next/cache'

export async function createGoal(
  userId: string | 'all',
  type: 'contacts_created' | 'properties_listed',
  target: number,
  period: 'monthly' | 'quarterly' | 'yearly'
) {
  const supabase = await createClient()
  const { agency, role } = await getMyAgency()

  // Seguridad: Solo dueños/admins pueden asignar tareas
  if (!agency || (role !== 'owner' && role !== 'admin')) {
    return { error: 'No tienes permisos para asignar objetivos' }
  }

  // 1. Calcular fechas de inicio y fin según el periodo
  const now = new Date()
  let startDate = new Date()
  let endDate = new Date()

  if (period === 'monthly') {
    // Del día 1 al último de este mes
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  } else if (period === 'quarterly') {
    // Calcular trimestre actual
    const quarter = Math.floor(now.getMonth() / 3)
    startDate = new Date(now.getFullYear(), quarter * 3, 1)
    endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0)
  } else if (period === 'yearly') {
    // Todo el año
    startDate = new Date(now.getFullYear(), 0, 1)
    endDate = new Date(now.getFullYear(), 11, 31)
  }

  // 2. Insertar en Base de Datos
  const payload = {
    agency_id: agency.id,
    user_id: userId === 'all' ? null : userId, // NULL = Objetivo global de agencia
    type,
    target_value: target,
    period,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
  }

  const { error } = await supabase.from('goals').insert(payload)

  if (error) {
    console.error('Error creating goal:', error)
    return { error: 'Error al crear el objetivo' }
  }

  revalidatePath('/dashboard/analytics')
  return { success: true }
}

