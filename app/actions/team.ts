'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { VALID_PLANS, PLAN_LIMITS } from '@/lib/config/subscription-plans'

// Definimos los tipos de planes válidos
type PlanType = 'starter' | 'pro' | 'agency'

export async function createAgency(name: string, plan: PlanType = 'starter') {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  if (!name || name.trim().length === 0) {
    return { error: 'El nombre de la agencia es requerido' }
  }

  // VALIDACIÓN DE PLANES ACTUALIZADA
  if (!VALID_PLANS.includes(plan)) {
    return { error: `Plan inválido. Debe ser uno de: ${VALID_PLANS.join(', ')}` }
  }

  try {
    // 1. Verificar si el usuario ya tiene una agencia
    // Usamos Admin para asegurar que vemos todo, o User para respetar lo que ve? 
    // Mejor User client para las lecturas "personales", pero para inserts críticos Admin.
    // Para simplificar y evitar RLS en la verificación también:
    const { data: existingMember } = await supabaseAdmin
      .from('agency_members')
      .select('agency_id')
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      // 1.1 FIX: Idempotencia para el plan Starter
      // Si el usuario ya tiene una agencia Starter y pide Starter (ej: volvió de Stripe o reintentó),
      // le devolvemos la existente en vez de error.
      const { data: existingAgency } = await supabaseAdmin
        .from('agencies')
        .select('*')
        .eq('id', existingMember.agency_id)
        .single()

      if (existingAgency && existingAgency.billing_plan === 'starter' && plan === 'starter') {
        return { success: true, agencyId: existingAgency.id, agency: existingAgency }
      }

      return { error: 'Ya perteneces a una agencia' }
    }

    // 2. Configurar límites según el plan
    const maxMembers = PLAN_LIMITS[plan].maxUsers

    // 3. Crear la agencia (CON ADMIN CLIENT - BYPASS RLS)
    const { data: agency, error: agencyError } = await supabaseAdmin
      .from('agencies')
      .insert({
        name: name.trim(),
        billing_plan: plan, // Aquí guardamos 'starter', 'pro' o 'agency'
        max_members: maxMembers,
      })
      .select()
      .single()

    if (agencyError) {
      console.error('Error creating agency:', agencyError)
      return { error: `Error al crear la agencia: ${agencyError.message}` }
    }

    // 4. Añadir al usuario como admin (Dueño) (CON ADMIN CLIENT)
    const { error: memberError } = await supabaseAdmin
      .from('agency_members')
      .insert({
        agency_id: agency.id,
        user_id: user.id,
        role: 'owner', // Es mejor usar 'owner' para el creador
      })

    if (memberError) {
      console.error('Error adding user as admin:', memberError)
      // Rollback: Borrar la agencia si falla la asignación
      await supabaseAdmin.from('agencies').delete().eq('id', agency.id)
      return { error: `Error al añadirte como administrador: ${memberError.message}` }
    }

    // Revalidar rutas
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings')

    return { success: true, agencyId: agency.id, agency }
  } catch (error) {
    console.error('Error inesperado en createAgency:', error)
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    return { error: `Error inesperado: ${errorMsg}` }
  }
}

