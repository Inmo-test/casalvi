'use client'

import { Card, CardContent } from "@casalvi/ui"
import { Badge } from "@casalvi/ui"
import { Banknote, Bed, Bath, MapPin, TrendingUp, Search } from 'lucide-react'
import { NewContactDialog } from './new-contact-dialog'
import { useState } from 'react'

interface VisualPreferencesProps {
  contact: any
}

export function VisualPreferences({ contact }: VisualPreferencesProps) {
  // Solo renderizar para compradores
  if (contact.role !== 'buyer') return null

  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const formatBudget = (amount: number) => {
    if (!amount) return 'Sin límite'
    return amount >= 1000 ? `${(amount / 1000).toFixed(0)}k` : amount.toString()
  }

  return (
    <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-white overflow-hidden relative">
      <div className="absolute top-0 right-0 p-3 opacity-10">
         <Search className="h-24 w-24 text-[#007AFF]" />
      </div>

      <CardContent className="p-5">
         <div className="flex justify-between items-start mb-4">
            <div>
               <h3 className="font-medium text-blue-900 flex items-center gap-2">
                 <TrendingUp className="h-4 w-4 text-[#007AFF]" />
                 Perfil de Compra
               </h3>
               <p className="text-xs text-[#007AFF]/80">Preferencias de búsqueda activas</p>
            </div>
            {/* Botón Editar Preferencias (Abre el mismo diálogo de edición) */}
            <button
               onClick={() => setEditDialogOpen(true)}
               className="text-xs font-medium text-[#007AFF] cursor-pointer hover:underline"
            >
               Editar
            </button>
         </div>

         {/* GRID DE DATOS VISUALES */}
         <div className="grid grid-cols-2 gap-4">
            
            {/* Presupuesto */}
            <div className="bg-white/80 p-3 rounded-lg shadow-sm border border-blue-100/50">
               <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs uppercase tracking-wider">
                  <Banknote className="h-3 w-3" /> Presupuesto
               </div>
               <div className="font-medium text-lg text-slate-800">
                  Max {formatBudget(contact.budget_max)}€
               </div>
            </div>

            {/* Zonas */}
            <div className="bg-white/80 p-3 rounded-lg shadow-sm border border-blue-100/50">
               <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs uppercase tracking-wider">
                  <MapPin className="h-3 w-3" /> Zonas
               </div>
               <div className="flex flex-wrap gap-1">
                  {contact.preferred_zones && contact.preferred_zones.length > 0 ? (
                     contact.preferred_zones.slice(0, 2).map((z: string) => (
                        <Badge key={z} variant="secondary" className="text-[10px] bg-blue-100 text-[#0062CC] hover:bg-blue-200">
                           {z}
                        </Badge>
                     ))
                  ) : <span className="text-sm font-medium text-slate-400">Sin definir</span>}
                  {contact.preferred_zones?.length > 2 && (
                     <Badge variant="outline" className="text-[10px]">+{contact.preferred_zones.length - 2}</Badge>
                  )}
               </div>
            </div>

            {/* Habitaciones */}
            <div className="bg-white/80 p-3 rounded-lg shadow-sm border border-blue-100/50 flex flex-col justify-center">
               <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs uppercase tracking-wider">
                  <Bed className="h-3 w-3" /> Dormitorios
               </div>
               <div className="font-medium text-base text-slate-800">
                  {contact.min_bedrooms ? `${contact.min_bedrooms}+` : 'Cualquiera'}
               </div>
            </div>

            {/* Baños */}
            <div className="bg-white/80 p-3 rounded-lg shadow-sm border border-blue-100/50 flex flex-col justify-center">
               <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs uppercase tracking-wider">
                  <Bath className="h-3 w-3" /> Baños
               </div>
               <div className="font-medium text-base text-slate-800">
                  {contact.min_bathrooms ? `${contact.min_bathrooms}+` : 'Cualquiera'}
               </div>
            </div>

         </div>
      </CardContent>

      {/* Dialog de Edición */}
      <NewContactDialog 
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        contactToEdit={contact}
      />
    </Card>
  )
}

