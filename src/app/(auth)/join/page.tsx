import type { Metadata } from 'next'

import { AcceptInvite } from './accept-invite'
import { JoinForm } from './join-form'
import { checkInvitationCode, type InviteCheck } from '@/lib/invitations-server'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'הצטרפות · מטבח' }

export default async function JoinPage({ searchParams }: PageProps<'/join'>) {
  const params = await searchParams
  const code = typeof params.code === 'string' ? params.code : ''

  // Resolved here rather than in the browser, so a link that already carries
  // the code shows the group name in the first paint.
  let initialCheck: InviteCheck | null = null
  if (code.trim().length >= 6) {
    initialCheck = await checkInvitationCode(code).catch(() => null)
  }

  // Someone already signed in cannot create an account with their own address,
  // so the same link has to mean "add me to this group" instead.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return (
      <AcceptInvite
        initialCode={code}
        initialCheck={initialCheck}
        currentEmail={user.email ?? ''}
      />
    )
  }

  return <JoinForm initialCode={code} initialCheck={initialCheck} />
}
