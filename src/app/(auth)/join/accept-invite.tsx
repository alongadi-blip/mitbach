'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CheckCircle2, Loader2, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/format'
import type { InviteCheck } from '@/lib/invitations-server'

/**
 * What an already-signed-in visitor sees on an invitation link. Creating an
 * account is not an option for them — the address is taken, by themselves —
 * so the only thing to do is accept.
 */
export function AcceptInvite({
  initialCode,
  initialCheck,
  currentEmail,
}: {
  initialCode: string
  initialCheck: InviteCheck | null
  currentEmail: string
}) {
  const router = useRouter()
  const [code, setCode] = useState(initialCode)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(
    initialCheck && !initialCheck.valid ? initialCheck.error : null,
  )

  const invite = initialCheck?.valid ? initialCheck : null

  async function accept() {
    setPending(true)
    setError(null)

    const response = await fetch('/api/invitations/accept', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      setError(data?.error ?? 'ההצטרפות נכשלה.')
      setPending(false)
      return
    }

    router.refresh()
    router.push(data.groupId ? `/groups/${data.groupId}` : '/')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {invite?.groupName ? `הצטרפות לקבוצה ${invite.groupName}` : 'הזמנה'}
        </CardTitle>
        <CardDescription>
          אתם מחוברים כ-<span dir="ltr">{currentEmail}</span>. אפשר לצרף את החשבון הקיים שלכם
          לקבוצה — אין צורך לפתוח חשבון חדש.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {invite ? (
          <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/50 p-3.5">
            <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="text-sm">
              <p className="font-medium">
                {invite.groupName ?? 'גישה למערכת'} · {ROLE_LABELS[invite.role]}
              </p>
              <p className="text-muted-foreground">{ROLE_DESCRIPTIONS[invite.role]}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="code">קוד הזמנה</Label>
            <Input
              id="code"
              dir="ltr"
              className="field-ltr font-mono tracking-wider"
              placeholder="MTB-XXXX-XXXX"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </div>
        )}

        {error ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        ) : null}

        <Button
          type="button"
          className="w-full cursor-pointer"
          onClick={accept}
          disabled={pending || code.trim().length < 6}
        >
          {pending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <CheckCircle2 data-icon="inline-start" aria-hidden />
          )}
          {pending ? 'מצטרפים…' : 'הצטרפות'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="underline-offset-4 hover:underline">
            חזרה למתכונים
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
