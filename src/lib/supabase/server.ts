import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

/** Request-scoped client that reads the caller's session. Subject to RLS. */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The middleware refreshes the session, so this is safe to ignore.
          }
        },
      },
    },
  )
}

/**
 * The signed-in user, from a JWT whose signature is checked locally against
 * the project's published ES256 key. Unlike getUser() this needs no round trip
 * to the auth server — which sits in Frankfurt while we run in Iowa, so each
 * call used to cost a transatlantic hop. Never use getSession() instead: its
 * cookie is not verified at all.
 *
 * Wrapped in cache() so a layout and page rendering the same request share one
 * verification.
 */
export const getUser = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) return null
  return { id: claims.sub, email: (claims.email as string | undefined) ?? undefined }
})
