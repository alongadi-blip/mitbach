import type { Metadata } from 'next'

import { AccountForm } from './account-form'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'החשבון שלי · מטבח' }

export default async function AccountPage({ searchParams }: PageProps<'/account'>) {
  const params = await searchParams
  const fromReset = params.reset === '1'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', user!.id)
    .maybeSingle()

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">
          {fromReset ? 'בחרו סיסמה חדשה' : 'החשבון שלי'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {fromReset
            ? 'הקישור אומת. הסיסמה שתבחרו כאן תיכנס לתוקף מיד.'
            : 'שם התצוגה והסיסמה שלכם.'}
        </p>
      </div>

      <AccountForm
        email={profile?.email ?? user!.email ?? ''}
        name={profile?.name ?? ''}
        focusPassword={fromReset}
      />
    </div>
  )
}
