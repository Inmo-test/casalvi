'use server'

import { createClient } from '@/lib/supabase/server'
import imaps from 'imap-simple'
import { simpleParser } from 'mailparser'

export type EmailMessage = {
    id: string
    messageId?: string
    references?: string[]
    seqno: number
    from: string
    subject: string
    date: Date
    body: string
    snippet: string
    contact?: {
        id: string
        name: string
        score: number
        role: string
        zone: string
    }
}

export async function fetchInbox(folder: string = 'INBOX') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    // 1. Get Credentials
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile || !profile.imap_host || !profile.imap_user || !profile.imap_password) {
        return { success: false, error: 'Credenciales IMAP no configuradas. Ve a Configuración.' }
    }

    const config = {
        imap: {
            user: profile.imap_user,
            password: profile.imap_password,
            host: profile.imap_host,
            port: profile.imap_port || 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false }, // Fix for Vercel 'self-signed notice' error
            authTimeout: 10000
        }
    }

    let connection: any = null

    try {
        console.log(`[IMAP] Connecting to ${config.imap.host}:${config.imap.port} as ${config.imap.user}...`)
        connection = await imaps.connect(config)
        console.log('[IMAP] Connected.')

        let targetBox = folder

        // Helper: Recursively find all folders
        const getAllBoxes = (boxes: any, parent: string = ''): string[] => {
            let paths: string[] = []
            for (const key of Object.keys(boxes)) {
                const box = boxes[key]
                const delimiter = box.delimiter || '/'
                // If special folder like [Gmail] doesn't map to a selectable attribute sometimes, but usually does
                const fullPath = parent ? `${parent}${delimiter}${key}` : key
                paths.push(fullPath)
                if (box.children) {
                    paths = paths.concat(getAllBoxes(box.children, fullPath))
                }
            }
            return paths
        }

        // Auto-detect sent folder if requested
        if (folder === 'SENT') {
            const boxes = await connection.getBoxes()
            const allBoxes = getAllBoxes(boxes)
            // console.log('[IMAP] Available boxes (recursive):', allBoxes)

            // Common Sent folder names
            const sentCandidates = ['[Gmail]/Enviados', '[Gmail]/Sent Mail', 'Sent', 'Sent Items', 'Enviados']

            // Try to find strict match or similar
            const found = sentCandidates.find(c => allBoxes.includes(c)) ||
                allBoxes.find(b => b.toLowerCase().includes('sent') || b.toLowerCase().includes('enviad'))

            if (found) {
                console.log(`[IMAP] Auto-detected Sent folder: ${found}`)
                targetBox = found
            } else {
                console.warn('[IMAP] Could not auto-detect Sent folder, defaulting to INBOX')
                targetBox = 'INBOX' // Fallback to avoid 'Unknown Mailbox: SENT' error
            }
        }

        // Optimized Fetch: Get last 20 messages by Sequence Number (No Search)
        const box = await connection.openBox(targetBox)
        const totalMessages = box.messages.total
        console.log(`[IMAP] Total messages in box: ${totalMessages}`)

        if (totalMessages === 0) {
            return { success: true, data: [] }
        }

        // Calculate range: e.g., if total 100, fetch 81:100
        // NOTE: We limit to max 20 for speed
        const startSeq = Math.max(1, totalMessages - 19)
        const fetchRange = `${startSeq}:${totalMessages}`
        console.log(`[IMAP] Fetching sequence range: ${fetchRange}`)

        // imap-simple doesn't expose seq.fetch easily via its standard API in a structured way for parsing parts manually easily without search
        // BUT it exposes connection.imap which is the raw 'node-imap' client
        // We will wrapper node-imap fetch in a promise

        // ... (imports remain)

        const messages = await new Promise<any[]>((resolve, reject) => {
            const rawImap = connection.imap
            const fetchedMsgs: any[] = []

            // FETCH FULL SOURCE to let simpleParser handle everything including multipart & encodings
            const f = rawImap.seq.fetch(fetchRange, {
                bodies: [''], // Empty string means fetch the entire raw message source
                struct: true
            })

            f.on('message', (msg: any, seqno: number) => {
                let rawBuffer = Buffer.alloc(0)
                const attributes: any = { uid: seqno }

                msg.on('body', (stream: any, info: any) => {
                    stream.on('data', (chunk: any) => {
                        rawBuffer = Buffer.concat([rawBuffer, chunk])
                    })
                })

                msg.once('attributes', (attrs: any) => {
                    Object.assign(attributes, attrs)
                })

                msg.once('end', () => {
                    fetchedMsgs.push({ raw: rawBuffer, attributes, seqNo: seqno })
                })
            })

            f.once('error', (err: any) => reject(err))
            f.once('end', () => {
                console.log('[IMAP] Fetch stream ended')
                resolve(fetchedMsgs)
            })
        })

        console.log(`[IMAP] Found ${messages.length} messages.`)

        const recentMessages = messages.sort((a, b) => b.seqNo - a.seqNo)
        const emails: EmailMessage[] = []

        // Extract sender emails for bulk contact lookup
        // We'll parse first to get clean 'from' addresses
        const parsedMessages = await Promise.all(recentMessages.map(async (msg) => {
            try {
                // simpleParser is robust: handles QP, Base64, Multipart, Charsets automatically
                const parsed = await simpleParser(msg.raw)
                return { ...msg, parsed } // Attach parsed object
            } catch (e) {
                console.error('Parse error for msg', msg.seqNo, e)
                return { ...msg, parsed: null }
            }
        }))

        const senderEmails = parsedMessages
            .filter(m => m.parsed?.from?.value?.[0]?.address)
            .map(m => m.parsed.from.value[0].address)
            .filter(e => e && e.includes('@'))

        // Query Supabase
        let contacts: any[] = []
        if (senderEmails.length > 0) {
            const { data } = await supabase
                .from('contacts')
                .select('id, email, first_name, last_name, conversion_probability, role, zone')
                .in('email', senderEmails)
            contacts = data || []
        }

        const contactMap = new Map(contacts.map(c => [c.email, c]))

        for (const item of parsedMessages) {
            if (!item.parsed) continue

            const { parsed, attributes, seqNo } = item

            const rawSubject = parsed.subject || 'Sin Asunto'
            const rawFrom = parsed.from?.text || 'Desconocido'
            const cleanEmail = parsed.from?.value?.[0]?.address || rawFrom
            const rawDate = parsed.date || new Date()

            // Prefer HTML, fallback to text, fallback to textAsHtml
            // We'll return HTML if available so frontend can render rich emails safely-ish
            // If user wants plain text, we could strip it, but they asked for "Gmail style" which implies HTML support.
            const bodyContent = parsed.html !== false ? parsed.html : (parsed.textAsHtml || parsed.text || '')

            const snippet = (parsed.text || '').substring(0, 100).replace(/\s+/g, ' ').trim() || '...'

            const matchedContact = contactMap.get(cleanEmail)

            emails.push({
                id: attributes.uid.toString(),
                messageId: parsed.messageId,
                references: Array.isArray(parsed.references) ? parsed.references : (parsed.references ? [parsed.references] : []),
                seqno: seqNo,
                from: rawFrom,
                subject: rawSubject,
                date: new Date(rawDate),
                body: bodyContent, // This is now fully decoded HTML or Text
                snippet,
                contact: matchedContact ? {
                    id: matchedContact.id,
                    name: `${matchedContact.first_name} ${matchedContact.last_name || ''}`,
                    score: matchedContact.conversion_probability || 0,
                    role: matchedContact.role,
                    zone: matchedContact.zone || 'N/A'
                } : undefined
            })
        }

        return { success: true, data: emails }

    } catch (error: any) {
        // ... err handling matches original
        console.error('[IMAP] Error:', error)
        return { success: false, error: `Error conectando a IMAP: ${error.message}` }
    } finally {
        if (connection) {
            console.log('[IMAP] Closing connection')
            connection.end()
        }
    }
}
