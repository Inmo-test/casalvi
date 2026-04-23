/**
 * Motor de ingesta: toma un archivo local, lo extrae, clasifica, trocea,
 * embebe y guarda en la BD vinculándolo al contacto o zona detectados.
 */

import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractText } from './extract'
import { chunkText } from './chunk'
import { classifyDocument } from './classify'
import { findContactByHints } from './link'
import { generateEmbedding } from '@/lib/services/ai/embeddings'

export interface IngestResult {
  documentId: string
  kind: 'contact' | 'neighborhood'
  contactId?: string
  zone?: string
  chunkCount: number
  skipped?: 'duplicate'
}

async function hashFile(filePath: string): Promise<string> {
  const buf = await fs.readFile(filePath)
  return createHash('sha256').update(buf).digest('hex')
}

export async function ingestFile(
  filePath: string,
  agencyId: string
): Promise<IngestResult> {
  const supabase = createAdminClient()
  const stat = await fs.stat(filePath)
  const hash = await hashFile(filePath)
  const originalName = path.basename(filePath)

  // Deduplicación por (agency_id, file_hash)
  const { data: existingContactDoc } = await supabase
    .from('contact_documents')
    .select('id, contact_id')
    .eq('agency_id', agencyId)
    .eq('file_hash', hash)
    .maybeSingle()

  if (existingContactDoc) {
    return {
      documentId: existingContactDoc.id,
      kind: 'contact',
      contactId: existingContactDoc.contact_id ?? undefined,
      chunkCount: 0,
      skipped: 'duplicate',
    }
  }

  const { data: existingNbhdDoc } = await supabase
    .from('neighborhood_documents')
    .select('id, zone')
    .eq('agency_id', agencyId)
    .eq('file_hash', hash)
    .maybeSingle()

  if (existingNbhdDoc) {
    return {
      documentId: existingNbhdDoc.id,
      kind: 'neighborhood',
      zone: existingNbhdDoc.zone ?? undefined,
      chunkCount: 0,
      skipped: 'duplicate',
    }
  }

  const { text, mimeType } = await extractText(filePath)
  if (!text.trim()) {
    throw new Error(`No se extrajo texto de ${originalName}`)
  }

  const classification = await classifyDocument(text)

  let kind: 'contact' | 'neighborhood'
  let contactId: string | undefined
  let zone: string | undefined

  if (classification.kind === 'contact') {
    const contact = await findContactByHints(agencyId, classification.contactHints)
    if (contact) {
      kind = 'contact'
      contactId = contact.id
    } else {
      // sin match, cae a neighborhood como fallback para no perder info
      kind = 'neighborhood'
      zone = classification.zone
    }
  } else if (classification.kind === 'neighborhood') {
    kind = 'neighborhood'
    zone = classification.zone
  } else {
    kind = 'neighborhood'
  }

  let documentId: string

  if (kind === 'contact') {
    const { data, error } = await supabase
      .from('contact_documents')
      .insert({
        agency_id: agencyId,
        contact_id: contactId,
        file_path: filePath,
        file_hash: hash,
        file_size: stat.size,
        mime_type: mimeType,
        original_name: originalName,
        extracted_text: text,
        summary: classification.summary,
        classification: classification.kind,
      })
      .select('id')
      .single()
    if (error || !data) throw new Error(`Error insertando documento: ${error?.message}`)
    documentId = data.id
  } else {
    const { data, error } = await supabase
      .from('neighborhood_documents')
      .insert({
        agency_id: agencyId,
        zone,
        file_path: filePath,
        file_hash: hash,
        file_size: stat.size,
        mime_type: mimeType,
        original_name: originalName,
        extracted_text: text,
        summary: classification.summary,
      })
      .select('id')
      .single()
    if (error || !data) throw new Error(`Error insertando documento: ${error?.message}`)
    documentId = data.id
  }

  const chunks = chunkText(text)
  const table = kind === 'contact' ? 'contact_document_chunks' : 'neighborhood_document_chunks'

  for (let i = 0; i < chunks.length; i++) {
    const content = chunks[i]
    const embedding = await generateEmbedding(content)
    const row: any = {
      document_id: documentId,
      agency_id: agencyId,
      chunk_index: i,
      content,
      embedding,
    }
    if (kind === 'contact' && contactId) row.contact_id = contactId
    if (kind === 'neighborhood' && zone) row.zone = zone
    const { error } = await supabase.from(table).insert(row)
    if (error) throw new Error(`Error insertando chunk ${i}: ${error.message}`)
  }

  return { documentId, kind, contactId, zone, chunkCount: chunks.length }
}

export async function ingestDirectory(
  dirPath: string,
  agencyId: string,
  opts: { recursive?: boolean; extensions?: string[] } = {}
): Promise<IngestResult[]> {
  const extensions = opts.extensions ?? ['.pdf', '.docx', '.txt', '.md']
  const results: IngestResult[] = []

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory() && opts.recursive !== false) {
        await walk(full)
      } else if (entry.isFile() && extensions.includes(path.extname(entry.name).toLowerCase())) {
        try {
          const result = await ingestFile(full, agencyId)
          results.push(result)
        } catch (err) {
          console.error(`[ingest] ${full}:`, (err as Error).message)
        }
      }
    }
  }

  await walk(dirPath)
  return results
}
