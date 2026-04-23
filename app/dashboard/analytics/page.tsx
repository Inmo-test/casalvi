import { getAgencyAnalytics } from '@/lib/services/analytics-service'
import { getAgencyMembers } from '@/lib/services/team-service'
import { getMyAgency } from '@/app/actions/team'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@casalvi/ui"
import { OverviewChart } from '@/components/analytics/overview-chart'
import { GoalsProgress } from '@/components/analytics/goals-progress'
import { AgentSelector } from '@/components/analytics/agent-selector'
import { CreateGoalDialog } from '@/components/analytics/create-goal-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@casalvi/ui"
import { Button } from "@casalvi/ui"
import { TrendingUp, Target, Zap, BarChart3 } from 'lucide-react'
import { getAgentComparison } from '@/lib/services/analytics-service'
import { ComparisonChart } from '@/components/analytics/comparison-chart'
import Link from 'next/link'
import { AnalyticsHeader } from '@/components/analytics/analytics-header'

export const dynamic = 'force-dynamic'

// Esta interfaz permite leer los parámetros de la URL (?agentId=...)
export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = await createClient()
  const { agency, role } = await getMyAgency()

  if (!agency) return <div>No tienes agencia</div>

  // Obtener el usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 1. DETERMINAR PERMISOS "MODO DIOS"
  const isManagement = role === 'owner' || role === 'admin'

  // 2. OBTENER LISTA DE AGENTES (Solo si es Manager)
  const members = isManagement ? await getAgencyMembers(agency.id) : []

  // 3. DETERMINAR DE QUIÉN VEMOS LOS DATOS
  let targetUserId: string | undefined
  if (isManagement) {
    // Si soy jefe, miro la URL.
    // Si hay ?agentId=xyz, uso ese. Si no, undefined (veo todo).
    const paramId = searchParams['agentId']
    if (typeof paramId === 'string') {
      targetUserId = paramId
    }
  } else {
    // Si soy agente, SIEMPRE veo mis datos, ignoro la URL.
    targetUserId = user?.id
  }

  // 4. OBTENER ANALÍTICAS
  let data
  let comparisonData = null

  if (targetUserId && isManagement) {
    // Si estamos viendo a un agente específico como manager -> MODO COMPARATIVA

    // Obtener datos completos del agente (incluye chartData)
    const agentFullDocs = await getAgencyAnalytics(agency.id, targetUserId)
    data = agentFullDocs

    // Obtener datos globales para la comparativa
    const agencyFullDocs = await getAgencyAnalytics(agency.id)
    comparisonData = {
      agent: agentFullDocs.stats,
      agency: agencyFullDocs.stats
    }

  } else {
    // Modo normal (Agencia global o Agente viéndose a sí mismo)
    data = await getAgencyAnalytics(agency.id, targetUserId)
  }

  // Determinar icono
  const AnalyticsIcon = (await import('lucide-react')).TrendingUp

  return (
    <div className="flex flex-col h-screen bg-background animate-in fade-in duration-500">

      {/* HEADER FIJO */}
      <div className="p-4 md:p-6 bg-background border-b z-20 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Analíticas
            </h1>
            <p className="text-muted-foreground mt-1">
              Métricas clave y rendimiento de tu agencia
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isManagement && (
              <AgentSelector members={members} />
            )}
            <CreateGoalDialog members={members} />
          </div>
        </div>
      </div>

      {/* CONTENIDO SCROLLABLE */}
      <div className="flex-1 overflow-y-auto bg-muted/10 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6 pb-20">

          <Tabs defaultValue="overview" className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList className="bg-card border shadow-sm">
                <TabsTrigger value="overview">Resumen General</TabsTrigger>
                <TabsTrigger value="reports" disabled className="opacity-50">
                  Informes (Próximamente)
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6">
              {/* TARJETAS DE KPIs */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Contactos (30 días)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-medium text-primary">+{data.stats.totalContacts}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {targetUserId ? 'Rendimiento individual' : 'Rendimiento de agencia'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Propiedades (30 días)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-medium text-primary">+{data.stats.totalProperties}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {targetUserId ? 'Rendimiento individual' : 'Rendimiento de agencia'}
                    </p>
                  </CardContent>
                </Card>

                {/* Eficiencia de Cierre */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Eficiencia de Cierre</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-medium">{data.stats.conversionRate}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ratio Actividad → Cita
                    </p>
                  </CardContent>
                </Card>

                {/* Calidad de Cartera */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Calidad de Cartera</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`
                      text-2xl font-medium
                      ${data.stats.avgLeadScore >= 70 ? 'text-green-600' : ''}
                      ${data.stats.avgLeadScore < 40 ? 'text-red-600' : ''}
                      ${data.stats.avgLeadScore >= 40 && data.stats.avgLeadScore < 70 ? 'text-foreground' : ''}
                    `}>
                      {data.stats.avgLeadScore}/100
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Score Promedio
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* SECCIÓN COMPARATIVA (Solo si hay datos de comparación) */}
              {comparisonData && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Comparativa con el Promedio de la Agencia
                  </h3>
                  <ComparisonChart
                    agentStats={comparisonData.agent}
                    agencyStats={comparisonData.agency}
                  />
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* GRÁFICO PRINCIPAL */}
                <Card className="col-span-4 shadow-sm">
                  <CardHeader>
                    <CardTitle>
                      {targetUserId ? 'Actividad del Agente' : 'Actividad Global de la Agencia'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <OverviewChart data={data.chartData} />
                  </CardContent>
                </Card>
                {/* OBJETIVOS Y METAS */}
                <Card className="col-span-3 shadow-sm bg-card/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Objetivos
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {isManagement && !targetUserId
                        ? 'Progreso global de la agencia'
                        : 'Progreso hacia las metas asignadas'}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <GoalsProgress goals={data.goals} stats={data.stats} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

