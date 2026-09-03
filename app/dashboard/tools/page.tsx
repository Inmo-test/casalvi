import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ActivityCsvImporter } from '@/components/activities/activity-csv-importer'
import { CsvImporter } from '@/components/contacts/csv-importer'
import { AiQueueProcessor } from '@/components/tools/ai-queue-processor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Database, Upload, FileText, AlertCircle } from 'lucide-react'
import { getMyAgency } from '@/app/actions/team'
import { ToolsHeader } from '@/components/tools/tools-header'

export const dynamic = 'force-dynamic'

export default async function ToolsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { agency, role } = await getMyAgency()

  if (!agency) return <div>No tienes agencia</div>

  return (
    <div className="flex flex-col h-screen bg-background animate-in fade-in duration-500">
      {/* HEADER FIJO */}
      <ToolsHeader />

      {/* CONTENIDO SCROLLABLE */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-muted/10">
        <div className="max-w-5xl mx-auto space-y-8 pb-20">

          {/* Cola de Procesamiento IA */}
          <AiQueueProcessor />

          <div className="grid gap-6 md:grid-cols-2">
            {/* Importar Contactos */}
            <Card className="shadow-sm border-0 border-t-4 border-t-blue-500 bg-card rounded-xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                    <Database className="h-5 w-5 text-[#007AFF] dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Importar Contactos</CardTitle>
                    <CardDescription>Desde archivo CSV</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Sube tu base de datos de clientes. El sistema detectará automáticamente columnas como Nombre, Email, Teléfono.
                  </p>
                  <div className="bg-muted/30 p-4 rounded-lg border border-border">
                    <CsvImporter />
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50/50 dark:bg-blue-900/20 p-4 text-xs space-y-2 border border-blue-100/50 dark:border-blue-800/50 text-muted-foreground">
                  <p className="font-medium text-[#0062CC] dark:text-blue-400">Columnas soportadas:</p>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-1 list-disc list-inside">
                    <li>Nombre Completo</li>
                    <li>Email</li>
                    <li>Teléfono</li>
                    <li>Rol (Propietario / Comprador)</li>
                    <li>Presupuesto</li>
                    <li>Zona</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Importar Actividades */}
            <Card className="shadow-sm border-0 border-t-4 border-t-amber-500 bg-card rounded-xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Importar Actividades</CardTitle>
                    <CardDescription>Historial de interacciones</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Vincula historial de llamadas, visitas o notas a contactos existentes mediante email o teléfono.
                  </p>
                  <div className="bg-muted/30 p-4 rounded-lg border border-border">
                    <ActivityCsvImporter />
                  </div>
                </div>

                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 p-3 text-xs space-y-2 text-amber-800 dark:text-amber-400">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Importante</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 opacity-90">
                    <li>Requiere que el contacto ya exista</li>
                    <li>Búsqueda por Email, Teléfono o Nombre</li>
                    <li>Registros huérfanos se omitirán</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Guía */}
          <Card className="bg-muted/30 border-dashed border-2 border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base text-foreground">Información Técnica del CSV</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8 text-sm">
                <div>
                  <h4 className="font-medium mb-2 text-foreground">Formato Requerido</h4>
                  <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                    <li>Encabezados en la primera fila</li>
                    <li>Codificación UTF-8</li>
                    <li>Delimitador: Coma (,) o Punto y coma (;)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-foreground">Tips de Éxito</h4>
                  <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                    <li>Normaliza los teléfonos (ej. +34...)</li>
                    <li>Usa fechas ISO 8601 (YYYY-MM-DD)</li>
                    <li>Verifica emails duplicados antes de subir</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

