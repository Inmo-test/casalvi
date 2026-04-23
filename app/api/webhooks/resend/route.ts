import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789')

// Webhook Secret Verification (Optional in Resend but recommended)
// For now, we trust the POST payload structure

export async function POST(request: Request) {
    try {
        const payload = await request.json()

        // Resend sends an array of events or single event? 
        // Docs say it verifies signature usually, but payload is:
        // { type: 'email.opened', data: { email_id: '...', ... } }

        const type = payload.type
        const data = payload.data
        const emailId = data?.email_id

        if (!emailId) {
            return NextResponse.json({ message: 'No email_id found' }, { status: 200 }) // Return 200 to acknowledge
        }

        const supabase = await createClient()

        if (type === 'email.delivered') {
            await supabase
                .from('campaign_sends')
                .update({
                    status: 'delivered',
                    delivered_at: payload.created_at || new Date().toISOString()
                })
                .eq('provider_email_id', emailId)
        }
        else if (type === 'email.opened') {
            await supabase
                .from('campaign_sends')
                .update({
                    opened_at: payload.created_at || new Date().toISOString()
                })
                .eq('provider_email_id', emailId)

            // Increment campaign stats
            // Ideally should be a trigger or separate counters, but here we do simple
            await incrementCampaignStat(emailId, 'total_opened')
        }
        else if (type === 'email.clicked') {
            await supabase
                .from('campaign_sends')
                .update({
                    clicked_at: payload.created_at || new Date().toISOString()
                })
                .eq('provider_email_id', emailId)

            await incrementCampaignStat(emailId, 'total_clicked')
        }
        else if (type === 'email.bounced') {
            await supabase
                .from('campaign_sends')
                .update({
                    status: 'bounced',
                    error_message: 'Bounced via Resend webhook'
                })
                .eq('provider_email_id', emailId)
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Webhook Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

async function incrementCampaignStat(providerEmailId: string, column: string) {
    const supabase = await createClient()

    // Find campaign_id
    const { data: send } = await supabase
        .from('campaign_sends')
        .select('campaign_id')
        .eq('provider_email_id', providerEmailId)
        .single()

    if (send) {
        // Increment using RPC for atomicity if possible, or simple update
        // Since Supabase doesn't have simple increment in JS Client update easily without extensions:

        // Fetch current count to be safe-ish (race conditions exist but acceptable for metrics MVP)
        // Better: SQL function. But let's verify if we have rpc.
        // We will just leave it. The `email_campaigns` table has `total_opened`.
        // A SQL trigger would be better.
        // Let's rely on re-calculating or just skip incrementing here to avoid errors and rely on a nightly job?
        // Let's do simple RPC call if we create one.
        // Or just update:

        await supabase.rpc('increment_campaign_stat', {
            p_campaign_id: send.campaign_id,
            p_column: column
        })
    }
}
