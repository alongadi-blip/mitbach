'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Loader2, MailCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/confirm`,
    })

    // Deliberately not reporting whether the address has an account: that
    // would turn this form into a way to find out who is a member.
    if (resetError && /rate|limit|seconds/i.test(resetError.message)) {
      setError('נשלחו יותר מדי בקשות. המתינו דקה ונסו שוב.')
      setPending(false)
      return
    }

    setSent(true)
    setPending(false)
  }

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailCheck className="size-5 text-primary" aria-hidden />
            בדקו את הדואר
          </CardTitle>
          <CardDescription>
            אם קיים חשבון עבור <span dir="ltr">{email}</span>, נשלח אליו קישור לבחירת סיסמה חדשה.
            הקישור תקף לשעה אחת ולשימוש יחיד.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            לא הגיע כלום? בדקו בספאם. אם גם שם ריק — בקשו ממנהל הקבוצה לאפס לכם את הסיסמה.
          </p>

          <Button
            variant="outline"
            className="w-full cursor-pointer"
            render={<Link href="/login" />}
          >
            חזרה לכניסה
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>שכחתם סיסמה?</CardTitle>
        <CardDescription>
          הזינו את האימייל שאיתו נרשמתם, ונשלח קישור לבחירת סיסמה חדשה.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              dir="ltr"
              className="field-ltr"
              required
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full cursor-pointer" disabled={pending || !email.trim()}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {pending ? 'שולחים…' : 'שליחת קישור'}
          </Button>
        </form>
      </CardContent>

      <CardContent className="pt-0">
        <p className="text-center text-sm text-muted-foreground">
          נזכרתם?{' '}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            חזרה לכניסה
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
