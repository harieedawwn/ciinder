// Loader + entry point for rendering content. Markdown and math chunks load lazily; until then text is shown plain.
import type { MdOptions, Tex } from './markdown'
import { hasMath, plainHtml } from './tokens'

type ToHtml = (src: string, opts: MdOptions, tex: Tex | null) => string

const ready = $state({ md: false, tex: false })
let md: ToHtml | null = null
let tex: Tex | null = null
let mdLoad: Promise<void> | null = null
let texLoad: Promise<void> | null = null

/** Loads the markdown chunk, plus KaTeX when `math`. Safe to call often; never rejects. */
export function loadRender(math = false): Promise<void> {
  mdLoad ??= import('./markdown').then((m) => {
    md = m.toHtml
    ready.md = true
  })
  if (math)
    texLoad ??= import('./math').then((m) => {
      tex = m.tex
      ready.tex = true
    })
  return Promise.all([mdLoad, math ? texLoad : null]).then(
    () => undefined,
    () => undefined,
  )
}

/** Sanitized HTML for content; reactive to chunk loading when read inside $derived. */
export function toHtml(src: string, opts: MdOptions = {}): string {
  const math = hasMath(src)
  if (!ready.md || (math && !ready.tex)) void loadRender(math)
  if (!ready.md || !md) return plainHtml(src)
  return md(src, opts, math && ready.tex ? tex : null)
}

export { hasMath }
