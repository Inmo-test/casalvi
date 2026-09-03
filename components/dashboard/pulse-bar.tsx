'use client'

import { Card } from "@/components/ui"
import { Building2, Euro, Calendar } from 'lucide-react'
import { cn } from '@/lib/cn'

interface PulseBarProps {
  portfolioValue: number
  activeProperties: number
  todayEventsCount: number
}

const formatCurrency = (amount: number) => {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M€`
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}k€`
  return `${amount}€`
}

export function PulseBar({ portfolioValue, activeProperties, todayEventsCount }: PulseBarProps) {
  const items = [
    {
      label: 'Cartera',
      value: formatCurrency(portfolioValue),
      icon: Euro,
      color: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      label: 'Activas',
      value: activeProperties.toString(),
      icon: Building2,
      color: 'text-[#007AFF] dark:text-blue-400'
    },
    {
      label: 'Hoy',
      value: todayEventsCount.toString(),
      icon: Calendar,
      color: 'text-[#007AFF] dark:text-blue-400'
    }
  ]

  return (
    <Card className="p-3.5 bg-card border-border shadow-sm overflow-hidden">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 pr-12">
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <div
              key={index}
              className={cn(
                'flex items-center gap-3 shrink-0 px-4 py-2 rounded-lg bg-muted/50',
                'min-w-[140px]'
              )}
            >
              <div className={cn('p-1.5 rounded-md bg-background', item.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground whitespace-nowrap">{item.label}</span>
                <span className="text-lg font-medium text-foreground whitespace-nowrap">{item.value}</span>
              </div>
            </div>
          )
        })}
      </div>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </Card>
  )
}

