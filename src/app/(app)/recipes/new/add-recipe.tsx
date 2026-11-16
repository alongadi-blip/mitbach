'use client'

import { useRef, useState } from 'react'
import {
  AlertTriangle,
  ImagePlus,
  Info,
  Link2,
  Loader2,
  PenLine,
  Sparkles,
  Type,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { RecipeForm } from '@/components/recipe-form'
import { draftFromExtraction, EMPTY_DRAFT, type RecipeDraft } from '@/lib/recipe-draft'
import type { ExtractionMethod, ExtractionResult } from '@/lib/types'
import type { MyGroup } from '@/lib/queries'

const METHOD_NOTE: Record<ExtractionMethod, string | null> = {
  'json-ld': 'המתכון נקרא ישירות מהנתונים המובנים של האתר — בדרך כלל מדויק.',
  microdata: 'המתכון נקרא מהתגיות המובנות של האתר — בדרך כלל מדויק.',
  llm: 'המתכון חולץ על ידי Claude. כדאי לעבור על המצרכים לפני השמירה.',
  opengraph: null,
  empty: null,
}

const MAX_SHOTS = 8
// Phone screenshots are tall and narrow. Capping the width keeps caption text
// readable while each image stays a few hundred KB.
const MAX_WIDTH = 1100
const MAX_HEIGHT = 2600

type Shot = { id: string; preview: string; data: string }

/** Social sites hide the caption behind a login, so screenshots are the way in. */
const isSocialUrl = (value: string) =>
  /(^|\/\/|\.)(instagram\.com|facebook\.com|fb\.watch|tiktok\.com)/i.test(value)

async function downscale(file: File): Promise<Shot> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_WIDTH / bitmap.width, MAX_HEIGHT / bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')
  ctx.fillStyle = '#fff' // transparent PNGs would turn black as JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const preview = canvas.toDataURL('image/jpeg', 0.85)
  return { id: crypto.randomUUID(), preview, data: preview.slice(preview.indexOf(',') + 1) }
}

