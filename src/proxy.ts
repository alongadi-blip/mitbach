import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Reachable without a session. Everything else redirects to /login.
 *
 * /api/join has to be here: it is how an account comes into existence, so by
 * definition its callers have no session yet. It does its own rate limiting
 * and only ever acts on a valid, unredeemed invitation code.
 */
const PUBLIC_PATHS = [
  '/login',
  '/join',
  '/forgot-password',
  '/auth',
  '/api/auth',
  '/api/join',
  // Metadata the OS fetches without a session when adding to the home screen.
  // Redirecting these to /login is why the shortcut had no name or icon.
  '/manifest.webmanifest',
  '/icon',
  '/apple-icon',
]

/**
 * The address the app had before it moved to europe-west4. That backend still
 * runs this same code and forwards every request to NEXT_PUBLIC_SITE_URL, path
 * and query intact, so invitation links already handed out keep working.
 */
const LEGACY_HOST = 'mitbach--mitbach-il.us-central1.hosted.app'

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? ''
  const site = process.env.NEXT_PUBLIC_SITE_URL
  if (host === LEGACY_HOST && site) {
    return NextResponse.redirect(new URL(request.nextUrl.pathname + request.nextUrl.search, site), 308)
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // Refreshes an expiring token and writes the rotated cookies onto `response`.
  // Do not put anything between createServerClient and this call.
  // getClaims verifies the JWT locally against the project's ES256 key, so a
  // request with a fresh token never waits on the auth server across the ocean.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims?.sub ? data.claims : null

  const { pathname } = request.nextUrl

  if (!user && !isPublic(pathname)) {
    // An API caller wants a status code, not a login page — a redirect here
    // turns a clean 401 into an HTML body that fails to parse as JSON.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'לא מחוברים' }, { status: 401 })
    }

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // So the user lands back where they were aiming after signing in.
    if (pathname !== '/') url.searchParams.set('next', pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }

  // /join stays reachable while signed in: an existing member follows the
  // same link to accept an invitation into another group.
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    // Everything except Next internals and static assets.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)',
  ],
}
