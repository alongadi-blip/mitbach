'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

/**
 * Clears the session on both sides: the browser client drops its in-memory
 * copy, and the route handler clears the cookies the server reads. Doing only
 * one of the two leaves the other still believing someone is signed in.
 */
export function SignOutButton({
  variant = 'outline',
  className,
}: {
  variant?: 'outline' | 'destructive' | 'ghost'
  className?: string
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function signOut() {
    setPending(true)

    await createClient().auth.signOut()
    await fetch('/auth/signout', { method: 'POST', redirect: 'manual' }).catch(() => {})

    router.refresh()
    router.push('/login')
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={signOut}
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="animate-spin" aria-hidden />
      ) : (
        <LogOut data-icon="inline-start" aria-hidden />
      )}
      {pending ? 'יוצאים…' : 'יציאה מהחשבון'}
    </Button>
  )
}