export function AddRecipe({ groups }: { groups: MyGroup[] }) {
  const [tab, setTab] = useState('link')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [shots, setShots] = useState<Shot[]>([])
  const [reading, setReading] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [draft, setDraft] = useState<RecipeDraft | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  async function addFiles(files: FileList | File[]) {
    const images = Array.from(files).filter((file) => file.type.startsWith('image/'))
    if (!images.length) return

    const room = MAX_SHOTS - shots.length
    if (room <= 0) {
      setError(`אפשר לצרף עד ${MAX_SHOTS} צילומי מסך`)
      return
    }

    setReading(true)
    setError(null)
    try {
      const added = await Promise.all(images.slice(0, room).map(downscale))
      setShots((current) => [...current, ...added].slice(0, MAX_SHOTS))
      if (images.length > room) setError(`צורפו רק ${room} — אפשר עד ${MAX_SHOTS} צילומי מסך`)
    } catch {
      setError('לא הצלחנו לקרוא את אחת התמונות. נסו תמונה אחרת.')
    } finally {
      setReading(false)
    }
  }

  async function extract(
    body: { url: string } | { text: string } | { images: { data: string; mediaType: string }[]; url?: string },
  ) {
    setPending(true)
    setError(null)

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setError(data?.error ?? 'החילוץ נכשל.')
        return
      }

      setResult(data as ExtractionResult)
      setDraft(draftFromExtraction((data as ExtractionResult).recipe))
    } catch {
      setError('החילוץ נכשל. בדקו את החיבור ונסו שוב.')
    } finally {
      setPending(false)
    }
  }

  function extractShots() {
    void extract({
      images: shots.map((shot) => ({ data: shot.data, mediaType: 'image/jpeg' })),
      ...(url.trim() ? { url: url.trim() } : {}),
    })
  }

  if (draft) {
    const note = result ? METHOD_NOTE[result.method] : null

    return (
      <div className="space-y-6">
        {result?.warning ? (
          <Notice tone="warning" icon={AlertTriangle} text={result.warning} />
        ) : note ? (
          <Notice tone="info" icon={result?.method === 'llm' ? Sparkles : Info} text={note} />
        ) : null}

        <RecipeForm initial={draft} groups={groups} />

        <Button
          type="button"
          variant="ghost"
          className="cursor-pointer text-muted-foreground"
          onClick={() => {
            setDraft(null)
            setResult(null)
          }}
        >
          חזרה לבחירת מקור
        </Button>
      </div>
    )
  }

  const social = isSocialUrl(url)

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        setTab(value)
        setError(null)
      }}
      className="space-y-5"
    >
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="link" className="cursor-pointer gap-1.5">
          <Link2 className="hidden size-4 sm:block" aria-hidden />
          קישור
        </TabsTrigger>
        <TabsTrigger value="shots" className="cursor-pointer gap-1.5">
          <ImagePlus className="hidden size-4 sm:block" aria-hidden />
          צילומי מסך
        </TabsTrigger>
        <TabsTrigger value="text" className="cursor-pointer gap-1.5">
          <Type className="hidden size-4 sm:block" aria-hidden />
          טקסט חופשי
        </TabsTrigger>
        <TabsTrigger value="manual" className="cursor-pointer gap-1.5">
          <PenLine className="hidden size-4 sm:block" aria-hidden />
          ידני
        </TabsTrigger>
      </TabsList>

      <TabsContent value="link" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url">קישור למתכון</Label>
          <Input
            id="url"
            dir="ltr"
            className="field-ltr h-12"
            inputMode="url"
            placeholder="https://…"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && url.trim()) {
                event.preventDefault()
                void extract({ url: url.trim() })
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            אתרי מתכונים נקראים במלואם. באינסטגרם, פייסבוק וטיקטוק הכיתוב חסום — שם עדיף
            להעלות צילומי מסך.
          </p>
        </div>

        {social ? (
          <div className="flex flex-col gap-3 rounded-xl border border-accent/50 bg-accent/10 p-3.5 text-sm">
            <p className="text-pretty">
              זה קישור מרשת חברתית, שלא נותנת לקרוא את הכיתוב. צלמו מסך של הכיתוב והעלו אותו —
              הקישור יישמר כמקור ותמונת הפוסט תיכנס למתכון.
            </p>
            <Button type="button" className="cursor-pointer self-start" onClick={() => setTab('shots')}>
              <ImagePlus aria-hidden />
              מעבר לצילומי מסך
            </Button>
          </div>
        ) : null}

        <Button
          type="button"
          size="lg"
          variant={social ? 'outline' : 'default'}
          className="w-full cursor-pointer"
          disabled={pending || !url.trim()}
          onClick={() => void extract({ url: url.trim() })}
        >
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {pending ? 'קוראים את העמוד…' : 'חילוץ המתכון'}
        </Button>
      </TabsContent>

      <TabsContent value="shots" className="space-y-4">
        <div className="space-y-2">
          <Label>צילומי מסך של הפוסט</Label>
          <p className="text-xs text-muted-foreground">
            צלמו את הכיתוב המלא (לחצו &quot;עוד&quot; בפוסט), גם אם זה כמה צילומים. אפשר עד{' '}
            {MAX_SHOTS}, לפי הסדר.
          </p>

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              if (event.target.files) void addFiles(event.target.files)
              event.target.value = ''
            }}
          />

          <div
            className="grid grid-cols-3 gap-2 sm:grid-cols-4"
            onPaste={(event) => void addFiles(event.clipboardData.files)}
          >
            {shots.map((shot, index) => (
              <div
                key={shot.id}
                className="relative aspect-[9/16] overflow-hidden rounded-lg border border-border bg-secondary/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
                <img src={shot.preview} alt={`צילום מסך ${index + 1}`} className="size-full object-cover object-top" />
                <span className="absolute bottom-1 start-1 rounded-md bg-background/85 px-1.5 text-xs font-semibold">
                  {index + 1}
                </span>
                <button
                  type="button"
                  aria-label={`הסרת צילום ${index + 1}`}
                  className="absolute end-1 top-1 flex size-7 cursor-pointer items-center justify-center rounded-full bg-background/85 text-foreground hover:bg-destructive hover:text-white"
                  onClick={() => setShots((current) => current.filter((s) => s.id !== shot.id))}
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            ))}

            {shots.length < MAX_SHOTS ? (
              <button
                type="button"
                className="flex aspect-[9/16] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                disabled={reading}
                onClick={() => fileInput.current?.click()}
              >
                {reading ? <Loader2 className="size-6 animate-spin" aria-hidden /> : <ImagePlus className="size-6" aria-hidden />}
                {shots.length ? 'עוד צילום' : 'בחירת צילומים'}
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="shots-url">קישור לפוסט (רשות)</Label>
          <Input
            id="shots-url"
            dir="ltr"
            className="field-ltr h-12"
            inputMode="url"
            placeholder="https://www.instagram.com/reel/…"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            הקישור נשמר כמקור, ומשם נלקחת תמונת הפוסט.
          </p>
        </div>

        <Button
          type="button"
          size="lg"
          className="w-full cursor-pointer"
          disabled={pending || reading || !shots.length}
          onClick={extractShots}
        >
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
          {pending ? 'קוראים את הצילומים…' : 'חילוץ המתכון מהצילומים'}
        </Button>
      </TabsContent>

      <TabsContent value="text" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="text">הדביקו את המתכון</Label>
          <Textarea
            id="text"
            rows={10}
            placeholder={'עוגת שוקולד\n\n200 גרם שוקולד מריר\n3 ביצים\n…'}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </div>

        <Button
          type="button"
          size="lg"
          className="w-full cursor-pointer"
          disabled={pending || text.trim().length < 40}
          onClick={() => void extract({ text: text.trim() })}
        >
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {pending ? 'מפענחים…' : 'חילוץ המתכון'}
        </Button>
      </TabsContent>

      <TabsContent value="manual" className="space-y-4">
        <p className="text-sm text-muted-foreground">
          נתחיל מדף ריק, ותמלאו הכול בעצמכם.
        </p>
        <Button
          type="button"
          size="lg"
          className="w-full cursor-pointer"
          onClick={() => setDraft(EMPTY_DRAFT)}
        >
          פתיחת טופס ריק
        </Button>
      </TabsContent>

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </Tabs>
  )
}

function Notice({
  tone,
  icon: Icon,
  text,
}: {
  tone: 'info' | 'warning'
  icon: typeof Info
  text: string
}) {
  return (
    <div
      className={
        tone === 'warning'
          ? 'flex gap-2.5 rounded-xl border border-accent/50 bg-accent/10 p-3.5 text-sm'
          : 'flex gap-2.5 rounded-xl border border-border bg-secondary/60 p-3.5 text-sm'
      }
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <p className="text-pretty">{text}</p>
    </div>
  )
}
