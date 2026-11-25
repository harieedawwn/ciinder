// KaTeX + mhchem, loaded only when content has `$`. Errors never throw: the source text is shown instead.
import katex from 'katex'
import 'katex/contrib/mhchem'
import 'katex/dist/katex.min.css'
import { mathSource, type MathSpan } from './tokens'

const cache = new Map<string, string>()

export function tex(m: MathSpan): string {
  const key = `${+m.display}${m.src}`
  let out = cache.get(key)
  if (out === undefined) {
    try {
      out = katex.renderToString(m.src, { displayMode: m.display, throwOnError: true, strict: 'ignore', trust: false, maxExpand: 500 })
    } catch {
      out = mathSource(m, 'math-src math-err')
    }
    if (cache.size > 2000) cache.clear()
    cache.set(key, out)
  }
  return out
}
