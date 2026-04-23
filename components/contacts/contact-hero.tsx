'use client'

import { Avatar, AvatarFallback } from "@casalvi/ui"
import { Button } from "@casalvi/ui"
import { Badge } from "@casalvi/ui"
import { Phone, MessageCircle, Mail, StickyNote, Edit } from 'lucide-react'
import { NewContactDialog } from './new-contact-dialog'
import { cn } from '@/lib/cn'
import { useState } from 'react'

interface ContactHeroProps {
   contact: any
}

export function ContactHero({ contact }: ContactHeroProps) {
   const isOwner = contact.role === 'owner'
   const [editDialogOpen, setEditDialogOpen] = useState(false)

   return (
      <div className="bg-white dark:bg-card border-b border-t-0 p-6 md:rounded-xl md:border md:shadow-sm">

         <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">

            {/* 1. Header: Avatar + Info */}
            <div className="flex items-start gap-5">
               <Avatar className="h-20 w-20 border-4 border-slate-50 shadow-sm">
                  <AvatarFallback className={cn("text-2xl font-medium", isOwner ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-[#0062CC]")}>
                     {contact.first_name?.[0]}{contact.last_name?.[0]}
                  </AvatarFallback>
               </Avatar>

               <div className="pt-1">
                  <div className="flex items-center gap-3 mb-1">
                     <h1 className="text-3xl font-bold text-foreground tracking-tight">
                        {contact.first_name} {contact.last_name}
                     </h1>
                     <Badge className={cn("text-xs px-2.5 py-0.5 h-6", isOwner ? "bg-orange-100 text-orange-700 hover:bg-orange-200 border-none" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none")}>
                        {isOwner ? 'Propietario' : 'Activo'}
                     </Badge>
                     {/* The image shows 'Active' badge, assuming Status. Keeping Role for now but styled softly */}
                     <Badge variant="outline" className="border-slate-200 text-slate-500 font-normal">
                        {isOwner ? 'Propietario' : 'Comprador'}
                     </Badge>
                  </div>

                  <div className="flex flex-col gap-1 mt-3">
                     {contact.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                           <div className="w-6 flex justify-center"><Phone className="h-4 w-4 text-slate-400" /></div>
                           <span className="font-medium text-slate-900">{contact.phone}</span>
                           <span className="text-slate-400 text-xs">Teléfono</span>
                        </div>
                     )}
                     {contact.email && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                           <div className="w-6 flex justify-center"><Mail className="h-4 w-4 text-slate-400" /></div>
                           <span className="font-medium text-slate-900">{contact.email}</span>
                           <span className="text-slate-400 text-xs">Email</span>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* 2. Barra de Acciones (Right Side) */}
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
               <Button variant="outline" className="flex flex-col items-center h-[72px] w-[72px] gap-1.5 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all rounded-xl p-0 justify-center" asChild>
                  <a href={`tel:${contact.phone}`}>
                     <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-[#007AFF]">
                        <Phone className="h-4 w-4" />
                     </div>
                     <span className="text-[10px] font-medium text-slate-600">Llamar</span>
                  </a>
               </Button>

               <Button variant="outline" className="flex flex-col items-center h-[72px] w-[72px] gap-1.5 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all rounded-xl p-0 justify-center" asChild>
                  <a href={`https://wa.me/${contact.phone?.replace(/\+/g, '').replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer">
                     <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <MessageCircle className="h-4 w-4" />
                     </div>
                     <span className="text-[10px] font-medium text-slate-600">WhatsApp</span>
                  </a>
               </Button>

               <Button variant="outline" className="flex flex-col items-center h-[72px] w-[72px] gap-1.5 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all rounded-xl p-0 justify-center" asChild>
                  <a href={`mailto:${contact.email}`}>
                     <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <Mail className="h-4 w-4" />
                     </div>
                     <span className="text-[10px] font-medium text-slate-600">Email</span>
                  </a>
               </Button>

               <Button variant="outline" className="flex flex-col items-center h-[72px] w-[72px] gap-1.5 border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-all rounded-xl p-0 justify-center">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                     <StickyNote className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-600">Nota</span>
               </Button>

               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 ml-1" onClick={() => setEditDialogOpen(true)}>
                  <Edit className="h-4 w-4" />
               </Button>
            </div>

         </div>

         {/* Dialog de Edición */}
         <NewContactDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            contactToEdit={contact}
         />
      </div>
   )
}

