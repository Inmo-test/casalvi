'use client'

import { Progress } from "@casalvi/ui"
import { PLAN_LIMITS, type PlanType } from '@/lib/config/subscription-plans'
import { cn } from '@/lib/cn'

interface UsageIndicatorProps {
  plan: PlanType
  contactsCount: number
  maxContacts: number
  propertiesCount?: number
  maxProperties?: number
}

export function UsageIndicator({
  plan,
  contactsCount,
  maxContacts,
  propertiesCount,
  maxProperties,
}: UsageIndicatorProps) {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.starter

  // Calcular porcentajes
  const contactsPercentage = limits.maxContacts === Infinity 
    ? 0 
    : Math.min((contactsCount / limits.maxContacts) * 100, 100)

  const propertiesPercentage = limits.maxProperties === Infinity || !maxProperties
    ? 0
    : Math.min(((propertiesCount || 0) / limits.maxProperties) * 100, 100)

  // Determinar color según el porcentaje
  const getColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-[#007AFF]'
  }

  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">Plan {limits.label}</span>
        {limits.maxContacts === Infinity ? (
          <span className="text-green-600 dark:text-green-400">Ilimitado</span>
        ) : (
          <span className={cn(
            "font-medium",
            contactsPercentage >= 90 ? "text-red-600" : contactsPercentage >= 70 ? "text-yellow-600" : "text-muted-foreground"
          )}>
            {contactsCount} / {limits.maxContacts}
          </span>
        )}
      </div>

      {/* Barra de progreso de contactos */}
      {limits.maxContacts !== Infinity && (
        <>
          <Progress 
            value={contactsPercentage} 
            className="h-2"
          />
          <p className="text-[10px] text-muted-foreground">
            Contactos utilizados
          </p>
        </>
      )}

      {/* Barra de progreso de propiedades (si aplica) */}
      {limits.maxProperties !== Infinity && maxProperties && (
        <div className="space-y-2 pt-2 border-t border-border/30">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Propiedades</span>
            <span className={cn(
              "font-medium",
              propertiesPercentage >= 90 ? "text-red-600" : propertiesPercentage >= 70 ? "text-yellow-600" : "text-muted-foreground"
            )}>
              {propertiesCount || 0} / {limits.maxProperties}
            </span>
          </div>
          <Progress 
            value={propertiesPercentage} 
            className="h-2"
          />
        </div>
      )}

      {/* Mensaje de advertencia si está cerca del límite */}
      {contactsPercentage >= 80 && limits.maxContacts !== Infinity && (
        <p className="text-[10px] text-yellow-600 dark:text-yellow-400 mt-2">
          ⚠️ Cerca del límite. Considera actualizar tu plan.
        </p>
      )}
    </div>
  )
}

