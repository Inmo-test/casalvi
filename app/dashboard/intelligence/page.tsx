import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyAgency } from '@/app/actions/team'
import { getTopSellers } from '@/app/actions/intelligence'
import { Card, CardContent, CardHeader, CardTitle } from '@casalvi/ui'
import { Brain, Phone, Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function IntelligencePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { agency } = await getMyAgency()
  if (!agency) return <div className="p-8">Sin agencia</div>

  const sellers = await getTopSellers({ limit: 10 })

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="border-b bg-card shrink-0 z-20 shadow-sm">
        <div className="px-6 py-5">
          <h1 className="text-2xl font-medium tracking-tight text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Inteligencia
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Rankings predictivos basados en documentos indexados e interacciones.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-muted/10">
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Top 10 propietarios propensos a vender
              </CardTitle>
            </CardHeader>
            <CardContent>
              {'error' in sellers ? (
                <p className="text-sm text-destructive">{sellers.error}</p>
              ) : sellers.results.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay propietarios con suficiente señal. Indexa documentos en{' '}
                  <Link href="/dashboard/ingest" className="text-primary underline">
                    Ingesta
                  </Link>
                  .
                </p>
              ) : (
                <div className="space-y-3">
                  {sellers.results.map((s) => (
                    <Link
                      key={s.contactId}
                      href={`/dashboard/contacts/${s.contactId}`}
                      className="block rounded-lg border bg-card p-4 hover:border-primary transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-primary/10 text-primary p-2">
                            <Phone className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{s.contactName}</p>
                            <p className="text-xs text-muted-foreground">
                              Horizonte {s.horizonDays} días
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-primary">{s.probability.toFixed(0)}%</span>
                        </div>
                      </div>
                      {s.reasons.length > 0 && (
                        <ul className="mt-3 list-disc list-inside text-xs text-muted-foreground space-y-1">
                          {s.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
