'use client'

import { Card, CardContent } from "@/components/ui"
import { Button } from "@/components/ui"
import { Badge } from "@/components/ui"
import { X, Sparkles, AlertTriangle, FileText, Home } from 'lucide-react'
import Link from 'next/link'
import type { SmartFeedItem } from '@/app/actions/dashboard'
import { cn } from '@/lib/cn'

interface SmartFeedItemProps {
  item: SmartFeedItem
  onDismiss: (entityId: string, type: string) => void
}

export function SmartFeedItemComponent({ item, onDismiss }: SmartFeedItemProps) {
  // Determinar color según el tipo
  const getTypeConfig = () => {
    switch (item.type) {
      case 'owner_opportunity':
        return {
          color: 'amber',
          icon: Home,
          borderColor: 'border-amber-500/50',
          bgColor: 'bg-amber-50/50 dark:bg-amber-950/20',
          badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
        }
      case 'opportunity_match':
        return {
          color: 'violet',
          icon: Sparkles,
          borderColor: 'border-violet-500/50',
          bgColor: 'bg-violet-50/50 dark:bg-violet-950/20',
          badgeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300'
        }
      case 'churn_risk':
        return {
          color: 'orange',
          icon: AlertTriangle,
          borderColor: 'border-orange-500/50',
          bgColor: 'bg-orange-50/50 dark:bg-orange-950/20',
          badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
        }
      case 'admin_task':
        return {
          color: 'gray',
          icon: FileText,
          borderColor: 'border-gray-500/50',
          bgColor: 'bg-gray-50/50 dark:bg-gray-950/20',
          badgeColor: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
        }
      default:
        return {
          color: 'gray',
          icon: FileText,
          borderColor: 'border-gray-500/50',
          bgColor: 'bg-gray-50/50 dark:bg-gray-950/20',
          badgeColor: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
        }
    }
  }

  const config = getTypeConfig()
  const Icon = config.icon

  // Determinar URL de navegación según el tipo
  const getActionUrl = () => {
    if (item.type === 'owner_opportunity' && item.metadata.contact_id) {
      return `/dashboard/contacts/${item.metadata.contact_id}`
    }
    if (item.type === 'opportunity_match' && item.metadata.contact_id) {
      return `/dashboard/contacts/${item.metadata.contact_id}`
    }
    if (item.type === 'churn_risk' && item.metadata.contact_id) {
      return `/dashboard/contacts/${item.metadata.contact_id}`
    }
    if (item.type === 'churn_risk' && item.metadata.id) {
      return `/dashboard/contacts/${item.metadata.id}`
    }
    return null
  }

  const actionUrl = getActionUrl()

  return (
    <Card className={cn('relative border-l-4 transition-all hover:shadow-md', config.borderColor, config.bgColor)}>
      <CardContent className="p-4">
        {/* Header con icono y botón dismiss */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-1">
            <div className={cn('p-2 rounded-lg', config.badgeColor)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-foreground leading-tight">{item.title}</h4>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => onDismiss(item.id, item.type)}
            title="Descartar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Contenido */}
        <div className="space-y-2">
          {/* Entity A (principal) */}
          <div>
            <p className="text-sm font-medium text-foreground">{item.entity_a}</p>
            {item.entity_b && (
              <p className="text-xs text-muted-foreground mt-0.5">→ {item.entity_b}</p>
            )}
          </div>

          {/* Reasoning */}
          <p className="text-xs text-muted-foreground leading-relaxed">{item.reasoning}</p>

          {/* Footer con score y CTA */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <Badge variant="outline" className="text-xs">
              Score: {item.score}%
            </Badge>
            {actionUrl ? (
              <Link href={actionUrl}>
                <Button variant="default" size="sm" className="text-xs h-7">
                  {item.cta_label}
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" className="text-xs h-7" disabled>
                {item.cta_label}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

