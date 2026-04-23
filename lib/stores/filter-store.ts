import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ContactFilters {
    search: string
    status: 'all' | 'farming' | 'prospect' | 'closed' | null
    owner: 'all' | 'my' | string | null
    role: 'all' | 'owner' | 'buyer' | null
}

interface FilterStore extends ContactFilters {
    // Actions
    setSearch: (search: string) => void
    setStatus: (status: ContactFilters['status']) => void
    setOwner: (owner: ContactFilters['owner']) => void
    setRole: (role: ContactFilters['role']) => void
    resetFilters: () => void

    // Batch update
    setFilters: (filters: Partial<ContactFilters>) => void
}

const defaultFilters: ContactFilters = {
    search: '',
    status: null,
    owner: null,
    role: null,
}

export const useFilterStore = create<FilterStore>()(
    persist(
        (set) => ({
            ...defaultFilters,

            setSearch: (search) => set({ search }),
            setStatus: (status) => set({ status }),
            setOwner: (owner) => set({ owner }),
            setRole: (role) => set({ role }),

            resetFilters: () => set(defaultFilters),

            setFilters: (filters) => set((state) => ({ ...state, ...filters })),
        }),
        {
            name: 'contact-filters', // localStorage key
            // Only persist filters that make sense (not search typically)
            partialize: (state) => ({
                status: state.status,
                owner: state.owner,
                role: state.role,
            }),
        }
    )
)
