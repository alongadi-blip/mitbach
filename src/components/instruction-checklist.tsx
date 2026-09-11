'use client'

import { useState } from 'react'
import { Check, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Steps you can tick off while cooking.
 *
 * The step number doubles as the toggle instead of sitting beside a separate
 * checkbox: the number has to be there anyway, and on a phone the row has no
 * width to spare. Like the ingredient list, the state belongs to this cooking
 * session and is deliberately not saved.
 */
export function InstructionChecklist({ instructions }: { instructions: string[] }) {
  const [done, setDone] = useState<Set<number>>(new Set())

  function toggle(index: number) {
    setDone((current) => {
      const next = new Set(current)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <div className="space-y-3">
      <ol className="space-y-1">
        {instructions.map((step, index) => {
          const isDone = done.has(index)

          return (
            <li key={index}>
              <button
                type="button"
                onClick={() => toggle(index)}
                aria-pressed={isDone}
                className="flex w-full cursor-pointer items-start gap-3 rounded-lg px-2 py-2 text-start transition-colors duration-200 hover:bg-secondary/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span
                  className={cn(
                    'mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors duration-200',
                    isDone
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-primary/10 text-primary',
                  )}
                >
                  {isDone ? <Check className="size-4" aria-hidden /> : index + 1}
                </span>

                <span
                  className={cn(
                    'text-pretty leading-relaxed',
                    isDone && 'text-muted-foreground line-through',
                  )}
                >
                  {step}
                </span>

                <span className="sr-only">
                  {isDone ? `בטלו את סימון שלב ${index + 1}` : `סמנו את שלב ${index + 1} כבוצע`}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      {done.size > 0 ? (
        <div className="flex items-center gap-3 ps-2">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            <span className="ltr-nums">
              {done.size}/{instructions.length}
            </span>{' '}
            שלבים בוצעו
          </p>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="cursor-pointer text-muted-foreground"
            onClick={() => setDone(new Set())}
          >
            <RotateCcw data-icon="inline-start" aria-hidden />
            איפוס
          </Button>
        </div>
      ) : null}
    </div>
  )
}
