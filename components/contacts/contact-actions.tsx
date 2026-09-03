'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { platformRefresh } from '@/lib/utils/platform'
import { Button } from "@/components/ui"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui"
import { NewContactDialog } from './new-contact-dialog'
import { deleteContact } from '@/app/actions/contacts'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

interface ContactActionsProps {
  contact: any
  onEdit?: (contact: any) => void
}

export function ContactActions({ contact, onEdit }: ContactActionsProps) {
  const router = useRouter()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)

    const result = await deleteContact(contact.id)

    if ('error' in result && result.error) {
      alert(`❌ Error al eliminar: ${result.error}`)
      setDeleting(false)
    } else {
      alert('✅ Contacto eliminado correctamente')
      setShowDeleteDialog(false)
      // Recargar la página para actualizar la lista
      platformRefresh()
    }
  }

  const fullName = `${contact.first_name} ${contact.last_name || ''}`.trim()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowEditDialog(true)
          }}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowDeleteDialog(true)
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de Edición */}
      <NewContactDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        contactToEdit={contact}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente a{' '}
              <span className="font-medium">{fullName}</span> y todas sus actividades.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Eliminando...' : 'Sí, eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

