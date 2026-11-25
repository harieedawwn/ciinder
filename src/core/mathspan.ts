// Math spans ($…$, $$…$$) are atomic for the parser: delimiters like {{ [[ :: inside them are never split.

const SPAN = /\$\$([\s\S]*?)\$\$|\$([^$]*)\$/g

/** Same-length copy of `text` with math spans (and escaped `\$`) replaced by U+0001, so indices map 1:1. */
export function maskMath(text: string): string {
  const noEsc = text.replace(/\\\$/g, '\u0001\u0001')
  return noEsc.replace(SPAN, (m) => '\u0001'.repeat(m.length))
}

/** Spans of `open…close` found outside math; `inner` is the text between the delimiters. */
export function delimited(text: string, open: string, close: string): { index: number; end: number; inner: string }[] {
  const masked = maskMath(text)
  const out: { index: number; end: number; inner: string }[] = []
  let from = 0
  for (;;) {
    const a = masked.indexOf(open, from)
    if (a < 0) break
    const b = masked.indexOf(close, a + open.length)
    if (b < 0) break
    out.push({ index: a, end: b + close.length, inner: text.slice(a + open.length, b) })
    from = b + close.length
  }
  return out
}

/** Best-effort check of `$` pairing and `{}` balance inside math. */
export function mathBalanced(text: string): boolean {
  const s = text.replace(/\\[$\\{}]/g, '')
  if ((s.match(/\$/g) ?? []).length % 2) return false
  for (const m of s.matchAll(SPAN)) {
    let depth = 0
    for (const c of m[1] ?? m[2]) {
      if (c === '{') depth++
      else if (c === '}' && --depth < 0) return false
    }
    if (depth) return false
  }
  return true
}
