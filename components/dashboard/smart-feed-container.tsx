'use client'

import { useOptimistic } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@casalvi/ui"
import { SmartFeedItemComponent } from './smart-feed-item'
import { dismissFeedItem } from '@/app/actions/dashboard'
import type { SmartFeedItem } from '@/app/actions/dashboard'
import { Coffee, Sparkles } from 'lucide-react'

interface SmartFeedContainerProps {
  initialItems: SmartFeedItem[]
}

export function SmartFeedContainer({ initialItems }: SmartFeedContainerProps) {
  // BLINDAJE: Asegurar que initialItems siempre es un array válido
  const safeInitialItems = Array.isArray(initialItems) ? initialItems : []
  
  const [optimisticItems, addOptimisticDismiss] = useOptimistic(
    safeInitialItems,
    (state, dismissedId: string) => {
      if (!Array.isArray(state)) return []
      return state.filter(item => item && item.id && item.id !== dismissedId)
    }
  )

  const handleDismiss = async (entityId: string, type: string) => {
    // Optimistic update
    addOptimisticDismiss(entityId)
    
    // Server action
    await dismissFeedItem(entityId, type)
  }

  // BLINDAJE: Asegurar que optimisticItems siempre es un array válido
  const safeOptimisticItems = Array.isArray(optimisticItems) ? optimisticItems : []

  if (safeOptimisticItems.length === 0) {
    return (
      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-[#007AFF] dark:text-blue-400" />
            Oportunidades Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 space-y-3">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Coffee className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">Inbox Zero</h3>
              <p className="text-sm text-muted-foreground">
                ¡Todo limpio! Tómate un café o ve a hacer Farming.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-[#007AFF] dark:text-blue-400" />
          Oportunidades Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {safeOptimisticItems.map((item) => {
            // Validar que el item sea válido antes de renderizar
            if (!item || !item.id || !item.type) return null
            return (
              <SmartFeedItemComponent
                key={`${item.type}-${item.id}`}
                item={item}
                onDismiss={handleDismiss}
              />
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

