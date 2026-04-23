'use client'

import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Phone, Mail, StickyNote, Mic, User } from 'lucide-react'
import { cn } from '@/lib/cn'

interface ChatActivityTimelineProps {
  activities: any[]
}

export function ChatActivityTimeline({ activities }: ChatActivityTimelineProps) {
  
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm bg-slate-50 rounded-lg border border-dashed">
         No hay historial de actividad reciente.
      </div>
    )
  }

  return (
    <div className="space-y-6 relative ml-4">
      {/* Línea vertical de tiempo */}
      <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 -z-10" />

      {activities.map((activity) => {
        // Configuración visual por tipo
        let bubbleStyle = "bg-white border-slate-200"
        let iconBg = "bg-slate-100 text-slate-500"
        let Icon = StickyNote
        
        if (activity.type === 'call') {
           bubbleStyle = "bg-blue-50 border-blue-100"
           iconBg = "bg-blue-500 text-white"
           Icon = Phone
        } else if (activity.type === 'email') {
           bubbleStyle = "bg-slate-50 border-slate-200"
           iconBg = "bg-slate-500 text-white"
           Icon = Mail
        } else if (activity.type === 'note' && activity.raw_content?.includes('[Cambios sugeridos')) {
           // Notas especiales de IA
           bubbleStyle = "bg-violet-50 border-violet-100"
           iconBg = "bg-violet-500 text-white"
           Icon = Mic
        }

        return (
          <div key={activity.id} className="relative flex gap-4">
             {/* Icono Flotante */}
             <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0 border-4 border-background", iconBg)}>
                <Icon className="h-4 w-4" />
             </div>

             {/* Burbuja de Chat */}
             <div className={cn("flex-1 p-3 rounded-2xl rounded-tl-none border shadow-sm text-sm", bubbleStyle)}>
                <div className="flex justify-between items-start mb-1">
                   <span className="font-medium text-xs opacity-70 uppercase tracking-wide">
                      {activity.type === 'note' ? 'Nota' : activity.type}
                   </span>
                   <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: es })}
                   </span>
                </div>
                
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                   {activity.ai_summary || activity.raw_content}
                </p>

                {activity.ai_sentiment === 'urgent' && (
                   <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
                      🔥 Importante
                   </div>
                )}
             </div>
          </div>
        )
      })}
    </div>
  )
}

