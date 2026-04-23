'use server'

import { createClient } from '@/lib/supabase/server'

export type SearchResult = {
    id: string
    label: string
    subLabel?: string
    image?: string
}

export async function searchResources(
    query: string,
    type: 'contact' | 'property'
): Promise<SearchResult[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []
    if (!user) return []
    // Let's simplify: If empty, show defaults. If not empty, require 1+ chars.
    if (query && query.trim().length === 0) {
        // This is the "User typed @" case (handled below)
    } else if (query && query.trim().length < 2) {
        // Too short to search specific text
        return []
    }

    const searchQuery = query.trim().toLowerCase()

    try {
        if (type === 'contact') {
            // Buscar Contactos (Nombre, Email, Teléfono)
            let queryBuilder = supabase
                .from('contacts')
                .select('id, first_name, last_name, email, phone')

            if (searchQuery) {
                queryBuilder = queryBuilder.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
            }

            const { data } = await queryBuilder
                .limit(searchQuery ? 5 : 10)
                .order('created_at', { ascending: false })

            if (!data) return []

            return data.map(c => ({
                id: c.id,
                label: `${c.first_name} ${c.last_name || ''}`.trim(),
                subLabel: c.email || c.phone || 'Sin datos de contacto'
            }))
        }

        if (type === 'property') {
            // Buscar Propiedades (Calle, Título)
            let queryBuilder = supabase
                .from('properties')
                // Removed 'title' as it does not exist in the DB schema
                // Try to select 'images' as fallback. If it doesn't exist, we might get an error, but createProperty writes to it.
                .select('id, street, street_number, floor, door, price, status, formatted_address, address, photo_url, images')

            if (searchQuery) {
                // Search by street name only (since title doesn't exist)
                queryBuilder = queryBuilder.ilike('street', `%${searchQuery}%`)
            } else {
                // Default: Show properties in "preparation" and "active" stages
                queryBuilder = queryBuilder.in('status', ['active', 'listing', 'valuation'])
            }

            const { data, error } = await queryBuilder
                .limit(searchQuery ? 5 : 20)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('❌ DB ERROR:', error)
            }

            if (!data) return []

            return data.map(p => {
                // Construct best possible address label
                const streetPart = [p.street, p.street_number].filter(Boolean).join(' ')
                const floorPart = [p.floor, p.door].filter(Boolean).join(' ')

                let mainLabel = streetPart
                if (floorPart) mainLabel += ` ${floorPart}`

                // Fallbacks if street is empty
                if (!mainLabel.trim()) {
                    mainLabel = p.formatted_address || p.address || 'Propiedad sin dirección'
                }

                const price = p.price ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(p.price) : ''

                // Fallback strategies for image
                const mainImage = p.photo_url || (p.images && p.images.length > 0 ? p.images[0] : undefined)

                return {
                    id: p.id,
                    label: mainLabel.trim(),
                    subLabel: `${p.status ? `[${p.status}] ` : ''}${price ? price : ''}`,
                    image: mainImage
                }
            })
        }
    } catch (err) {
        console.error(`Error searching ${type}:`, err)
        return []
    }

    return []
}
