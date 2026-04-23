import { PostHog } from 'posthog-node'
import { createAdminClient } from '@/lib/supabase/admin'

// Inicializar PostHog (solo si API key está configurada)
const posthog = process.env.POSTHOG_API_KEY 
  ? new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.POSTHOG_HOST || 'https://eu.posthog.com',
    })
  : null

export type TelemetryEvent =
    | 'AI_FEATURE_USED'
    | 'SUBSCRIPTION_UPDATED'
    | 'LIMIT_REACHED'
    | 'LIMIT_EXCEEDED'          // NUEVO: Cuando ya está sobre el límite
    | 'DOWNGRADE_DETECTED'
    | 'PAYMENT_FAILED'          // NUEVO
    | 'GRACE_PERIOD_STARTED'    // NUEVO
    | 'GRACE_PERIOD_EXPIRED'    // NUEVO
    | 'PLAN_UPGRADED'           // NUEVO
    | 'PLAN_DOWNGRADED'         // NUEVO
    | 'CSV_IMPORTED'            // NUEVO
    | 'SUBSCRIPTION_CANCELED'   // NUEVO
    | 'MEMBERS_AUTO_REMOVED'    // NUEVO

type EventPayload = Record<string, any>

/**
 * Tracks business events for internal analytics.
 * Sends to PostHog (if configured) and persists in Supabase.
 */
export async function trackEvent(
    agencyId: string,
    event: TelemetryEvent,
    payload: EventPayload = {}
) {
    try {
        // 1. Log estructurado para debug
        console.log(`📊 [TELEMETRY] ${event} | Agency: ${agencyId}`, JSON.stringify(payload))

        // 2. PostHog (si está configurado)
        if (posthog) {
            posthog.capture({
                distinctId: agencyId,
                event,
                properties: {
                    ...payload,
                    environment: process.env.NODE_ENV,
                    timestamp: new Date().toISOString(),
                },
            })
        }

        // 3. Supabase (persistencia interna para análisis)
        const supabase = createAdminClient()
        await supabase.from('telemetry_events').insert({
            agency_id: agencyId,
            event_type: event,
            event_payload: payload,
            created_at: new Date().toISOString(),
        })
    } catch (error) {
        // Telemetry should never block main thread execution
        console.error('Failed to track event:', error)
    }
}

/**
 * Shutdown PostHog client (call on process exit)
 */
export async function shutdownTelemetry() {
    if (posthog) {
        await posthog.shutdown()
    }
}
