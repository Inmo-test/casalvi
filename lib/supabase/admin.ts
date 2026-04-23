import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente de Supabase Admin con SERVICE_ROLE_KEY
 * Este cliente bypassa RLS y debe usarse SOLO en el servidor para operaciones administrativas
 * como webhooks de Stripe donde no hay un usuario autenticado.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL no está configurada')
  }

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada')
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

