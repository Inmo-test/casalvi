'use client'

import { Button } from "@/components/ui"
import { Users, Mail, ArrowRight, ShieldCheck, X } from "lucide-react"

interface BulkActionsBarProps {
    selectedCount: number
    onClearSelection: () => void
    onAction: (action: string) => void
}

export function BulkActionsBar({ selectedCount, onClearSelection, onAction }: BulkActionsBarProps) {
    if (selectedCount === 0) return null

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-slate-900 text-white shadow-xl rounded-full px-6 py-3 flex items-center gap-6 border border-slate-700/50">

                <div className="flex items-center gap-3 border-r border-slate-700 pr-4">
                    <span className="bg-[#007AFF] text-white text-xs font-medium px-2 py-0.5 rounded-full">
                        {selectedCount}
                    </span>
                    <span className="text-sm font-medium text-slate-200">
                        Seleccionados
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-200 hover:text-white hover:bg-slate-800 rounded-full h-8 px-3"
                        onClick={() => onAction('email')}
                    >
                        <Mail className="h-4 w-4 mr-2 text-blue-400" />
                        Email AI
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-200 hover:text-white hover:bg-slate-800 rounded-full h-8 px-3"
                        onClick={() => onAction('sequence')}
                    >
                        <ArrowRight className="h-4 w-4 mr-2 text-emerald-400" />
                        Asignar Secuencia
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-200 hover:text-white hover:bg-slate-800 rounded-full h-8 px-3"
                        onClick={() => onAction('group')}
                    >
                        <Users className="h-4 w-4 mr-2 text-amber-400" />
                        Agrupar
                    </Button>
                </div>

                <div className="pl-4 border-l border-slate-700">
                    <button onClick={onClearSelection} className="text-slate-400 hover:text-white transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

            </div>
        </div>
    )
}
