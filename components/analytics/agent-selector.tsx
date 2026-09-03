'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
import { Users } from 'lucide-react'

interface AgentSelectorProps {
  members: { userId: string; name: string; role: string }[]
}

export function AgentSelector({ members }: AgentSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // El valor actual sale de la URL (?agentId=...) o es 'all'
  const currentAgent = searchParams.get('agentId') || 'all'

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams)

    if (value === 'all') {
      params.delete('agentId') // Si elige "Todos", limpiamos la URL
    } else {
      params.set('agentId', value) // Si elige uno, lo ponemos
    }

    // Recargamos la página con el nuevo filtro
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-muted-foreground" />
      <Select value={currentAgent} onValueChange={handleChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filtrar por agente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toda la Agencia</SelectItem>
          {members.map((member) => (
            <SelectItem key={member.userId} value={member.userId}>
              {member.role === 'owner' ? '👑 ' : '👤 '}
              {member.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}


