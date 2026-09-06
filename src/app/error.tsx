'use client'

import { useEffect } from 'react'
import { RotateCcw } from 'lucide-react'

import { Brand } from '@/components/brand'
import { Button } from '@/components/ui/button'

/**
 * Without this, an unhandled error shows Next's own screen — in English, and
 * with no way back. `digest` is the server-side id, worth showing so a report
 * can be matched to a log line.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[mitbach] unhandled error', error)
  }, [error])

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <Brand size="lg" />

      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">משהו השתבש</h1>
        <p className="max-w-sm text-pretty text-muted-foreground">
          התקלה נרשמה. אפשר לנסות שוב — לרוב זה פותר את זה.
        </p>
      </div>

      <Button onClick={reset} size="lg" className="cursor-pointer">
        <RotateCcw data-icon="inline-start" aria-hidden />
        ניסיון נוסף
      </Button>

      {error.digest ? (
        <p className="text-xs text-muted-foreground">
          מזהה התקלה: <code dir="ltr">{error.digest}</code>
        </p>
      ) : null}
    </main>
  )
}