export async function getMyAgency() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  try {
    // INTENTO 1: Cliente Normal (Respetando RLS)
    const { data: member, error: memberError } = await supabase
      .from('agency_members')
      .select(`
        agency_id,
        role,
        agencies!inner (
          id,
          name,
          phone,
          address,
          website,
          email_contact,
          created_at,
          subscription_status,
          billing_plan,
          max_members,
          settings_notifications
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (member) {
      return {
        agency: Array.isArray(member.agencies) ? member.agencies[0] : member.agencies,
        role: member.role,
        user: user
      }
    }

    // Si llegamos aquí es que no encontró nada o RLS falló.
    // En un caso normal no deberíamos usar AdminClient para esto por seguridad,
    // pero para depurar si el problema es RLS, podemos hacer un fallback.

    // Si realmente no tiene agencia, devolvemos null limpio
    return { agency: null, role: null, user }

  } catch (error) {
    console.error('Error inesperado en getMyAgency:', error)
    return { error: 'Error al obtener la agencia' }
  }
}

export async function getTeamMembers() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  try {
    // Paso 1: Validar mi pertenencia (Cliente Normal - Seguro)
    // Esto valida que el usuario realmente pertenece a una agencia
    const { data: myMember, error: memberError } = await supabase
      .from('agency_members')
      .select('agency_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !myMember) {
      // Si no tiene agencia, retornar array vacío en lugar de error
      return { success: true, members: [] }
    }

    // Crear Admin Client una vez para reutilizarlo
    const supabaseAdmin = createAdminClient()

    // Paso 2: Obtener TODOS los miembros (Cliente Admin - Salta RLS)
    // Esto devuelve todos los miembros de la agencia, no solo el propio
    const { data: allMembers, error: memberIdsError } = await supabaseAdmin
      .from('agency_members')
      .select('user_id, role, joined_at')
      .eq('agency_id', myMember.agency_id)

    if (memberIdsError || !allMembers) {
      console.error('Error fetching member IDs:', memberIdsError)
      return { error: `Error al obtener miembros: ${memberIdsError?.message || 'Error desconocido'}` }
    }

    // Paso 3: Usar Admin Client para obtener los emails de los usuarios
    const { data: { users: allUsers }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

    if (usersError) {
      console.error('Error fetching users from admin:', usersError)
      return { error: `Error al obtener información de usuarios: ${usersError.message}` }
    }

    // Paso 4: Filtrar y cruzar los datos en JavaScript
    // Crear un mapa de user_id -> email para búsqueda rápida
    const userMap = new Map<string, string>()
    if (allUsers) {
      allUsers.forEach((u) => {
        if (u.email) {
          userMap.set(u.id, u.email)
        }
      })
    }

    // Combinar los datos: recorrer allMembers y buscar el email correspondiente
    const teamMembers = allMembers.map((member) => {
      const email = userMap.get(member.user_id) || 'Email no disponible'
      return {
        id: member.user_id, // Usar user_id como id para compatibilidad
        user_id: member.user_id,
        email: email,
        role: member.role,
        name: email !== 'Email no disponible' ? email.split('@')[0] : 'Usuario',
        joined_at: member.joined_at,
      }
    })

    return { success: true, members: teamMembers }
  } catch (error) {
    console.error('Error inesperado en getTeamMembers:', error)
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    return { error: `Error inesperado: ${errorMsg}` }
  }
}

export async function inviteMember(email: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  if (!email || email.trim().length === 0) {
    return { error: 'El email es requerido' }
  }

  try {
    // Obtener la agencia del usuario y verificar que es admin
    const { data: myMember } = await supabase
      .from('agency_members')
      .select('agency_id, role')
      .eq('user_id', user.id)
      .single()

    if (!myMember) {
      return { error: 'No perteneces a ninguna agencia' }
    }

    if (myMember.role !== 'admin' && myMember.role !== 'owner' && myMember.role !== 'manager') {
      return { error: 'No tienes permisos para invitar miembros' }
    }

    // Retornar el código de invitación (el agency_id)
    return {
      success: true,
      invitationCode: myMember.agency_id,
      message: `Comparte este código con ${email}: ${myMember.agency_id}`,
    }
  } catch (error) {
    console.error('Error inesperado en inviteMember:', error)
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    return { error: `Error inesperado: ${errorMsg}` }
  }
}

export async function updateAgency(agencyId: string, newName: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  if (!agencyId || agencyId.trim().length === 0) {
    return { error: 'El ID de la agencia es requerido' }
  }

  if (!newName || newName.trim().length === 0) {
    return { error: 'El nombre de la agencia es requerido' }
  }

  try {
    // Verificación de Rol: Consultar agency_members para verificar que el usuario es admin
    const { data: myMember, error: memberError } = await supabase
      .from('agency_members')
      .select('role, agency_id')
      .eq('user_id', user.id)
      .eq('agency_id', agencyId.trim())
      .single()

    if (memberError || !myMember) {
      return { error: 'No tienes permisos para actualizar esta agencia' }
    }

    // Verificar que el usuario es admin
    if (myMember.role !== 'admin') {
      return { error: 'Solo los administradores pueden actualizar el nombre de la agencia' }
    }

    // Actualizar el nombre de la agencia
    const { error: updateError } = await supabase
      .from('agencies')
      .update({ name: newName.trim() })
      .eq('id', agencyId.trim())

    if (updateError) {
      console.error('Error updating agency:', updateError)
      return { error: `Error al actualizar la agencia: ${updateError.message}` }
    }

    // Revalidar las rutas
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings/team')

    return { success: true }
  } catch (error) {
    console.error('Error inesperado en updateAgency:', error)
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    return { error: `Error inesperado: ${errorMsg}` }
  }
}

export async function joinAgency(agencyId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  if (!agencyId || agencyId.trim().length === 0) {
    return { error: 'El código de invitación es requerido' }
  }

  try {
    // LLAMADA A LA RPC
    const { data, error } = await supabase.rpc('join_agency_securely', {
      target_agency_id: agencyId.trim(),
    })

    if (error) {
      console.error('Error joining agency:', error)
      return { error: 'Error al unirse: ' + error.message }
    }

    if (data === false) {
      return { error: 'Código de invitación inválido (Agencia no encontrada)' }
    }

    revalidatePath('/dashboard/settings/team')
    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error inesperado en joinAgency:', error)
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    return { error: `Error inesperado: ${errorMsg}` }
  }
}

export async function joinTeamOnboarding(inviteCode: string) {
  // Cliente normal para obtener el usuario autenticado
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  if (!inviteCode || inviteCode.trim().length === 0) {
    return { error: 'El código de invitación es requerido' }
  }

  try {
    // Cliente admin para saltar RLS en validaciones
    const adminClient = createAdminClient()
    const trimmedCode = inviteCode.trim()

    // CHECK 1: Verificar que la agencia existe
    const { data: agency, error: agencyError } = await adminClient
      .from('agencies')
      .select('id, name, subscription_status, max_members')
      .eq('id', trimmedCode)
      .single()

    if (agencyError || !agency) {
      return { error: 'Código de invitación inválido o agencia no encontrada' }
    }

    // CHECK 2: Verificar que la agencia tiene suscripción activa o en trialing
    if (agency.subscription_status !== 'active' && agency.subscription_status !== 'trialing') {
      return { error: 'Esta agencia no tiene una suscripción activa. Contacta al administrador.' }
    }

    // CHECK 3: Verificar que hay espacio disponible
    const { count: currentMembersCount, error: countError } = await adminClient
      .from('agency_members')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agency.id)

    if (countError) {
      console.error('Error counting members:', countError)
      return { error: 'Error al verificar disponibilidad de la agencia' }
    }

    if (currentMembersCount === null || currentMembersCount >= agency.max_members) {
      return { error: 'Esta agencia ha alcanzado el límite de usuarios permitidos' }
    }

    // CRÍTICO: Limpiar cualquier rastro anterior del usuario en agency_members
    // Esto incluye agencies con status 'incomplete' creadas durante el registro
    // Si el usuario ya tenía una membresía, la eliminamos antes de añadirlo a la nueva agencia
    const { error: deleteError } = await adminClient
      .from('agency_members')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting previous agency membership:', deleteError)
      // No devolvemos error aquí, continuamos intentando añadir al nuevo equipo
      // Es posible que no haya membresía previa, lo cual está bien
    }

    // Añadir al usuario a la nueva agencia con rol 'agent'
    const { error: insertError } = await adminClient
      .from('agency_members')
      .insert({
        agency_id: agency.id,
        user_id: user.id,
        role: 'agent',
      })

    if (insertError) {
      console.error('Error adding user to agency:', insertError)
      return { error: 'Error al unirte al equipo: ' + insertError.message }
    }

    console.log(`🔒 AUDIT: User ${user.id} (${user.email}) join_team_onboarding agency=${agency.id} timestamp=${new Date().toISOString()}`)

    revalidatePath('/dashboard', 'layout')
    revalidatePath('/dashboard/settings/team')
    revalidatePath('/dashboard/settings')

    return { success: true, agencyName: agency.name }
  } catch (error) {
    console.error('Error inesperado en joinTeamOnboarding:', error)
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    return { error: `Error inesperado: ${errorMsg}` }
  }
}

// Actualizar detalles de la agencia (Identidad)
export async function updateAgencyDetails(formData: FormData) {
  const supabase = await createClient()

  // 1. Verificamos usuario
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // 2. Verificamos agencia
  const { agency, role } = await getMyAgency()

  console.log("DEBUG - Usuario:", user.id)           // <--- LOG
  console.log("DEBUG - Agencia encontrada:", agency)  // <--- LOG
  console.log("DEBUG - Rol del usuario:", role)       // <--- LOG

  if (!agency) return { error: 'No tienes agencia asignada' }

  // 3. Recogemos datos
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const website = formData.get('website') as string
  const email_contact = formData.get('email_contact') as string

  console.log("DEBUG - Intentando actualizar a:", { name, phone }) // <--- LOG

  // 4. Ejecutamos Update
  const { data, error } = await supabase
    .from('agencies')
    .update({
      name,
      phone,
      address,
      website,
      email_contact
    })
    .eq('id', agency.id)
    .select() // <--- IMPORTANTE: Añade .select() para ver si devuelve el dato cambiado

  if (error) {
    console.error('DEBUG - Error Supabase:', error) // <--- LOG ERROR
    return { error: 'Error al actualizar datos en BD' }
  }

  // Si data está vacío, es que RLS bloqueó la escritura o el ID no coincidió
  if (!data || data.length === 0) {
    console.error('DEBUG - RLS Bloqueó la escritura o ID incorrecto')
    return { error: 'No tienes permisos para editar esta agencia' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function removeMember(userIdToRemove: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  if (!userIdToRemove || userIdToRemove.trim().length === 0) {
    return { error: 'El ID del usuario es requerido' }
  }

  // No permitir eliminar a uno mismo
  if (user.id === userIdToRemove) {
    return { error: 'No puedes eliminarte a ti mismo' }
  }

  try {
    // Verificar que el usuario actual es owner de la agencia
    const { data: myMember } = await supabase
      .from('agency_members')
      .select('agency_id, role')
      .eq('user_id', user.id)
      .single()

    if (!myMember) {
      return { error: 'No perteneces a ninguna agencia' }
    }

    if (myMember.role !== 'owner' && myMember.role !== 'admin' && myMember.role !== 'manager') {
      return { error: 'No tienes permisos para eliminar miembros' }
    }

    // Verificar que el usuario a eliminar pertenece a la misma agencia
    const { data: targetMember } = await supabase
      .from('agency_members')
      .select('agency_id, role')
      .eq('user_id', userIdToRemove)
      .single()

    if (!targetMember) {
      return { error: 'Usuario no encontrado en el equipo' }
    }

    if (targetMember.agency_id !== myMember.agency_id) {
      return { error: 'El usuario no pertenece a tu agencia' }
    }

    // Reglas de jerarquía
    // 1. Managers no pueden eliminar a Owners ni Admins
    if (myMember.role === 'manager' && (targetMember.role === 'owner' || targetMember.role === 'admin' || targetMember.role === 'manager')) {
      return { error: 'No tienes permisos para eliminar a este miembro' }
    }

    // Usar admin client para eliminar el miembro (salta RLS)
    const supabaseAdmin = createAdminClient()

    const { error: deleteError } = await supabaseAdmin
      .from('agency_members')
      .delete()
      .eq('user_id', userIdToRemove)
      .eq('agency_id', myMember.agency_id)

    if (deleteError) {
      console.error('Error removing member:', deleteError)
      return { error: `Error al eliminar miembro: ${deleteError.message}` }
    }

    revalidatePath('/dashboard/settings/team')
    revalidatePath('/dashboard/settings')

    return { success: true }
  } catch (error) {
    console.error('Error inesperado en removeMember:', error)
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    return { error: `Error inesperado: ${errorMsg}` }
  }
}


export async function updateMemberRole(targetUserId: string, newRole: 'agent' | 'manager') {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  try {
    const { data: myMember } = await supabase
     .from('agency_members')
     .select('agency_id, role')
     .eq('user_id', user.id)
     .single()
    
    if (!myMember) return { error: 'No tienes agencia' }
    
    const isOwner = myMember.role === 'owner' || myMember.role === 'admin'
    if (!isOwner) {
        return { error: 'Solo el dueño puede cambiar roles' }
    }

    const { data: targetMember } = await supabase
        .from('agency_members')
        .select('role, agency_id')
        .eq('user_id', targetUserId)
        .single()
    
    if (!targetMember) return { error: 'Usuario no encontrado' }
    if (targetMember.agency_id !== myMember.agency_id) return { error: 'El usuario no es de tu equipo' }

    if (targetMember.role === 'owner') return { error: 'No se puede modificar el rol del dueño' }

    const supabaseAdmin = createAdminClient()
    const { error: updateError } = await supabaseAdmin
        .from('agency_members')
        .update({ role: newRole })
        .eq('user_id', targetUserId)
        .eq('agency_id', myMember.agency_id)

    if (updateError) throw updateError

    revalidatePath('/dashboard/settings/team')
    return { success: true }
  } catch (err: any) {
    console.error('Error updating role:', err)
    return { error: `Error al actualizar rol: ${err.message}` }
  }
}
