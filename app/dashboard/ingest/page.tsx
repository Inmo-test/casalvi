import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyAgency } from '@/app/actions/team'
import { listIngestedDocuments } from '@/app/actions/ingest'
import { Card, CardContent, CardHeader, CardTitle } from '@casalvi/ui'
import { FolderOpen, FileText } from 'lucide-react'
import { IngestRunner } from '@/components/ingest/ingest-runner'

export const dynamic = 'force-dynamic'

export default async function IngestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { agency } = await getMyAgency()
  if (!agency) return <div className="p-8">Sin agencia</div>

  const docs = await listIngestedDocuments()

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="border-b bg-card shrink-0 z-20 shadow-sm">
        <div className="px-6 py-5">
          <h1 className="text-2xl font-medium tracking-tight text-foreground flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-primary" />
            Ingesta de archivos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Indexa PDFs y documentos locales. El sistema los clasifica y los
            vincula a contactos o a zonas automáticamente.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-muted/10">
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
          <IngestRunner />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Documentos vinculados a contactos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {'error' in docs ? (
                <p className="text-sm text-destructive">{docs.error}</p>
              ) : docs.contactDocs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no has indexado documentos.</p>
              ) : (
                <ul className="space-y-2">
                  {docs.contactDocs.map((d: any) => (
                    <li key={d.id} className="rounded border bg-card p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{d.original_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {d.contacts ? `${d.contacts.first_name} ${d.contacts.last_name}` : 'sin vincular'}
                        </span>
                      </div>
                      {d.summary && <p className="text-xs text-muted-foreground mt-1">{d.summary}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {!('error' in docs) && docs.nbhdDocs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Documentos de zona</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {docs.nbhdDocs.map((d: any) => (
                    <li key={d.id} className="rounded border bg-card p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{d.original_name}</span>
                        <span className="text-xs text-muted-foreground">{d.zone ?? '—'}</span>
                      </div>
                      {d.summary && <p className="text-xs text-muted-foreground mt-1">{d.summary}</p>}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
