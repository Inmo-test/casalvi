'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

// Definimos qué tipo de contexto podemos tener
type CurrentContext = {
  type: 'property' | 'contact'
  id: string
  name: string // Dirección o Nombre del contacto
} | null

interface VoiceContextType {
  currentContext: CurrentContext
  setContext: (ctx: CurrentContext) => void
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined)

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [currentContext, setContext] = useState<CurrentContext>(null)

  return (
    <VoiceContext.Provider value={{ currentContext, setContext }}>
      {children}
    </VoiceContext.Provider>
  )
}

export function useVoiceContext() {
  const context = useContext(VoiceContext)
  if (context === undefined) {
    throw new Error('useVoiceContext debe usarse dentro de un VoiceProvider')
  }
  return context
}

