'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

/**
 * Steps you can tick off while cooking, with the same checkbox as the
 * ingredient list so the two read as one gesture. Like the ingredient list,
 * the state belongs to this cooking session and is deliberately not saved.
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
          const id = `instruction-${index}`

          return (
            <li key={index}>
              <label
                htmlFor={id}
                className={cn(
                  'flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-secondary/60',
                  isDone && 'text-muted-foreground',
                )}
              >
                <Checkbox
                  id={id}
                  checked={isDone}
                  onCheckedChange={() => toggle(index)}
                  className="mt-1.5"
                />

                <span
                  aria-hidden
                  className={cn(
                    'grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors duration-200',
                    isDone ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary',
                  )}
                >
                  {index + 1}
                </span>

                <span className={cn('text-pretty leading-relaxed', isDone && 'line-through')}>
                  {step}
                </span>
              </label>
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
