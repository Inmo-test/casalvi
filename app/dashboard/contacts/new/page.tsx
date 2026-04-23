import { NewContactPageClient } from '@/components/contacts/new-contact-page-client'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Nuevo Contacto | Casalvi',
}

export default function NewContactPage() {
    return <NewContactPageClient />
}
