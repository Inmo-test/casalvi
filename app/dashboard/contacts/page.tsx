'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { NewContactDialog } from '@/components/contacts/new-contact-dialog'
import { getContacts } from '@/app/actions/contacts'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Filter, Users, ArrowUpDown } from 'lucide-react'
import { ContactCard } from '@/components/contacts/contact-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getTeamMembers } from '@/app/actions/team'
import { Card } from "@/components/ui/card"
import { ContactsDataTable } from '@/components/contacts/contacts-data-table'
import { SmartGroupsSidebar } from '@/components/contacts/smart-groups-sidebar'
import type { SmartGroup } from '@/app/actions/smart-groups'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useI18n } from '@/lib/i18n/I18nContext'

export default function ContactsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { t } = useI18n()

  // Estados de Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedGroup, setSelectedGroup] = useState<SmartGroup | null>(null)

  // Preferencia de Vista
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [newContactOpen, setNewContactOpen] = useState(false)

  const handleContactCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] })
  }

  // --- QUERY: CONTACTS ---
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const result = await getContacts()
      if (!result.success) throw new Error(result.error)
      return result.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  // --- QUERY: TEAM MEMBERS (Opcional, si queremos caché también aquí) ---
  // Por ahora lo dejamos simple o lo migramos también para consistencia
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const result = await getTeamMembers()
      return Array.isArray(result) ? result : []
    },
    staleTime: 10 * 60 * 1000
  })

  // --- FILTERING LOGIC (useMemo) ---
  const filteredContacts = useMemo(() => {
    let filtered = contacts

    // 1. Filtro de Texto (Búsqueda)
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (c: any) =>
          c.first_name?.toLowerCase().includes(lowerTerm) ||
          c.last_name?.toLowerCase().includes(lowerTerm) ||
          c.email?.toLowerCase().includes(lowerTerm) ||
          c.phone?.includes(searchTerm)
      )
    }

    // 2. Filtro de Tab (Rol)
    if (activeTab !== 'all') {
      filtered = filtered.filter((c: any) => c.role === activeTab)
    }

    // 3. Filtro Smart Group
    if (selectedGroup && selectedGroup.filters) {
      const { minScore, role, includedIds } = selectedGroup.filters

      if (includedIds && includedIds.length > 0) {
        filtered = filtered.filter((c: any) => includedIds.includes(c.id))
      } else {
        // Dynamic Group Logic
        if (minScore) {
          filtered = filtered.filter((c: any) => (c.conversion_probability || 0) >= minScore)
        }
        if (role && role.length > 0) {
          filtered = filtered.filter((c: any) => role.includes(c.role))
        }
      }
    }

    return filtered
  }, [contacts, searchTerm, activeTab, selectedGroup])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  // Restore view mode preference
  useState(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('contactsViewMode') as 'grid' | 'list'
      if (savedMode) setViewMode(savedMode)
    }
  })

  const toggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('contactsViewMode', mode)
  }

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setNewContactOpen(true)
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden animate-in fade-in duration-500">
      {/* --- HEADER FIJO --- */}
      <div className="border-b bg-card shrink-0 z-20 shadow-sm">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-medium tracking-tight text-foreground flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                {t.dashboard.contacts.title}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {t.dashboard.contacts.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleCreateClick} className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> {t.dashboard.contacts.new_contact}
              </Button>

              {/* Controlled Dialog - Hidden Trigger inside logic not needed since we use props */}
              <NewContactDialog
                open={newContactOpen}
                onOpenChange={setNewContactOpen}
                onContactCreated={handleContactCreated}
                trigger={null} // Need to modify component to support no trigger or custom trigger
              />
            </div>
          </div>

          {/* BARRA DE HERRAMIENTAS */}
          <div className="mt-5 flex flex-col md:flex-row gap-3">
            {/* Buscador */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.dashboard.contacts.search_placeholder}
                className="pl-9 h-10 bg-background/50 border-input/60 rounded-lg focus:bg-background transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Filtros Tabs Desktop */}
              <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="hidden md:block w-auto">
                <TabsList className="grid w-full grid-cols-4 h-10 bg-muted/50 p-1 rounded-lg">
                  <TabsTrigger value="all" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">{t.dashboard.contacts.tab_all}</TabsTrigger>
                  <TabsTrigger value="buyer" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">{t.dashboard.contacts.tab_buyers}</TabsTrigger>
                  <TabsTrigger value="owner" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">{t.dashboard.contacts.tab_owners}</TabsTrigger>
                  <TabsTrigger value="seller" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">{t.dashboard.contacts.tab_sellers}</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* View Toggle */}
              <div className="hidden md:flex items-center p-1 bg-muted/50 rounded-lg border ml-2">
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  onClick={() => toggleViewMode('list')}
                  title="Vista Lista"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list"><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></svg>
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  onClick={() => toggleViewMode('grid')}
                  title="Vista Cuadrícula"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-grid"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                </Button>
              </div>
            </div>

            {/* Filtros Mobile */}
            <div className="md:hidden flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {['all', 'buyer', 'owner', 'seller'].map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTabChange(tab)}
                  className="rounded-full px-4 capitalize shrink-0"
                >
                  {tab === 'all' ? t.dashboard.contacts.tab_all : tab === 'owner' ? t.dashboard.contacts.tab_owners : tab === 'buyer' ? t.dashboard.contacts.tab_buyers : t.dashboard.contacts.tab_sellers}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT WITH SIDEBAR --- */}
      <div className="flex-1 flex overflow-hidden">

        <SmartGroupsSidebar
          activeGroupId={selectedGroup?.id || null}
          onSelectGroup={(group) => {
            setSelectedGroup(group)
            if (group) {
              // Optional: Switch tab to 'all' if group implies mixed roles
              setActiveTab('all')
            }
          }}
        />

        <div className="flex-1 overflow-y-auto bg-muted/10 p-4 md:p-6">
          {loadingContacts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredContacts.length > 0 ? (
            viewMode === 'grid' ? (
              // GRID VIEW (Original)
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {filteredContacts.map((contact: any) => (
                  <ContactCard
                    key={contact.id}
                    id={contact.id}
                    firstName={contact.first_name}
                    lastName={contact.last_name}
                    email={contact.email}
                    phone={contact.phone}
                    role={contact.role}
                    conversion_probability={contact.conversion_probability}
                    life_stage={contact.life_stage}
                  />
                ))}
              </div>
            ) : (
              // LIST VIEW (New V2: DataTable)
              <div className="pb-20 md:pb-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <ContactsDataTable data={filteredContacts} />
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in zoom-in-95 duration-300">
              <div className="h-24 w-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
                <Users className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-medium mb-2">{t.dashboard.contacts.empty_title}</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                {t.dashboard.contacts.empty_desc}
              </p>
              <Button onClick={() => { setSearchTerm(''); setActiveTab('all') }} variant="outline">
                {t.dashboard.contacts.clear_filters}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}