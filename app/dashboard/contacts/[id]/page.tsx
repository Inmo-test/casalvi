import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ContactDetailView } from '@/components/contacts/contact-detail-view'

export const dynamic = 'force-dynamic'

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const { data: contact, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !contact) {
      return notFound()
    }

    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('contact_id', params.id)
      .order('created_at', { ascending: false })

    return (
      <ContactDetailView
        contact={contact}
        activities={activities || []}
      />
    )
  } catch (error) {
    console.error('Error rendering ContactDetailPage:', error)
    return <div>Error cargando el contacto. Intente recargar.</div>
  }
}
