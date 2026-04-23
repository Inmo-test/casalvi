'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'
import imaps from 'imap-simple'

export async function updateEmailRef(formData: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    // Update profile
    const { error } = await supabase
        .from('profiles')
        .update({
            smtp_host: formData.smtp_host,
            smtp_port: formData.smtp_port,
            smtp_user: formData.smtp_user,
            smtp_password: formData.smtp_password,
            imap_host: formData.imap_host,
            imap_port: formData.imap_port,
            imap_user: formData.imap_user,
            imap_password: formData.imap_password,
            email_signature: formData.email_signature,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

    if (error) {
        console.error('Error updating email settings:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function getProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return data
}

export async function testEmailConnection(credentials: any) {
    // Validate inputs
    if (!credentials.smtp_host) return { success: false, error: 'Falta servidor SMTP' }
    if (!credentials.imap_host) return { success: false, error: 'Falta servidor IMAP' }

    // 1. Test SMTP
    try {
        console.log(`[TestConnection] Testing SMTP: ${credentials.smtp_host}:${credentials.smtp_port}`)
        const transporter = nodemailer.createTransport({
            host: credentials.smtp_host,
            port: parseInt(credentials.smtp_port),
            secure: parseInt(credentials.smtp_port) === 465,
            auth: {
                user: credentials.smtp_user,
                pass: credentials.smtp_password,
            },
        })
        await transporter.verify()
        console.log('[TestConnection] SMTP Success')
    } catch (error: any) {
        console.error('SMTP Test Failed:', error)
        return { success: false, error: `Fallo SMTP: ${error.message}` }
    }

    // 2. Test IMAP
    try {
        console.log(`[TestConnection] Testing IMAP: ${credentials.imap_host}:${credentials.imap_port}`)
        const config = {
            imap: {
                user: credentials.imap_user,
                password: credentials.imap_password, // Usually same as SMTP
                host: credentials.imap_host,
                port: parseInt(credentials.imap_port),
                tls: true,
                authTimeout: 10000, // Increased timeout
                tlsOptions: { rejectUnauthorized: false } // Relaxed security for testing (helps with some providers)
            }
        }
        const connection = await imaps.connect(config)
        await connection.end()
        console.log('[TestConnection] IMAP Success')
    } catch (error: any) {
        console.error('IMAP Test Failed:', error)
        return { success: false, error: `Fallo IMAP: ${error.message}` }
    }

    return { success: true }
}
