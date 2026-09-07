import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

/**
 * Signs out on the server, so the session cookies are cleared by the same
 * code that set them.
 *
 * Doing it only in the browser leaves a window where the client thinks it is
 * signed out while the server still sees a valid cookie — the next navigation
 * then renders as the old user. POST so a prefetch or a stray link cannot log
 * anyone out by accident.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) await supabase.auth.signOut()

  return NextResponse.redirect(new URL('/login', request.nextUrl.origin), {
    status: 303,
  })
}
