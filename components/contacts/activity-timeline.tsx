'use client'

import { useState } from 'react'
import { Card, CardContent } from "@casalvi/ui"
import { Badge } from "@casalvi/ui"
import { Button } from "@casalvi/ui"
import { formatRelativeTime, formatTime, isToday, isTomorrow, formatDateGroup } from '@/lib/utils/date'
import { Calendar, Clock, AlertCircle, Home, Phone, MessageCircle, Users, Check, Edit } from 'lucide-react'
import { updateActivity } from '@/app/actions/activities'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

type Activity = {
  id: string
  type: string
  channel: string
  raw_content: string
  ai_summary: string | null
  ai_sentiment: string | null
  is_processed: boolean
  created_at: string
  scheduled_at: string | null
  status: string | null
}

interface ActivityTimelineProps {
  activities: Activity[]
}

function getChannelIcon(channel: string) {
  const icons: Record<string, JSX.Element> = {
    visit: <Home className="h-5 w-5" />,
    call: <Phone className="h-5 w-5" />,
    whatsapp: <MessageCircle className="h-5 w-5" />,
    street_encounter: <Users className="h-5 w-5" />,
    note: <span className="text-xl">📝</span>,
  }
  return icons[channel] || <span className="text-xl">📝</span>
}

function getChannelLabel(channel: string) {
  const labels: Record<string, string> = {
    visit: 'Visita Presencial',
    call: 'Llamada',
    whatsapp: 'WhatsApp',
    street_encounter: 'Encuentro en Calle',
    note: 'Nota',
  }
  return labels[channel] || 'Nota'
}

function getChannelColor(channel: string) {
  const colors: Record<string, string> = {
    visit: 'bg-blue-100 dark:bg-blue-900',
    call: 'bg-green-100 dark:bg-green-900',
    whatsapp: 'bg-emerald-100 dark:bg-emerald-900',
    street_encounter: 'bg-amber-100 dark:bg-amber-900',
    note: 'bg-primary/10',
  }
  return colors[channel] || 'bg-primary/10'
}

