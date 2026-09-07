// Suggests categories for recipes saved before the field existed.
//
//   node --env-file=.env.local scripts/categorize.mjs          (dry run)
//   node --env-file=.env.local scripts/categorize.mjs --write
//
// Only touches recipes whose categories are still empty, so re-running it
// never overwrites a choice made by hand. Costs roughly an agora per recipe:
// it sends the title and ingredient list, not the whole page.

import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const write = process.argv.includes('--write')

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY is not set')
  process.exit(1)
}

const CATEGORIES = ['בשרי', 'חלבי', 'פרווה', 'דגים', 'סלטים', 'מאפים מלוחים', 'קינוחים']

const Schema = z.object({
  categories: z.array(z.enum(CATEGORIES)),
})

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const client = new Anthropic()

const { data: recipes, error } = await admin
  .from('recipes')
  .select('id, title, ingredients, categories')
  .order('created_at', { ascending: true })

if (error) {
  console.error('could not read recipes:', error.message)
  process.exit(1)
}

const pending = (recipes ?? []).filter((r) => (r.categories ?? []).length === 0)
console.log(`${pending.length} of ${recipes.length} recipe(s) have no categories\n`)

for (const recipe of pending) {
  const ingredients = (recipe.ingredients ?? [])
    .map((i) => [i.quantity, i.unit, i.item].filter(Boolean).join(' '))
    .join('\n')

  let categories = []

  try {
    const response = await client.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 1000,
      system:
        'סווג מתכונים לקטגוריות מתוך רשימה סגורה. בדרך כלל אחת לסוג ' +
        '(בשרי/חלבי/פרווה/דגים) ואחת לתפקיד (סלטים/מאפים מלוחים/קינוחים). ' +
        'הסתמך רק על המצרכים בפועל. כשלא ברור — החזר רשימה ריקה.',
      output_config: { format: zodOutputFormat(Schema), effort: 'low' },
      messages: [
        { role: 'user', content: `שם: ${recipe.title}\n\nמצרכים:\n${ingredients}` },
      ],
    })
    categories = response.parsed_output?.categories ?? []
  } catch (e) {
    console.error(`  ${recipe.title.slice(0, 30)} — failed: ${e.message?.slice(0, 60)}`)
    continue
  }

  console.log(`${recipe.title.slice(0, 40).padEnd(42)} → ${categories.join(', ') || '(none)'}`)

  if (write && categories.length > 0) {
    const { error: updateError } = await admin
      .from('recipes')
      .update({ categories })
      .eq('id', recipe.id)
    if (updateError) console.error(`  update failed: ${updateError.message}`)
  }
}

console.log(write ? '\ndone' : '\ndry run — rerun with --write to save')
