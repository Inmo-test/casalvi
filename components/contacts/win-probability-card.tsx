'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui"
import { Button } from "@/components/ui"
import { calculateWinProbability } from '@/app/actions/ai/intelligence'
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, Sparkles, Home } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Props {
  contactId: string
  role?: string // Pasamos el rol para cambiar textos
}

export function WinProbabilityCard({ contactId, role }: Props) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const isOwner = role === 'seller' || role === 'owner'

  const loadAnalysis = useCallback(async (force: boolean) => {
    if (force) setRefreshing(true)
    else setLoading(true)

    try {
      const result = await calculateWinProbability(contactId, force)
      if (result.error) throw new Error(result.error)
      setData(result)
      if (force) toast({ title: "Análisis Actualizado", description: "La IA ha procesado los nuevos datos." })
    } catch (e) {
      console.error(e)
      toast({ 
        title: "Error", 
        description: "No se pudo actualizar el análisis.", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [contactId, toast])

  // Carga inicial (usa caché si existe)
  useEffect(() => {
    loadAnalysis(false)
  }, [loadAnalysis])

  if (loading && !data) {
    return (
      <Card className="bg-slate-50/50">
        <CardContent className="pt-6 flex flex-col items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
          <p className="text-xs text-muted-foreground">Consultando IA...</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const score = data.score || 0
  // Lógica de colores semáforo
  const color = score > 70 ? 'text-emerald-600' : score > 40 ? 'text-amber-600' : 'text-red-600'
  const barColor = score > 70 ? 'bg-emerald-500' : score > 40 ? 'bg-amber-500' : 'bg-red-500'
  const bgColor = score > 70 ? 'bg-emerald-50 border-emerald-100' : score > 40 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'

  // Textos dinámicos según Rol
  const title = isOwner ? "Calidad de Captación" : "Probabilidad de Cierre"
  const subtitle = isOwner ? "Probabilidad de venta exitosa" : "Basado en interacciones"

  return (
    <Card className="overflow-hidden border-t-4 border-t-blue-500 shadow-sm">
      <CardHeader className="pb-3 bg-slate-50/30 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2 text-slate-800">
            {isOwner ? <Home className="h-4 w-4 text-[#007AFF]" /> : <Sparkles className="h-4 w-4 text-[#007AFF]" />}
            {title}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-slate-400 hover:text-[#007AFF]" 
            onClick={() => loadAnalysis(true)}
            disabled={refreshing}
            title="Recalcular con nuevos datos"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription className="text-xs">{subtitle}</CardDescription>
      </CardHeader>
      
      <CardContent className="pt-5">
        <div className="flex items-end justify-between mb-2">
          <span className={`text-4xl font-extrabold tracking-tight ${color}`}>{score}%</span>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Score IA</span>
        </div>
        
        {/* Barra de progreso */}
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-5">
           <div className={`h-full ${barColor} transition-all duration-1000 ease-out`} style={{ width: `${score}%` }} />
        </div>

        {/* Razón Clave */}
        <div className={`p-3 rounded-lg border text-sm ${bgColor} mb-4`}>
          <p className="font-medium text-slate-800 mb-1 flex items-center gap-2 text-xs uppercase tracking-wide">
             {score > 50 ? <CheckCircle className="h-3.5 w-3.5"/> : <AlertTriangle className="h-3.5 w-3.5"/>}
             Análisis
          </p>
          <p className="text-slate-700 leading-snug">{data.reason}</p>
        </div>

        {/* Siguiente paso */}
        <div>
           <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Recomendación Táctica</p>
           <p className="text-sm font-medium text-slate-800">{data.next_best_action}</p>
        </div>
        
        {/* Footer info cache */}
        <div className="mt-4 pt-2 border-t border-slate-50 flex justify-between text-[10px] text-slate-400">
           <span>Fuente: {data.source === 'cache' ? 'Memoria (Guardado)' : 'Análisis en vivo'}</span>
        </div>
      </CardContent>
    </Card>
  )
}
