// Decodes HTML entities that were stored verbatim in recipe text.
//
// Recipes saved before the extractor learned to decode them can hold literal
// `&#39;` where an apostrophe belongs, because a <script> element is raw text
// by the HTML spec and its ld+json contents are never entity-decoded by the
// parser — while plenty of sites encode them there regardless.
//
//   node --env-file=.env.local scripts/repair-entities.mjs          (dry run)
//   node --env-file=.env.local scripts/repair-entities.mjs --write
//
// Idempotent: text with no entities is left exactly as it is.

import { createClient } from '@supabase/supabase-js'
import { decodeHTML } from 'entities'

const write = process.argv.includes('--write')

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const hasEntity = (value) => typeof value === 'string' && /&(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);/.test(value)

/** Walks strings inside objects and arrays, decoding in place. */
function decodeDeep(value) {
  if (typeof value === 'string') return decodeHTML(value)
  if (Array.isArray(value)) return value.map(decodeDeep)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, decodeDeep(v)]))
  }
  return value
}

const TARGETS = [
  { table: 'recipes', fields: ['title', 'description', 'servings', 'notes', 'ingredients', 'instructions', 'tags'] },
  { table: 'menus', fields: ['title', 'notes'] },
  { table: 'menu_items', fields: ['title', 'notes', 'category', 'assigned_name'] },
]

let touched = 0

for (const { table, fields } of TARGETS) {
  const { data, error } = await admin.from(table).select(['id', ...fields].join(', '))
  if (error) {
    console.error(`could not read ${table}: ${error.message}`)
    continue
  }

  for (const row of data ?? []) {
    const patch = {}

    for (const field of fields) {
      const original = row[field]
      if (!JSON.stringify(original ?? null).match(/&(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);/)) continue
      patch[field] = decodeDeep(original)
    }

    if (Object.keys(patch).length === 0) continue
    touched++

    const preview = Object.keys(patch).join(', ')
    console.log(`${table}/${row.id.slice(0, 8)} → ${preview}`)

    if (write) {
      const { error: updateError } = await admin.from(table).update(patch).eq('id', row.id)
      if (updateError) console.error(`  update failed: ${updateError.message}`)
    }
  }
}

console.log(
  touched === 0
    ? '\nnothing to repair'
    : `\n${touched} row(s) ${write ? 'repaired' : 'would be repaired — rerun with --write'}`,
)
