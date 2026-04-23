'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPreferences(contactId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('preferences')
    .select('*')
    .eq('contact_id', contactId)
    .single()
    
  return data
}

export async function updatePreferences(contactId: string, data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  // 1. Obtener Agencia
  const { data: member } = await supabase
    .from('agency_members')
    .select('agency_id')
    .eq('user_id', user.id)
    .single()

  if (!member) return { error: 'No se encontró tu agencia asociada.' }

  // 2. Limpieza de Datos (Sanitización) 🧼
  // Convertimos cadenas vacías a null y strings numéricos a números reales
  const payload = {
    contact_id: contactId,
    agency_id: member.agency_id,
    
    min_price: data.minPrice ? Number(data.minPrice) : null,
    max_price: data.maxPrice ? Number(data.maxPrice) : null,
    min_bedrooms: data.minBedrooms ? Number(data.minBedrooms) : null,
    
    // Convertir string de zonas a array, limpiando espacios
    zones: data.zones && data.zones.trim().length > 0
      ? data.zones.split(',').map((z: string) => z.trim()).filter((z: string) => z.length > 0)
      : [],
      
    property_type: data.propertyType || 'apartment',
    financial_status: data.financialStatus || 'studying',
    updated_at: new Date().toISOString()
  }

  console.log("Intentando guardar preferencias:", payload) // Debug en servidor

  // 3. Upsert
  const { error } = await supabase
    .from('preferences')
    .upsert(payload, { onConflict: 'contact_id' })

  if (error) {
    console.error('Error Supabase:', error)
    return { error: `Error DB: ${error.message}` }
  }

  revalidatePath(`/dashboard/contacts/${contactId}`)
  return { success: true }
}

