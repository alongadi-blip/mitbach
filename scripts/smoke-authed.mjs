// Fetches authenticated pages the way a signed-in browser would, so that
// server-render failures show up here instead of as a digest in the UI.
//
//   node --env-file=.env.local scripts/smoke-authed.mjs [baseUrl]
//
// Signs in as a throwaway account created for the run and deleted after it.

import { createClient } from '@supabase/supabase-js'

const base = process.argv[2] ?? 'http://localhost:3000'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const email = `smoke-${Date.now()}@example.com`
const password = 'SmokeTest123!'

const { data: created, error: createError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { name: 'בדיקת עשן' },
})
if (createError) {
  console.error('could not create the test account:', createError.message)
  process.exit(1)
}
const uid = created.user.id

const { data: signIn } = await createClient(url, anon).auth.signInWithPassword({ email, password })
const session = signIn.session

// @supabase/ssr reads the session from sb-<ref>-auth-token, base64-prefixed.
const ref = new URL(url).hostname.split('.')[0]
const cookie = `sb-${ref}-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`

// A recipe and a menu owned by the test user, so the detail and edit routes
// have something of their own to render.
const { data: recipe } = await admin
  .from('recipes')
  .insert({
    owner_id: uid,
    is_private: true,
    title: 'מתכון בדיקה',
    ingredients: [{ quantity: '2', unit: 'כוסות', item: 'קמח', note: null }],
    instructions: ['לערבב', 'לאפות'],
    tags: ['בדיקה'],
  })
  .select('id')
  .single()

const { data: group } = await admin
  .from('groups')
  .insert({ name: 'קבוצת עשן', owner_id: uid })
  .select('id')
  .single()

const { data: menu } = await admin
  .from('menus')
  .insert({ created_by: uid, is_private: true, title: 'תפריט בדיקה' })
  .select('id')
  .single()

const routes = [
  ['/', 'catalog'],
  ['/account', 'account'],
  ['/groups', 'groups list'],
  [`/groups/${group.id}`, 'group detail'],
  ['/menus', 'menus list'],
  [`/menus/${menu.id}`, 'menu detail'],
  ['/recipes/new', 'add recipe'],
  [`/recipes/${recipe.id}`, 'recipe detail'],
  [`/recipes/${recipe.id}/edit`, 'recipe edit'],
]

let failures = 0

for (const [path, label] of routes) {
  const response = await fetch(base + path, { headers: { cookie }, redirect: 'manual' })
  const body = response.status === 200 ? await response.text() : ''

  // Next renders the error boundary with a 500; the digest line is the tell.
  const crashed = body.includes('משהו השתבש') || body.includes('digest')
  const ok = response.status === 200 && !crashed

  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${String(response.status).padEnd(3)}  ${label}  ${path}`)
}

await admin.from('groups').delete().eq('owner_id', uid)
await admin.auth.admin.deleteUser(uid)

console.log(`\n${failures} route(s) failed`)
process.exit(failures > 0 ? 1 : 0)
