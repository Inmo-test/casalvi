'use client'

import { useState } from 'react'
import { Button } from "@/components/ui"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui"
import { Plus } from 'lucide-react'
import { ContactForm } from './contact-form'

interface NewContactDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  contactToEdit?: any | null
  onContactCreated?: () => void
  trigger?: React.ReactNode
}

export function NewContactDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  contactToEdit,
  onContactCreated,
  trigger
}: NewContactDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false)

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen

  const isEditing = !!contactToEdit

  const handleSuccess = () => {
    setOpen(false)
    if (onContactCreated) {
      onContactCreated()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined ? (
        trigger
      ) : (
        !isEditing && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Contacto
          </Button>
        )
      )}

      <DialogContent
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement
          if (target.closest('.pac-container') || target.closest('.pac-item')) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Contacto' : 'Nuevo Contacto'}</DialogTitle>
        </DialogHeader>

        <ContactForm
          initialData={contactToEdit}
          isEditing={isEditing}
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
