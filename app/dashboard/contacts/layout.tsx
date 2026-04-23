import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contactos', // "Contactos | Casalvi"
}

export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

