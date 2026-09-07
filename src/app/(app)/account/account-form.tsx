'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SignOutButton } from '@/components/sign-out-button'
import { createClient } from '@/lib/supabase/client'

export function AccountForm({
  email,
  name: initialName,
  focusPassword,
}: {
  email: string
  name: string
  focusPassword: boolean
}) {
  const router = useRouter()

  const [name, setName] = useState(initialName)
  const [nameState, setNameState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [nameError, setNameError] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passwordState, setPasswordState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [passwordError, setPasswordError] = useState<string | null>(null)

  async function saveName(event: React.FormEvent) {
    event.preventDefault()
    setNameState('saving')
    setNameError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setNameError('פג תוקף החיבור. התחברו מחדש.')
      setNameState('idle')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ name: name.trim() })
      .eq('id', user.id)

    if (error) {
      setNameError('השמירה נכשלה.')
      setNameState('idle')
      return
    }

    // Keep the auth metadata in step, since the signup trigger seeds the
    // profile name from it.
    await supabase.auth.updateUser({ data: { name: name.trim() } })

    setNameState('saved')
    router.refresh()
    setTimeout(() => setNameState('idle'), 2500)
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault()
    setPasswordError(null)

    if (password.length < 8) return setPasswordError('הסיסמה חייבת להכיל לפחות 8 תווים.')
    if (password !== confirm) return setPasswordError('שתי הסיסמאות אינן זהות.')

    setPasswordState('saving')
    const { error } = await createClient().auth.updateUser({ password })

    if (error) {
      setPasswordError(
        /same/i.test(error.message)
          ? 'הסיסמה החדשה זהה לקודמת.'
          : 'שינוי הסיסמה נכשל. נסו שוב.',
      )
      setPasswordState('idle')
      return
    }

    setPassword('')
    setConfirm('')
    setPasswordState('saved')
    setTimeout(() => setPasswordState('idle'), 2500)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">פרטים</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={saveName} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" dir="ltr" className="field-ltr" value={email} readOnly disabled />
              <p className="text-xs text-muted-foreground">
                כתובת האימייל קבועה. לשינוי, פנו למנהל.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">שם התצוגה</Label>
              <Input
                id="name"
                required
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                כך אתם מופיעים לחברי הקבוצה, ובשיוך מנות בתפריטים.
              </p>
            </div>

            {nameError ? (
              <p role="alert" className="text-sm font-medium text-destructive">
                {nameError}
              </p>
            ) : null}

            <Button
              type="submit"
              className="cursor-pointer"
              disabled={nameState === 'saving' || !name.trim() || name.trim() === initialName}
            >
              {nameState === 'saving' ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {nameState === 'saved' ? <Check aria-hidden /> : null}
              {nameState === 'saved' ? 'נשמר' : 'שמירת השם'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">סיסמה</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={savePassword} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה חדשה</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                dir="ltr"
                className="field-ltr"
                required
                minLength={8}
                autoFocus={focusPassword}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby="password-hint"
              />
              <p id="password-hint" className="text-xs text-muted-foreground">
                לפחות 8 תווים.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">שוב, לוודא</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                dir="ltr"
                className="field-ltr"
                required
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </div>

            {passwordError ? (
              <p role="alert" className="text-sm font-medium text-destructive">
                {passwordError}
              </p>
            ) : null}

            <Button
              type="submit"
              className="cursor-pointer"
              disabled={passwordState === 'saving' || !password || !confirm}
            >
              {passwordState === 'saving' ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {passwordState === 'saved' ? <Check aria-hidden /> : null}
              {passwordState === 'saved' ? 'הסיסמה עודכנה' : 'עדכון סיסמה'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">יציאה</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            תתנתקו מהמכשיר הזה. המתכונים והתפריטים נשארים במקומם, וכניסה חוזרת מחזירה הכול.
          </p>
          <SignOutButton className="w-full cursor-pointer sm:w-auto" />
        </CardContent>
      </Card>
    </div>
  )
}
