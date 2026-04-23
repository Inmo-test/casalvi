'use client'

import { createContext, useContext, useState } from 'react'

interface DashboardContextType {
    isSidebarCollapsed: boolean
    toggleSidebar: () => void
    setIsSidebarCollapsed: (value: boolean) => void
    isMobileMenuOpen: boolean
    toggleMobileMenu: () => void
    setIsMobileMenuOpen: (value: boolean) => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({
    children,
    defaultCollapsed = false
}: {
    children: React.ReactNode
    defaultCollapsed?: boolean
}) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(defaultCollapsed)

    const toggleSidebar = () => {
        setIsSidebarCollapsed((prev) => {
            const newState = !prev
            document.cookie = `sidebar:state=${newState}; path=/; max-age=31536000`
            return newState
        })
    }

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev)

    return (
        <DashboardContext.Provider value={{
            isSidebarCollapsed,
            toggleSidebar,
            setIsSidebarCollapsed,
            isMobileMenuOpen,
            toggleMobileMenu,
            setIsMobileMenuOpen
        }}>
            {children}
        </DashboardContext.Provider>
    )
}

export function useDashboardContext() {
    const context = useContext(DashboardContext)
    if (context === undefined) {
        throw new Error('useDashboardContext must be used within a DashboardProvider')
    }
    return context
}

