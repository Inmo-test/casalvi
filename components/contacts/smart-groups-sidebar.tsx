'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui"
import { Plus, Users, MapPin, Zap, Trash2, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { getSmartGroups, deleteSmartGroup, type SmartGroup } from '@/app/actions/smart-groups'
import { useToast } from '@/hooks/use-toast'

interface SmartGroupsSidebarProps {
    onSelectGroup: (group: SmartGroup | null) => void
    activeGroupId: string | null
}

export function SmartGroupsSidebar({ onSelectGroup, activeGroupId }: SmartGroupsSidebarProps) {
    const [groups, setGroups] = useState<SmartGroup[]>([])
    const [isCollapsed, setIsCollapsed] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        loadGroups()
    }, [])

    async function loadGroups() {
        const result = await getSmartGroups()
        if (result.success && result.data) {
            setGroups(result.data)
        }
    }

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (!confirm('¿Seguro que quieres borrar este grupo?')) return

        const result = await deleteSmartGroup(id)
        if (result.success) {
            toast({ title: 'Grupo eliminado' })
            loadGroups()
            if (activeGroupId === id) onSelectGroup(null) // Reset selection
        }
    }

    return (
        <div className={`border-r bg-slate-50/50 hidden lg:flex flex-col gap-4 h-full transition-all duration-300 ${isCollapsed ? 'w-[68px] p-2' : 'w-64 p-4'}`}>

            <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'justify-between'}`}>
                {!isCollapsed && <h3 className="font-semibold text-sm text-slate-900 whitespace-nowrap">Smart Groups</h3>}

                <div className={`flex items-center ${isCollapsed ? 'flex-col-reverse gap-2' : 'gap-1'}`}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-slate-600"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? "Expandir" : "Colapsar"}
                    >
                        {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    </Button>

                    {!isCollapsed && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" title="Crear Grupo">
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                    {isCollapsed && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white shadow-sm border" title="Crear Grupo">
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="space-y-1">
                <Button
                    variant={activeGroupId === null ? "secondary" : "ghost"}
                    className={`w-full justify-start font-normal h-10 ${isCollapsed ? 'justify-center px-0' : ''}`}
                    onClick={() => onSelectGroup(null)}
                    title={isCollapsed ? "Todos los Contactos" : undefined}
                >
                    <Users className={`h-4 w-4 text-slate-500 ${!isCollapsed ? 'mr-2' : ''}`} />
                    {!isCollapsed && "Todos los Contactos"}
                </Button>

                {groups.map(group => (
                    <div key={group.id} className="group relative">
                        <Button
                            variant={activeGroupId === group.id ? "secondary" : "ghost"}
                            className={`w-full justify-start font-normal text-slate-700 h-10 ${isCollapsed ? 'justify-center px-0' : ''}`}
                            onClick={() => onSelectGroup(group)}
                            title={isCollapsed ? group.name : undefined}
                        >
                            <div className={isCollapsed ? '' : 'mr-2'}>{getIcon(group.icon, isCollapsed)}</div>
                            {!isCollapsed && <span className="truncate">{group.name}</span>}
                        </Button>
                        {!isCollapsed && (
                            <button
                                onClick={(e) => handleDelete(e, group.id)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500 transition-all"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Mock Groups if empty (Demo) */}
            {groups.length === 0 && (
                <div className={`space-y-1 opacity-60 ${isCollapsed ? 'items-center flex flex-col' : ''}`}>
                    {!isCollapsed && <div className="px-2 py-1 text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-4">Sugeridos</div>}
                    {isCollapsed && <div className="h-px w-full bg-slate-200 my-2" />}

                    <Button variant="ghost" className={`w-full justify-start font-normal text-xs h-8 ${isCollapsed ? 'justify-center px-0' : ''}`} title="Vecinos Calle Cuenca">
                        <MapPin className={`h-3 w-3 text-blue-500 ${!isCollapsed ? 'mr-2' : ''}`} />
                        {!isCollapsed && "Vecinos Calle Cuenca"}
                    </Button>
                    <Button variant="ghost" className={`w-full justify-start font-normal text-xs h-8 ${isCollapsed ? 'justify-center px-0' : ''}`} title="Alta Probabilidad (+70%)">
                        <Zap className={`h-3 w-3 text-amber-500 ${!isCollapsed ? 'mr-2' : ''}`} />
                        {!isCollapsed && "Alta Probabilidad (+70%)"}
                    </Button>
                </div>
            )}

        </div>
    )
}

function getIcon(name: string, isCollapsed: boolean) {
    const margin = isCollapsed ? '' : 'mr-2'
    switch (name) {
        case 'map-pin': return <MapPin className={`${margin} h-4 w-4 text-blue-500`} />
        case 'zap': return <Zap className={`${margin} h-4 w-4 text-amber-500`} />
        default: return <Users className={`${margin} h-4 w-4 text-slate-500`} />
    }
}
