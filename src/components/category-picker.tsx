'use client'

import { Check } from 'lucide-react'

import { RECIPE_CATEGORIES } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Toggle chips rather than a select: the list is short and fixed, and a recipe
 * usually carries two — one for what it is made of, one for what it is for.
 */
export function CategoryPicker({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (next: string[]) => void
}) {
  function toggle(category: string) {
    onChange(
      selected.includes(category)
        ? selected.filter((c) => c !== category)
        : [...selected, category],
    )
  }

  return (
    <div role="group" aria-label="קטגוריות" className="flex flex-wrap gap-2">
      {RECIPE_CATEGORIES.map((category) => {
        const active = selected.includes(category)

        return (
          <button
            key={category}
            type="button"
            onClick={() => toggle(category)}
            aria-pressed={active}
            className={cn(
              'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors duration-200 md:min-h-9',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            {active ? <Check className="size-3.5" aria-hidden /> : null}
            {category}
          </button>
        )
      })}
    </div>
  )
}
