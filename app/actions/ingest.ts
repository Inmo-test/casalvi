'use server'

import { ingestDirectory, ingestFile } from '@/lib/ingest'
import { getMyAgency } from '@/app/actions/team'
import { createClient } from '@/lib/supabase/server'

export async function ingestLocalDirectory(dirPath: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { agency } = await getMyAgency()
  if (!agency) return { error: 'Sin agencia' }

  try {
    const results = await ingestDirectory(dirPath, agency.id)
    return { success: true, results }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function ingestSingleFile(filePath: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { agency } = await getMyAgency()
  if (!agency) return { error: 'Sin agencia' }

  try {
    const result = await ingestFile(filePath, agency.id)
    return { success: true, result }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function listIngestedDocuments() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { agency } = await getMyAgency()
  if (!agency) return { error: 'Sin agencia' }

  const { data: contactDocs } = await supabase
    .from('contact_documents')
    .select('id, original_name, contact_id, summary, ingested_at, contacts(first_name, last_name)')
    .eq('agency_id', agency.id)
    .order('ingested_at', { ascending: false })
    .limit(100)

  const { data: nbhdDocs } = await supabase
    .from('neighborhood_documents')
    .select('id, original_name, zone, summary, ingested_at')
    .eq('agency_id', agency.id)
    .order('ingested_at', { ascending: false })
    .limit(100)

  return { success: true, contactDocs: contactDocs ?? [], nbhdDocs: nbhdDocs ?? [] }
}
