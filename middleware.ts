import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { withAuth } from '@/lib/middleware/auth'
import { withAdmin } from '@/lib/middleware/admin'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 1. Webhook routes - skip auth entirely
  if (pathname.startsWith('/api/webhooks/')) {
    return await updateSession(request)
  }

  // 1.5 LOCALE DETECTION (I18n)
  let locale = request.cookies.get('NEXT_LOCALE')?.value
  let response = NextResponse.next()

  // ONLY detect locale if no cookie exists (first visit)
  if (!locale) {
    const country = request.geo?.country || 'US'

    // 1. Try GeoIP
    const geo = country || 'US'
    if (geo === 'ES' || geo === 'MX' || geo === 'AR' || geo === 'CO') locale = 'es'
    else if (geo === 'FR' || geo === 'BE' || geo === 'SN') locale = 'fr'
    else if (geo === 'CN' || geo === 'SG') locale = 'zh'
    else if (geo === 'RU' || geo === 'BY' || geo === 'KZ') locale = 'ru'
    else if (geo === 'DE' || geo === 'AT' || geo === 'CH') locale = 'de'
    else if (geo === 'IT') locale = 'it'
    else if (geo === 'PL') locale = 'pl'
    else if (geo === 'UA') locale = 'uk'
    else if (geo === 'RO' || geo === 'MD') locale = 'ro'
    else if (geo === 'NL') locale = 'nl'
    else {
      // 2. Fallback to Accept-Language check
      const acceptLanguage = request.headers.get('accept-language') || ''
      if (acceptLanguage.includes('es')) locale = 'es'
      else if (acceptLanguage.includes('fr')) locale = 'fr'
      else if (acceptLanguage.includes('zh')) locale = 'zh'
      else if (acceptLanguage.includes('ru')) locale = 'ru'
      else if (acceptLanguage.includes('de')) locale = 'de'
      else if (acceptLanguage.includes('it')) locale = 'it'
      else if (acceptLanguage.includes('pl')) locale = 'pl'
      else if (acceptLanguage.includes('uk')) locale = 'uk'
      else if (acceptLanguage.includes('ro')) locale = 'ro'
      else if (acceptLanguage.includes('nl')) locale = 'nl'
      else locale = 'en' // Default to English for US/Others
    }

    // Create response to set cookie immediately
    response.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 31536000 })
    // Debug cookie to see what happened (remove in prod if needed, but helpful now)
    response.cookies.set('DEBUG_LOCALE_SOURCE', `geo:${country},lang:${locale}`, { path: '/', maxAge: 60 })
  }

  // 2. Refresh session logic
  // We need to inject the header so Server Components can read it immediately
  // Ensure locale has a value (fallback to 'es' if somehow still undefined)
  const finalLocale = locale || 'es'
  request.headers.set('x-next-locale', finalLocale)

  const sessionResponse = await updateSession(request)

  // If we detected a locale and updateSession didn't already have it (it created a fresh response)
  // we copy the cookie over if we just decided to set it.
  if (!request.cookies.get('NEXT_LOCALE')?.value) {
    sessionResponse.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 31536000 })

    // Also ensure the response carries the header if needed (though SCs read from request)
    // sessionResponse.headers.set('x-next-locale', locale) 
    return sessionResponse
  }

  response = sessionResponse

  // 3. Admin routes - require auth + admin status
  if (pathname.startsWith('/admin')) {
    // Check authentication first
    const authResult = await withAuth(request)
    if (authResult) return authResult

    // Check admin status (using JWT claims - no DB query!)
    const adminResult = await withAdmin(request)
    if (adminResult) return adminResult

    return response
  }

  // 4. Dashboard routes - require auth only
  if (pathname.startsWith('/dashboard')) {
    const authResult = await withAuth(request)
    if (authResult) return authResult

    return response
  }

  // 5. Root redirect for authenticated users
  if (pathname === '/') {
    const { user } = await getUser(request)
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

// Helper to get user without creating another client
// Helper to get user without creating another client
async function getUser(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() { },
        remove() { },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  return { user }
}

export const config = {
  // Apply to all routes except static files and API routes (handled separately)
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}


