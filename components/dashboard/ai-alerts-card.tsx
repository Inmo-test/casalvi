'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@casalvi/ui"
import { Badge } from "@casalvi/ui"
import { formatRelativeTime } from '@/lib/utils/date'
import { Sparkles, AlertCircle, Smile } from 'lucide-react'

type AIAlert = {
  id: string
  ai_summary: string
  ai_sentiment: string
  created_at: string
  contact_id: string
  contact: {
    first_name: string
    last_name: string | null
  }
}

interface AIAlertsCardProps {
  alerts: AIAlert[]
}

function getSentimentIcon(sentiment: string) {
  if (sentiment === 'urgent') return <AlertCircle className="h-4 w-4 text-orange-500" />
  if (sentiment === 'positive') return <Smile className="h-4 w-4 text-green-500" />
  return <Sparkles className="h-4 w-4 text-blue-500" />
}

function getSentimentBadge(sentiment: string) {
  const configs: Record<string, { label: string; className: string }> = {
    positive: {
      label: 'Positivo',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
    urgent: {
      label: 'Urgente',
      className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    },
  }
  return configs[sentiment] || { label: sentiment, className: '' }
}

export function AIAlertsCard({ alerts }: AIAlertsCardProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Alertas de Inteligencia
          </CardTitle>
          <CardDescription>
            Actividades importantes detectadas por IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Sparkles className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No hay alertas todavía</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              La IA te notificará cuando detecte actividades urgentes o muy positivas
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          🤖 Alertas de Inteligencia
        </CardTitle>
        <CardDescription>
          Actividades importantes detectadas por IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => {
            const fullName = `${alert.contact.first_name} ${alert.contact.last_name || ''}`.trim()
            const sentimentBadge = getSentimentBadge(alert.ai_sentiment)

            return (
              <Link
                key={alert.id}
                href={`/dashboard/contacts/${alert.contact_id}`}
                className="block"
              >
                <div className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border">
                  <div className="flex-shrink-0 mt-0.5">
                    {getSentimentIcon(alert.ai_sentiment)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-2">
                        {alert.ai_summary}
                      </p>
                      <Badge
                        variant="secondary"
                        className={`${sentimentBadge.className} flex-shrink-0 text-xs`}
                      >
                        {sentimentBadge.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{fullName}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(alert.created_at)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}



