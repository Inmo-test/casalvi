'use client'

import { useState } from 'react'
import { Button } from "@/components/ui"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { Input } from "@/components/ui"
import { Label } from "@/components/ui"
import { Loader2, Play } from 'lucide-react'
import { ingestLocalDirectory } from '@/app/actions/ingest'
import { useRouter } from 'next/navigation'

export function IngestRunner() {
  const router = useRouter()
  const [path, setPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function run() {
    if (!path.trim()) return
    setLoading(true)
    setResult(null)
    const res = await ingestLocalDirectory(path.trim())
    setLoading(false)
    if ('error' in res) {
      setResult(`Error: ${res.error}`)
    } else {
      const dup = res.results.filter(r => r.skipped === 'duplicate').length
      setResult(`Procesados: ${res.results.length} (${dup} duplicados)`)
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Indexar una carpeta local</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="path">Ruta absoluta</Label>
          <Input
            id="path"
            placeholder="/Users/tu-usuario/Dropbox/Inmobiliaria"
            value={path}
            onChange={(e) => setPath(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Esta acción sólo funciona en modo local (donde el servidor puede leer
            tu sistema de archivos). En producción expón los archivos a través de
            un bucket o una ruta montada.
          </p>
        </div>
        <Button onClick={run} disabled={loading || !path.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
          {loading ? 'Indexando...' : 'Indexar carpeta'}
        </Button>
        {result && <p className="text-sm text-muted-foreground">{result}</p>}
      </CardContent>
    </Card>
  )
}
