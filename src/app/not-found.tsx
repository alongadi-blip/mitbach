import Link from 'next/link'

import { Brand } from '@/components/brand'
import { Button } from '@/components/ui/button'

/**
 * Also what a viewer sees when they open a link to something not shared with
 * them: row level security makes an invisible row indistinguishable from a
 * missing one, which is the behaviour we want — the wording covers both.
 */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <Brand size="lg" />

      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">הדף הזה לא נמצא</h1>
        <p className="max-w-sm text-pretty text-muted-foreground">
          ייתכן שהוא נמחק, או שהוא שייך לקבוצה שאינכם חברים בה.
        </p>
      </div>

      <Button render={<Link href="/" />} size="lg" className="cursor-pointer">
        חזרה למתכונים
      </Button>
    </main>
  )
}
