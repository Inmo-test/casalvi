'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from "@/components/ui"
import { Label } from "@/components/ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui"
import { Search } from 'lucide-react'
import { Card, CardContent } from "@/components/ui"
import { useFilterStore } from '@/lib/stores/filter-store'

interface TeamMember {
  user_id: string
  email: string
  name: string
  role: string
}

interface ContactsFilterBarProps {
  mode: 'owners' | 'buyers'
  teamMembers?: TeamMember[]
}

export function ContactsFilterBar({ mode, teamMembers = [] }: ContactsFilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ✅ ZUSTAND STORE - Source of Truth
  const {
    search: searchQuery,
    status,
    owner: ownerId,
    setSearch,
    setStatus,
    setOwner,
  } = useFilterStore()

  // Local state for buyer-specific filters (can be moved to store later if needed)
  const viability = searchParams.get('viability') || 'all'
  const minBudget = searchParams.get('min_budget') || ''
  const maxBudget = searchParams.get('max_budget') || ''

  // 🔄 ONE-TIME INIT: Read initial values from URL on mount
  useEffect(() => {
    const initialSearch = searchParams.get('q')
    const initialOwnerId = searchParams.get('ownerId')
    const initialStatus = searchParams.get('status')

    if (initialSearch) setSearch(initialSearch)
    if (initialOwnerId) setOwner(initialOwnerId)
    if (initialStatus && (initialStatus === 'all' || initialStatus === 'farming' || initialStatus === 'prospect' || initialStatus === 'closed')) {
      setStatus(initialStatus as any)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only on mount

  // 🌐 OPTIONAL: Sync Store → URL (for web link sharing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams()

      // Preserve view param
      const viewParam = searchParams.get('view')
      if (viewParam) params.set('view', viewParam)

      // Sync store values to URL
      if (searchQuery?.trim()) params.set('q', searchQuery.trim())
      if (ownerId && ownerId !== 'all') params.set('ownerId', ownerId)

      if (mode === 'owners') {
        if (status && status !== 'all' && status !== null) {
          params.set('status', status)
        }
        // Probability handled separately if needed
      } else {
        // Buyer filters from local state (can migrate to store)
        if (viability && viability !== 'all') params.set('viability', viability)
        if (minBudget.trim()) params.set('min_budget', minBudget.trim())
        if (maxBudget.trim()) params.set('max_budget', maxBudget.trim())
      }

      router.push(`?${params.toString()}`, { scroll: false })
    }, searchQuery ? 500 : 0) // Debounce for search

    return () => clearTimeout(timeoutId)
  }, [searchQuery, ownerId, status, viability, minBudget, maxBudget, mode, router, searchParams])

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Agent Filter */}
          {teamMembers.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="ownerId">Agente</Label>
              <Select
                value={ownerId || 'all'}
                onValueChange={(value) => setOwner(value === 'all' ? null : value)}
              >
                <SelectTrigger id="ownerId">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.name || member.email || `Usuario ${member.user_id.substring(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Búsqueda</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                type="text"
                placeholder="Buscar por nombre, teléfono, dirección..."
                value={searchQuery}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Mode-specific filters */}
          {mode === 'owners' ? (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Property Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Situación del Inmueble</Label>
                <Select
                  value={status || 'all'}
                  onValueChange={(value) => setStatus(value === 'all' ? null : value as any)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="farming">Farming</SelectItem>
                    <SelectItem value="prospect">Prospecto</SelectItem>
                    <SelectItem value="closed">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sale Probability - Can add to store if needed */}
              <div className="space-y-2">
                <Label htmlFor="probability">Probabilidad de Venta</Label>
                <Select defaultValue="all">
                  <SelectTrigger id="probability">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="high">Alta (&gt;70%)</SelectItem>
                    <SelectItem value="medium">Media (40-70%)</SelectItem>
                    <SelectItem value="low">Baja (&lt;40%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {/* Financial Viability - Can migrate to store */}
              <div className="space-y-2">
                <Label htmlFor="viability">Viabilidad Financiera</Label>
                <Select defaultValue="all">
                  <SelectTrigger id="viability">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="approved">Aprobada</SelectItem>
                    <SelectItem value="studying">Pendiente</SelectItem>
                    <SelectItem value="negative">Rechazada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Min Budget */}
              <div className="space-y-2">
                <Label htmlFor="minBudget">Presupuesto Mínimo</Label>
                <Input
                  id="minBudget"
                  type="number"
                  placeholder="Ej: 150000"
                  defaultValue=""
                />
              </div>

              {/* Max Budget */}
              <div className="space-y-2">
                <Label htmlFor="maxBudget">Presupuesto Máximo</Label>
                <Input
                  id="maxBudget"
                  type="number"
                  placeholder="Ej: 300000"
                  defaultValue=""
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
