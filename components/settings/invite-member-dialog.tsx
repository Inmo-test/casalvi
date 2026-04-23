'use client'

import { useState } from 'react'
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
import { inviteMember } from '@/app/actions/team'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Plus, Copy, Check } from 'lucide-react'

export function InviteMemberDialog() {
  const router = useRouter()
  const { toast } = useToast()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [invitationCode, setInvitationCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await inviteMember(email)

    if ('error' in result && result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
      setLoading(false)
    } else {
      setInvitationCode(result.invitationCode || null)
      setLoading(false)
      router.refresh()
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast({
      title: 'Código copiado',
      description: 'El código de invitación se ha copiado al portapapeles.',
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setEmail('')
      setInvitationCode(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Invitar Miembro
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
          <DialogDescription>
            Genera un código de invitación para compartir con un nuevo miembro de tu equipo.
          </DialogDescription>
        </DialogHeader>

        {!invitationCode ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email del nuevo miembro</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nuevo@ejemplo.com"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  El código de invitación se generará para compartir con este usuario.
                </p>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading || !email.trim()}>
                  {loading ? 'Generando...' : 'Generar Código'}
                </Button>
              </DialogFooter>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 p-4">
              <p className="text-sm font-medium text-green-800 dark:text-green-400 mb-2">
                Código de invitación generado
              </p>
              <p className="text-xs text-green-700 dark:text-green-500 mb-3">
                Comparte este código con <strong>{email}</strong> para que se una a tu agencia.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-2 bg-white dark:bg-card rounded border font-mono text-sm">
                  {invitationCode}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(invitationCode)}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
