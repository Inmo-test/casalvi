'use client'

import { useState } from 'react'
import { Button } from "@/components/ui"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui"
import { Input } from "@/components/ui"
import { Label } from "@/components/ui"
import { Loader2, Target } from 'lucide-react'
import { createGoal } from '@/app/actions/goals'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface CreateGoalDialogProps {
  members: { userId: string; name: string; role: string }[]
}

export function CreateGoalDialog({ members }: CreateGoalDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Estados del formulario
  const [targetUser, setTargetUser] = useState<string>('all')
  const [type, setType] = useState<'contacts_created' | 'properties_listed'>('contacts_created')
  const [value, setValue] = useState('')
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const numValue = parseInt(value)
    if (isNaN(numValue) || numValue <= 0) {
      toast({ title: 'Error', description: 'Introduce un número válido', variant: 'destructive' })
      setLoading(false)
      return
    }

    const result = await createGoal(targetUser, type, numValue, period)

    if ('error' in result && result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({
        title: '¡Objetivo Lanzado! 🚀',
        description: 'El equipo ya puede ver su nueva meta.',
      })
      setOpen(false)
      setValue('') // Limpiar campo
      router.refresh() // Refrescar la página para mostrar el nuevo objetivo
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-sm">
          <Target className="mr-2 h-4 w-4" />
          Asignar Objetivo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Asignar Nuevo Objetivo</DialogTitle>
          <DialogDescription>
            Define qué debe conseguir tu equipo. El sistema medirá el progreso automáticamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* 1. A QUIÉN */}
          <div className="space-y-2">
            <Label>Asignar a</Label>
            <Select value={targetUser} onValueChange={setTargetUser}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🏢 Toda la Agencia (Global)</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    👤 {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 2. QUÉ MEDIR */}
            <div className="space-y-2">
              <Label>Métrica</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contacts_created">Contactos Nuevos</SelectItem>
                  <SelectItem value="properties_listed">Propiedades Captadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 3. CUÁNDO */}
            <div className="space-y-2">
              <Label>Periodo</Label>
              <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Este Mes</SelectItem>
                  <SelectItem value="quarterly">Este Trimestre</SelectItem>
                  <SelectItem value="yearly">Este Año</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 4. CUÁNTO */}
          <div className="space-y-2">
            <Label>Cantidad Objetivo</Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="Ej: 20"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                min="1"
                className="pl-4"
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">
              El agente deberá conseguir {value || 'X'}{' '}
              {type === 'contacts_created' ? 'contactos' : 'propiedades'}.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Objetivo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

