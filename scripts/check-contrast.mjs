// Checks the theme's real colour pairings against WCAG AA (4.5:1).
//
// Reads the tokens straight out of globals.css rather than keeping a copy, so
// it cannot quietly pass after someone edits the palette.
//
//   npm run check:contrast

import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8')

/** Pulls `--name: oklch(L C H);` declarations out of one CSS block. */
function readTokens(blockPattern) {
  const block = css.match(blockPattern)
  if (!block) throw new Error(`could not find the ${blockPattern} block in globals.css`)

  const tokens = {}
  for (const [, name, l, c, h] of block[1].matchAll(
    /--([\w-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/g,
  )) {
    tokens[name] = [Number(l), Number(c), Number(h)]
  }
  return tokens
}

function oklchToLinearSrgb([L, C, hDeg]) {
  const h = (hDeg * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)

  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

function luminance(colour) {
  const [r, g, b] = oklchToLinearSrgb(colour).map((v) => Math.min(1, Math.max(0, v)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function ratio(fg, bg) {
  const a = luminance(fg)
  const b = luminance(bg)
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

// Every pairing the UI actually renders. `accent`/`accent-foreground` is on the
// list because shadcn's menu items use it for their focus state.
const PAIRS = [
  ['foreground', 'background', 'body text on the page'],
  ['foreground', 'card', 'body text on a card'],
  ['muted-foreground', 'background', 'muted text on the page'],
  ['muted-foreground', 'card', 'muted text on a card'],
  ['muted-foreground', 'secondary', 'muted text on a chip'],
  ['primary', 'background', 'links and primary text'],
  ['primary-foreground', 'primary', 'label on a primary button'],
  ['accent-foreground', 'accent', 'label on the gold accent'],
  ['secondary-foreground', 'secondary', 'label on a secondary chip'],
  ['destructive', 'background', 'error text on the page'],
  ['destructive', 'card', 'error text on a card'],
]

const themes = [
  ['light', readTokens(/:root\s*\{([\s\S]*?)\n\}/)],
  ['dark', readTokens(/\.dark\s*\{([\s\S]*?)\n\}/)],
]

let failures = 0

for (const [name, tokens] of themes) {
  console.log(`\n${name}`)
  for (const [fg, bg, label] of PAIRS) {
    if (!tokens[fg] || !tokens[bg]) {
      console.log(`  SKIP           ${label} (token missing)`)
      continue
    }
    const r = ratio(tokens[fg], tokens[bg])
    const ok = r >= 4.5
    if (!ok) failures++
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  ${label}`)
  }
}

console.log(`\n${failures} pairing(s) below WCAG AA (4.5:1)`)
process.exit(failures > 0 ? 1 : 0)
