'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type SmartGroup = {
    id: string
    name: string
    icon: string
    color: string
    filters: {
        minScore?: number
        maxScore?: number
        role?: string[]
        zones?: string[]
        lastActivityDays?: number
        includedIds?: string[]
    }
    created_at: string
}

export async function getSmartGroups() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    const { data, error } = await supabase
        .from('smart_groups')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching smart groups:', error)
        return { success: false, error: error.message }
    }

    const mappedData = data?.map(d => ({
        ...d,
        filters: d.filter_criteria, // Map DB 'filter_criteria' to TS 'filters'
        filter_criteria: undefined
    })) as unknown as SmartGroup[]

    return { success: true, data: mappedData }
}

export async function createSmartGroup(group: Omit<SmartGroup, 'id' | 'created_at'>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    const { data, error } = await supabase
        .from('smart_groups')
        .insert([{
            name: group.name,
            icon: group.icon,
            color: group.color,
            filter_criteria: group.filters, // Map TS 'filters' to DB 'filter_criteria'
            created_by: user.id
        }])
        .select()
        .single()

    if (error) {
        console.error('Error creating smart group:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/contacts')

    const mapped = {
        ...data,
        filters: data.filter_criteria,
        filter_criteria: undefined
    } as unknown as SmartGroup

    return { success: true, data: mapped }
}

export async function deleteSmartGroup(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    const { error } = await supabase
        .from('smart_groups')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error deleting smart group:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/contacts')
    return { success: true }
}
