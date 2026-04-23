'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@casalvi/ui"
import { Button } from "@casalvi/ui"
import { Progress } from "@casalvi/ui"
import { Brain, Loader2, CheckCircle2 } from 'lucide-react'
import { processPendingBatch, getPendingCount } from '@/app/actions/ai-batch'

export function AiQueueProcessor() {
  const [pendingCount, setPendingCount] = useState<number | null>(null)
  const [initialCount, setInitialCount] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalProcessed, setTotalProcessed] = useState(0)

  // Cargar el conteo inicial al montar el componente
  useEffect(() => {
    loadPendingCount()
  }, [])

  const loadPendingCount = async () => {
    try {
      const result = await getPendingCount()
      if ('error' in result && result.error) {
        setError(result.error)
        setPendingCount(0)
      } else {
        setPendingCount(result.count)
        setInitialCount(result.count)
        setIsComplete(result.count === 0)
      }
    } catch (err) {
      console.error('Error loading pending count:', err)
      setError('Error al cargar actividades pendientes')
      setPendingCount(0)
    }
  }

  const handleProcess = async () => {
    if (isProcessing || pendingCount === null || pendingCount === 0) return

    setIsProcessing(true)
    setIsComplete(false)
    setError(null)
    setTotalProcessed(0)

    try {
      let currentPending = pendingCount
      let processed = 0

      // Bucle mientras haya actividades pendientes
      while (currentPending > 0) {
        // Procesar lote de 5
        const result = await processPendingBatch(5)

        if ('error' in result && result.error) {
          setError(result.error)
          break
        }

        // Actualizar contadores
        processed += result.processed || 0
        currentPending = result.remaining || 0
        setTotalProcessed(processed)
        setPendingCount(currentPending)

        // Si no quedan pendientes, salir del bucle
        if (currentPending === 0) {
          setIsComplete(true)
          break
        }

        // Esperar 1 segundo antes de la siguiente iteración
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    } catch (err) {
      console.error('Error processing batch:', err)
      setError(err instanceof Error ? err.message : 'Error al procesar actividades')
    } finally {
      setIsProcessing(false)
    }
  }

  // Calcular porcentaje de progreso
  const progressPercentage =
    initialCount > 0
      ? Math.round(((initialCount - (pendingCount || 0)) / initialCount) * 100)
      : 0

  // Si no hay actividades pendientes y no está procesando, mostrar estado vacío
  if (pendingCount === null) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>Cola de Procesamiento IA</CardTitle>
          </div>
          <CardDescription>Cargando información...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <CardTitle>Cola de Procesamiento IA</CardTitle>
        </div>
        <CardDescription>
          Procesa actividades pendientes con análisis de IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {isComplete && pendingCount === 0 && !isProcessing ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-lg font-medium text-green-600 dark:text-green-400">
              ✅ Todo al día
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Todas las actividades han sido procesadas correctamente
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadPendingCount()
                setIsComplete(false)
              }}
            >
              Actualizar
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Actividades pendientes
                </span>
                <span className="font-medium">
                  {pendingCount || 0} / {initialCount}
                </span>
              </div>

              <Progress
                value={progressPercentage}
                className="h-3"
              />

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {isProcessing
                    ? `Procesando... (${totalProcessed} procesadas)`
                    : `${progressPercentage}% completado`}
                </span>
                {initialCount > 0 && (
                  <span>
                    {initialCount - (pendingCount || 0)} de {initialCount}
                  </span>
                )}
              </div>
            </div>

            <Button
              onClick={handleProcess}
              disabled={isProcessing || pendingCount === 0}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Procesar Pendientes
                </>
              )}
            </Button>

            {pendingCount === 0 && !isComplete && (
              <p className="text-xs text-center text-muted-foreground">
                No hay actividades pendientes de procesar
              </p>
            )}

            {isProcessing && (
              <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 text-xs space-y-1">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Procesando en segundo plano...
                </p>
                <p className="text-[#0062CC] dark:text-blue-300">
                  Se están analizando las actividades con IA. Este proceso puede
                  tomar varios minutos dependiendo de la cantidad de actividades.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}


