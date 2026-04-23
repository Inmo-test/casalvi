'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@casalvi/ui"
import { Button } from "@casalvi/ui"
import { Input } from "@casalvi/ui"
import { Label } from "@casalvi/ui"
import { createSmartGroup } from '@/app/actions/smart-groups'
import { useToast } from '@/hooks/use-toast'
import { Users, Loader2 } from 'lucide-react'

interface CreateGroupDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedContactIds: string[]
    onGroupCreated: () => void
}

export function CreateGroupDialog({ open, onOpenChange, selectedContactIds, onGroupCreated }: CreateGroupDialogProps) {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return

        setLoading(true)

        // Creamos un grupo "estático" basado en IDs
        const result = await createSmartGroup({
            name,
            icon: 'users',
            color: 'blue',
            filters: {
                includedIds: selectedContactIds // Nuevo filtro: lista explicita de IDs
            }
        })

        setLoading(false)

        if (result.success) {
            toast({ title: "Grupo creado", description: `${name} ha sido guardado con ${selectedContactIds.length} contactos.` })
            onGroupCreated()
            onOpenChange(false)
            setName('')
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear Grupo</DialogTitle>
                    <DialogDescription>
                        Crearás un nuevo grupo con los <strong>{selectedContactIds.length}</strong> contactos seleccionados.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre del Grupo</Label>
                        <Input
                            id="name"
                            placeholder="Ej: Inversores VIP, Vecinos Centro..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading || !name.trim()}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Grupo
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
