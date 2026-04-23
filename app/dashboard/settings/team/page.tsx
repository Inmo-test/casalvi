import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamPageContent } from '@/components/settings/team-page-content'
import { getTeamMembers, getMyAgency } from '@/app/actions/team'
import { Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from "@casalvi/ui"

export default async function TeamPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // 1. Obtener Agencia y Rol
  const agencyResult = await getMyAgency()
  const agency = agencyResult.agency
  const userRole = agencyResult.role

  // 2. Protección de Plan (Solo Agencias)
  if (!agency || agency.billing_plan === 'freelance') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 text-center p-6">
        <div className="p-4 bg-blue-50 rounded-full">
          <Users className="w-12 h-12 text-blue-500" />
        </div>
        <div className="max-w-md space-y-2">
            <h2 className="text-2xl font-medium">Función Premium</h2>
            <p className="text-muted-foreground">
            La gestión de equipos solo está disponible en el Plan Agencia.
            Actualiza tu suscripción para invitar a otros agentes.
            </p>
        </div>
        <Link href="/dashboard/settings">
            <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Configuración
            </Button>
        </Link>
      </div>
    )
  }

  // 3. Obtener MIEMBROS (RPC)
  let members: any[] = []
  if (agency) {
    const membersResult = await getTeamMembers()
    if (membersResult.success && membersResult.members) {
      members = membersResult.members.map((m: any) => ({
        id: m.id,
        user_id: m.user_id || m.id,
        email: m.email || 'Email no disponible',
        role: m.role,
        avatar_url: m.avatar_url, // Si la RPC lo devuelve
        joined_at: m.joined_at || new Date().toISOString(),
        // Mejora: Intentar usar nombre real si existe, si no el email
        name: (m.first_name && m.last_name) 
            ? `${m.first_name} ${m.last_name}` 
            : (m.email ? m.email.split('@')[0] : 'Usuario'),
      }))
    }
  }

  // 4. Obtener INVITACIONES PENDIENTES (Nueva funcionalidad)
  const { data: invitations } = await supabase
    .from('agency_invitations')
    .select('*')
    .eq('agency_id', agency.id)
    .eq('status', 'pending') // Solo las que no han sido aceptadas
    .order('created_at', { ascending: false })

  return (
    <TeamPageContent
      userEmail={user.email || ''}
      agency={agency}
      userRole={userRole}
      members={members}
      invitations={invitations || []} // Pasamos las invitaciones al componente visual
    />
  )
}

