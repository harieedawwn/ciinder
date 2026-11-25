// KaTeX for the standalone player: loaded from a CDN at run time. Offline (or blocked) the formulas show their
// source instead, like any math error. Replaces src/render/math.ts through vite.player.config.ts.
import { mathSource, type MathSpan } from '../render/tokens'

declare const __KATEX_VERSION__: string
const CDN = `https://cdn.jsdelivr.net/npm/katex@${__KATEX_VERSION__}/dist`

interface KatexLike {
  renderToString(src: string, opts: Record<string, unknown>): string
}

const win = window as unknown as { katex?: KatexLike }

function load(el: HTMLScriptElement | HTMLLinkElement, ms = 6000): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), ms)
    el.onload = () => (clearTimeout(timer), resolve(true))
    el.onerror = () => (clearTimeout(timer), resolve(false))
    document.head.appendChild(el)
  })
}

function script(src: string): HTMLScriptElement {
  const s = document.createElement('script')
  s.src = src
  s.crossOrigin = 'anonymous'
  return s
}

const css = document.createElement('link')
css.rel = 'stylesheet'
css.href = `${CDN}/katex.min.css`
css.crossOrigin = 'anonymous'

if (navigator.onLine !== false && (await load(script(`${CDN}/katex.min.js`)))) {
  void load(css)
  await load(script(`${CDN}/contrib/mhchem.min.js`))
}

const cache = new Map<string, string>()

export function tex(m: MathSpan): string {
  const key = `${+m.display}${m.src}`
  let out = cache.get(key)
  if (out === undefined) {
    try {
      if (!win.katex) throw new Error('katex unavailable')
      out = win.katex.renderToString(m.src, { displayMode: m.display, throwOnError: true, strict: 'ignore', trust: false, maxExpand: 500 })
    } catch {
      out = mathSource(m, 'math-src math-err')
    }
    cache.set(key, out)
  }
  return out
}
