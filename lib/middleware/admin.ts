import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Admin authorization middleware
 * Uses JWT claims to check admin status - NO DATABASE QUERY
 * Prerequisite: User must be authenticated (run withAuth first)
 */
export async function withAdmin(request: NextRequest): Promise<NextResponse | null> {
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

    // CRITICAL: Check is_admin from JWT claims (no DB query!)
    // This is synced automatically by the tr_sync_agency_claim trigger
    const isAdmin = user.user_metadata?.is_admin || user.app_metadata?.is_admin || false

    if (!isAdmin) {
        // Not an admin - redirect to normal dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return null // User is admin, continue
}

// checkTeamManagementPermission moved to @/lib/services/permissions-service.ts to avoid Edge Runtime issues.
