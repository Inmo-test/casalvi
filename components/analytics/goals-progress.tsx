'use client'

import { Progress } from "@/components/ui"

export function GoalsProgress({ goals, stats }: { goals: any[]; stats: any }) {
  if (goals.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        No hay objetivos definidos.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {goals.map((goal) => {
        // Lógica simple para calcular progreso (deberías refinarla según el tipo de goal)
        let current = 0
        if (goal.type === 'contacts_created') current = stats.totalContacts
        if (goal.type === 'properties_listed') current = stats.totalProperties

        const percentage = Math.min(100, (current / goal.target_value) * 100)

        return (
          <div key={goal.id} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="font-medium capitalize">{goal.type.replace('_', ' ')}</div>
              <div className="text-muted-foreground">
                {current} / {goal.target_value}
              </div>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        )
      })}
    </div>
  )
}

