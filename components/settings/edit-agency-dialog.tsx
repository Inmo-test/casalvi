'use client'

import { useState, useEffect } from 'react'
import { Button } from "@casalvi/ui"
import { Input } from "@casalvi/ui"
import { Label } from "@casalvi/ui"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@casalvi/ui"
import { updateAgency } from '@/app/actions/team'
import { useRouter } from 'next/navigation'

interface EditAgencyDialogProps {
  agencyId: string
  currentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditAgencyDialog({
  agencyId,
  currentName,
  open,
  onOpenChange,
}: EditAgencyDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState(currentName)

  // Resetear el nombre cuando se abre el diálogo o cambia currentName
  useEffect(() => {
    if (open) {
      setName(currentName)
      setError(null)
    }
  }, [open, currentName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await updateAgency(agencyId, name)

    if ('error' in result && result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setLoading(false)
      onOpenChange(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Nombre de la Agencia</DialogTitle>
          <DialogDescription>
            Cambia el nombre de tu agencia. Este cambio será visible para todos los miembros del equipo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="agencyName">Nombre de la Agencia</Label>
              <Input
                id="agencyName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Inmobiliaria ABC"
                required
                disabled={loading}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !name.trim() || name.trim() === currentName}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

