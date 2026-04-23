'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { Button } from "@casalvi/ui"
import { PanelLeft } from 'lucide-react'
import Link from 'next/link'
// CAMBIO: Importamos el logo nuevo directamente para asegurar el diseño
import { CasalviLogo } from '@/components/ui/casalvi-logo'

interface DashboardShellProps {
  children: React.ReactNode
  userEmail: string
  plan: string | null
  role: string | null
  agencyName?: string
  isAdmin?: boolean
  stats?: {
    plan: 'starter' | 'pro' | 'agency' | 'business' | 'free'
    contactsCount: number
    propertiesCount: number
    usersCount: number
    limits: {
      maxContacts: number
      maxProperties: number
      maxUsers: number
      label: string
    }
  } | null
}

import { MobileSidebar } from '@/components/layout/mobile-sidebar'

export function DashboardShell({ children, userEmail, plan, role, agencyName, isAdmin, stats }: DashboardShellProps) {
  return (
    <div className="flex flex-col h-full w-full bg-background relative isolate overflow-hidden">
      {/* Contenido Real */}
      <div className="flex-1 h-full overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  )
}
