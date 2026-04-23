import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getAgencyMembers(agencyId: string) {
  const supabase = await createClient()

  // 1. Obtener usuario actual para verificar permisos
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // 2. Verificar rol en la agencia
  const { data: myMember } = await supabase
    .from('agency_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('agency_id', agencyId)
    .single()

  const isAdmin = myMember?.role === 'admin' || myMember?.role === 'owner'

  // 3. Elegir cliente (AdminClient si es admin, para ver a todos sin restricciones RLS complicadas)
  // Si es agente, usa cliente normal (verá solo lo que RLS permita, usualmente a sí mismo o compañeros si está configurado)
  const dbClient = isAdmin ? createAdminClient() : supabase

  // 4. Obtener miembros
  const { data: members, error: membersError } = await dbClient
    .from('agency_members')
    .select('user_id, is_admin, role, joined_at')
    .eq('agency_id', agencyId)

  if (membersError) {
    console.error('Error fetching members:', membersError)
    return []
  }

  if (!members || members.length === 0) return []

  // 5. Obtener perfiles (usando AdminClient si somos admin para asegurar que leemos emails/nombres)
  const userIds = members.map(m => m.user_id)

  const { data: profiles, error: profilesError } = await dbClient
    .from('profiles')
    .select('id, first_name, last_name, email')
    .in('id', userIds)

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
    // Devolvemos miembros sin nombre si falla el perfil
    return members.map(m => ({
      userId: m.user_id,
      role: m.role,
      isAdmin: m.is_admin,
      name: `Agente ${m.user_id.substring(0, 4)}`,
      email: '',
      joinedAt: m.joined_at
    }))
  }

  // 3. Cruzar datos en memoria
  const profileMap = new Map(profiles?.map(p => [p.id, p]))

  return members.map(m => {
    const profile = profileMap.get(m.user_id)
    return {
      userId: m.user_id,
      role: m.role,
      isAdmin: m.is_admin,
      name: profile?.first_name
        ? `${profile.first_name} ${profile.last_name || ''}`.trim()
        : `Agente ${m.user_id.substring(0, 4)}`,
      email: profile?.email || '',
      joinedAt: m.joined_at,
    }
  })
}

