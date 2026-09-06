import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

/**
 * Where the password-reset email lands.
 *
 * Supabase sends the recipient here with a one-time `code`; exchanging it
 * establishes a session, which is what lets the next screen call updateUser.
 * The code is single use and short-lived, so a forwarded link is worth little.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const next = request.nextUrl.searchParams.get('next') ?? '/account?reset=1'

  const failed = new URL('/login', request.nextUrl.origin)
  failed.searchParams.set('error', 'reset-link')

  if (!code) return NextResponse.redirect(failed)

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) return NextResponse.redirect(failed)

  // Only same-site paths, so a crafted link cannot bounce the freshly signed-in
  // user off to somewhere else.
  const target = next.startsWith('/') && !next.startsWith('//') ? next : '/account?reset=1'
  return NextResponse.redirect(new URL(target, request.nextUrl.origin))
}
