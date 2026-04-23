'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from "@casalvi/ui"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@casalvi/ui"
import { Card, CardContent, CardHeader, CardTitle } from "@casalvi/ui"
import { ArrowLeft, Plus } from 'lucide-react'

import { ContactHero } from '@/components/contacts/contact-hero'
import { VisualPreferences } from '@/components/contacts/visual-preferences'
import { ChatActivityTimeline } from '@/components/contacts/chat-activity-timeline'
import { NextStepCard } from '@/components/contacts/next-step-card'
import { ContactScoreCard } from '@/components/contacts/contact-score-card'
import { NewActivityForm } from '@/components/contacts/new-activity-form'
import { platformRefresh } from '@/lib/utils/platform'
import { useI18n } from '@/lib/i18n/I18nContext'

interface ContactDetailViewProps {
   contact: any
   activities: any[]
}

export function ContactDetailView({ contact, activities }: ContactDetailViewProps) {
   const { t } = useI18n()
   const [activeTab, setActiveTab] = useState("overview")
   const [showActivityForm, setShowActivityForm] = useState(false)

   const isBuyer = contact.role === 'buyer'

   // Si no hay actividad reciente, sugerimos abrir el formulario
   const isNewContact = activities.length === 0

   const getRoleLabel = (role: string) => {
      if (role === 'buyer') return t.dashboard.contacts.role_buyer
      if (role === 'owner') return t.dashboard.contacts.role_owner
      return t.dashboard.contacts.role_seller // Fallback to Seller/Vendedor instead of generic "Cliente"
   }

   return (

      <div className="flex flex-col h-screen bg-background animate-in fade-in duration-500">
         {/* HEADER FIJO ELIMINADO PARA EVITAR DUPLICIDAD Y LIMPIAR LA UI */}

         {/* CONTENIDO SCROLLABLE */}

         {/* CONTENIDO SCROLLABLE */}
         <div className="flex-1 overflow-y-auto bg-muted/10 p-4 md:p-6">
            <div className="max-w-5xl mx-auto space-y-6 pb-20">

               {/* 1. HERO PROFILE */}
               <div className="mb-4">
                  <Link href="/dashboard/contacts" className="inline-flex items-center text-sm text-slate-500 hover:text-primary mb-4 transition-colors">
                     <ArrowLeft className="h-4 w-4 mr-1" /> Volver a Contactos
                  </Link>
                  <ContactHero contact={contact} />
               </div>

               {/* 1.5. CEREBRO IA (Next Step) */}
               <NextStepCard contact={contact} />

               {/* 2. PESTAÑAS DE CONTENIDO */}
               <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">

                  <div className="bg-card p-1 rounded-xl border shadow-sm inline-flex w-full md:w-auto overflow-x-auto">
                     <TabsList className="bg-transparent h-auto p-0 gap-1 w-full justify-start">
                        <TabsTrigger
                           value="overview"
                           className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2 px-4 font-medium flex-1 md:flex-none"
                        >
                           {t.dashboard.contacts.detail.tabs.overview}
                        </TabsTrigger>
                        <TabsTrigger
                           value="activity"
                           className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2 px-4 font-medium flex-1 md:flex-none"
                        >
                           {t.dashboard.contacts.detail.tabs.activity}
                        </TabsTrigger>
                     </TabsList>
                  </div>

                  <TabsContent value="overview" className="space-y-6 animate-in slide-in-from-left-2 duration-300">
                     <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                           {isBuyer && <VisualPreferences contact={contact} />}
                           <ContactScoreCard contact={contact} />
                        </div>
                        <div className="space-y-6">
                           <Card className="shadow-sm">
                              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                 <CardTitle className="text-base font-medium">{t.dashboard.contacts.detail.overview.recent_activity}</CardTitle>
                                 <Button variant="ghost" size="sm" onClick={() => setActiveTab('activity')} className="text-xs">
                                    {t.dashboard.contacts.detail.overview.view_all}
                                 </Button>
                              </CardHeader>
                              <CardContent>
                                 <ChatActivityTimeline activities={activities.slice(0, 3)} />
                                 {isNewContact && (
                                    <div className="mt-6 text-center">
                                       <Button size="sm" variant="outline" className="w-full border-dashed" onClick={() => { setActiveTab('activity'); setShowActivityForm(true); }}>
                                          <Plus className="h-3.5 w-3.5 mr-2" /> {t.dashboard.contacts.detail.overview.register_first_followup}
                                       </Button>
                                    </div>
                                 )}
                              </CardContent>
                           </Card>
                        </div>
                     </div>
                  </TabsContent>


                  <TabsContent value="activity" className="space-y-6 animate-in slide-in-from-left-2 duration-300">
                     <Card className={`border shadow-sm transition-all ${showActivityForm ? 'ring-2 ring-primary/20 border-primary' : 'hover:border-primary/50'}`}>
                        <CardHeader className="py-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowActivityForm(!showActivityForm)}>
                           <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
                                 <div className="bg-primary/10 p-1.5 rounded-full">
                                    <Plus className="h-4 w-4" />
                                 </div>
                                 {t.dashboard.contacts.detail.activity.register_new_interaction}
                              </CardTitle>
                              <Button variant="ghost" size="sm" className="h-8 text-xs">
                                 {showActivityForm ? t.dashboard.contacts.detail.activity.cancel : t.dashboard.contacts.detail.activity.open}
                              </Button>
                           </div>
                        </CardHeader>
                        {(showActivityForm || isNewContact) && (
                           <CardContent className="pt-0 pb-6 animate-in slide-in-from-top-2 fade-in">
                              <div className="pt-4 border-t">
                                 <NewActivityForm contactId={contact.id} onSuccess={platformRefresh} />
                              </div>
                           </CardContent>
                        )}
                     </Card>

                     <Card className="shadow-sm">
                        <CardContent className="pt-6">
                           <ChatActivityTimeline activities={activities} />
                        </CardContent>
                     </Card>
                  </TabsContent>

               </Tabs>
            </div>
         </div>
      </div>
   )
}
