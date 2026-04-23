import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Authentication middleware
 * Ensures user is authenticated, redirects to login if not
 */
export async function withAuth(request: NextRequest): Promise<NextResponse | null> {
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set() { }, // No-op for middleware
                remove() { }, // No-op for middleware
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // --- SINGLE DEVICE SESSION CHECK ---
    // Verificamos si la sesión del dispositivo coincide con la última registrada

    // EXCEPCIÓN: Retorno de Stripe/Pagos
    // Los callbacks de pagos a menudo pierden cookies SameSite=Lax en la redirección inicial.
    // Si venimos de un checkout exitoso o cancelado, confiamos en la sesión de Supabase (user) y saltamos este chequeo extra.
    const isPaymentCallback = request.nextUrl.searchParams.has('checkout')

    if (!isPaymentCallback) {
        const deviceSessionId = request.cookies.get('device_session_id')?.value

        const { data: profile } = await supabase
            .from('profiles')
            .select('active_session_id')
            .eq('id', user.id)
            .single()

        // Si existe una sesión activa en DB y no coincide con la cookie de este dispositivo
        if (profile?.active_session_id && profile.active_session_id !== deviceSessionId) {
            const url = new URL('/login', request.url)
            url.searchParams.set('reason', 'session_conflict')
            return NextResponse.redirect(url)
        }
    }
    // -----------------------------------

    return null // Continue to next middleware
}
