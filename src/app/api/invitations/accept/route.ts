import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { normalizeInviteCode } from '@/lib/invites'
import { INVALID_INVITE } from '@/lib/invitations-server'

const bodySchema = z.object({ code: z.string().min(6) })

/**
 * POST /api/invitations/accept — redeem a code as someone who already has an
 * account.
 *
 * /api/join creates accounts, so it is useless to a person who is already
 * signed in: account creation fails on the duplicate address and they can
 * never be added to the group. This is the other half of that flow, and it is
 * the only way an existing member joins a second group.
 *
 * Runs under the service role because the invitation row belongs to whoever
 * issued it, not to the person redeeming it.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'לא מחוברים' }, { status: 401 })

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: INVALID_INVITE }, { status: 400 })

  const code = normalizeInviteCode(parsed.data.code)
  const admin = createAdminClient()

  const { data: invitation } = await admin
    .from('invitations')
    .select('id, group_id, role, email, status, expires_at')
    .eq('code', code)
    .maybeSingle()

  if (!invitation || invitation.status !== 'pending' || new Date(invitation.expires_at) <= new Date()) {
    return NextResponse.json({ error: INVALID_INVITE }, { status: 400 })
  }

  if (invitation.email && invitation.email.toLowerCase() !== (user.email ?? '').toLowerCase()) {
    return NextResponse.json(
      { error: `ההזמנה הזו הונפקה עבור ${invitation.email}.` },
      { status: 403 },
    )
  }

  if (!invitation.group_id) {
    return NextResponse.json(
      { error: 'ההזמנה הזו נותנת גישה למערכת בלבד, ואתם כבר בפנים. בקשו הזמנה לקבוצה.' },
      { status: 400 },
    )
  }

  // Already a member: consume the code so it stops floating around, and treat
  // it as success — the person ends up where they wanted either way.
  const { data: existing } = await admin
    .from('group_members')
    .select('role')
    .eq('group_id', invitation.group_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    const { error: joinError } = await admin
      .from('group_members')
      .insert({ group_id: invitation.group_id, user_id: user.id, role: invitation.role })

    if (joinError) {
      return NextResponse.json({ error: 'ההצטרפות לקבוצה נכשלה.' }, { status: 500 })
    }
  }

  await admin
    .from('invitations')
    .update({ status: 'used', used_by: user.id, used_at: new Date().toISOString() })
    .eq('id', invitation.id)
    .eq('status', 'pending')

  const { data: group } = await admin
    .from('groups')
    .select('name')
    .eq('id', invitation.group_id)
    .maybeSingle()

  return NextResponse.json({
    ok: true,
    groupId: invitation.group_id,
    groupName: group?.name ?? null,
    alreadyMember: Boolean(existing),
  })
}