function getSentimentBadge(sentiment: string | null) {
  if (!sentiment) return null

  const configs: Record<string, { label: string; className: string; icon?: string }> = {
    positive: {
      label: 'Positivo',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      icon: '😊',
    },
    negative: {
      label: 'Negativo',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      icon: '😟',
    },
    neutral: {
      label: 'Neutral',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      icon: '😐',
    },
    urgent: {
      label: 'Urgente',
      className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      icon: '🚨',
    },
  }

  return configs[sentiment] || null
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)

  // Separar actividades en históricas y programadas
  const now = new Date()
  const historicalActivities = activities.filter((activity) => {
    if (activity.status === 'pending' && activity.scheduled_at) {
      const scheduledDate = new Date(activity.scheduled_at)
      return scheduledDate <= now
    }
    return activity.status === 'done' || !activity.scheduled_at || new Date(activity.scheduled_at) <= now
  })

  const scheduledActivities = activities
    .filter((activity) => {
      return activity.status === 'pending' && activity.scheduled_at && new Date(activity.scheduled_at) > now
    })
    .sort((a, b) => {
      // Ordenar programadas por fecha ascendente (más próximas primero)
      if (!a.scheduled_at || !b.scheduled_at) return 0
      return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    })

  // Ordenar históricas por fecha descendente (más recientes primero)
  const sortedHistoricalActivities = [...historicalActivities].sort((a, b) => {
    const dateA = a.scheduled_at ? new Date(a.scheduled_at) : new Date(a.created_at)
    const dateB = b.scheduled_at ? new Date(b.scheduled_at) : new Date(b.created_at)
    return dateB.getTime() - dateA.getTime()
  })

  // Combinar: primero las programadas, luego las históricas
  const sortedActivities = [...scheduledActivities, ...sortedHistoricalActivities]

  const handleComplete = async (activityId: string) => {
    setCompletingId(activityId)
    const result = await updateActivity(activityId, { status: 'done' })
    
    if ('error' in result && result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
      setCompletingId(null)
    } else {
      toast({
        title: '✅ Tarea completada',
        description: 'La tarea se ha marcado como completada.',
      })
      router.refresh()
    }
  }

  const formatScheduledDate = (scheduledAt: string) => {
    const scheduledDate = new Date(scheduledAt)
    const timeStr = formatTime(scheduledAt)
    
    if (isToday(scheduledAt)) {
      return `📅 Para hoy a las ${timeStr}`
    } else if (isTomorrow(scheduledAt)) {
      return `📅 Para mañana a las ${timeStr}`
    } else {
      const dateGroup = formatDateGroup(scheduledAt)
      return `📅 Para ${dateGroup} a las ${timeStr}`
    }
  }

  const isPending = (activity: Activity) => {
    if (!activity.scheduled_at) return false
    const scheduledDate = new Date(activity.scheduled_at)
    return activity.status === 'pending' && scheduledDate > now
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Calendar className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No hay actividades todavía</h3>
        <p className="text-muted-foreground max-w-sm">
          Comienza a registrar tus interacciones con este contacto usando el formulario de arriba.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {sortedActivities.map((activity, index) => {
          const sentimentConfig = getSentimentBadge(activity.ai_sentiment)
          const isUrgent = activity.ai_sentiment === 'urgent'
          const isPendingActivity = isPending(activity)

          return (
            <Card
              key={activity.id}
              className={`relative ${
                isUrgent ? 'border-orange-500 border-2' : ''
              } ${
                isPendingActivity
                  ? 'border-dashed border-2 bg-yellow-50/50 dark:bg-yellow-950/20'
                  : ''
              }`}
            >
            {/* Timeline line */}
            {index !== activities.length - 1 && (
              <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-border -mb-4" />
            )}

            <CardContent className="pt-6">
              <div className="flex gap-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center relative z-10 ${
                      isUrgent ? 'bg-orange-100 dark:bg-orange-900' : getChannelColor(activity.channel)
                    }`}
                  >
                    {getChannelIcon(activity.channel)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">
                        {getChannelLabel(activity.channel)}
                      </Badge>
                      
                      {/* Badge de Programada */}
                      {isPendingActivity && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700">
                          📅 Programada
                        </Badge>
                      )}
                      
                      {/* Sentimiento */}
                      {sentimentConfig && (
                        <Badge variant="secondary" className={sentimentConfig.className}>
                          {sentimentConfig.icon} {sentimentConfig.label}
                        </Badge>
                      )}

                      {/* Alerta urgente */}
                      {isUrgent && (
                        <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">Requiere acción</span>
                        </div>
                      )}

                      {/* Pendiente de análisis solo si NO está procesado */}
                      {!activity.is_processed && (
                        <Badge variant="secondary" className="text-xs animate-pulse">
                          Analizando...
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {isPendingActivity && activity.scheduled_at
                        ? formatScheduledDate(activity.scheduled_at)
                        : formatRelativeTime(activity.created_at)}
                    </div>
                  </div>

                  {/* Fecha programada destacada para pendientes */}
                  {isPendingActivity && activity.scheduled_at && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-100/50 dark:bg-yellow-900/30 rounded-md border border-yellow-300 dark:border-yellow-700">
                      <Calendar className="h-4 w-4 text-yellow-700 dark:text-yellow-300" />
                      <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                        {formatScheduledDate(activity.scheduled_at)}
                      </span>
                    </div>
                  )}

                  {/* Contenido original */}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {activity.raw_content}
                  </p>

                  {/* Resumen IA */}
                  {activity.ai_summary && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-950 dark:to-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-[#007AFF] dark:text-blue-400">
                          🤖 Resumen IA:
                        </span>
                      </div>
                      <p className="text-sm italic text-blue-900 dark:text-blue-100">
                        &quot;{activity.ai_summary}&quot;
                      </p>
                    </div>
                  )}

                  {/* Botones de acción para actividades pendientes */}
                  {isPendingActivity && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleComplete(activity.id)}
                        disabled={completingId === activity.id}
                        className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-300 dark:border-green-700"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        {completingId === activity.id ? 'Completando...' : 'Completar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingActivity(activity)}
                        className="flex-1"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>

    </>
  )
}


