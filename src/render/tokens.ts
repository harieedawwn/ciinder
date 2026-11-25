// Pure pre/post steps around markdown: math spans become private-use tokens so marked never touches them,
// essay keywords become <mark> tags (or plain text). No DOM here, so it is unit-tested.

const MATH = /\\\$|\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g
const KW = /\[\[([\s\S]+?)\]\]/g
const TOKEN = /(\d+)/g

export interface MathSpan {
  src: string
  display: boolean
}

/** Replaces `$…$` / `$$…$$` with tokens (escaped `\$` kept). */
export function extractMath(text: string): { text: string; math: MathSpan[] } {
  const math: MathSpan[] = []
  const out = text.replace(MATH, (m, block?: string, inline?: string) => {
    if (m === '\\$') return m
    math.push({ src: (block ?? inline ?? '').trim(), display: block !== undefined })
    return `${math.length - 1}`
  })
  return { text: out, math }
}

/** `[[kw]]` → numbered <mark> (essay answers) or its inner text. Run after extractMath. */
export function keywords(text: string, mark: boolean): string {
  let n = 0
  return text.replace(KW, (_, inner: string) => (mark && inner.trim() ? `<mark class="kw" data-k="${n++}">${inner}</mark>` : inner))
}

/** Puts rendered math back in place of its tokens. */
export function restoreMath(html: string, math: MathSpan[], render: (m: MathSpan) => string): string {
  return html.replace(TOKEN, (m, i: string) => (math[+i] ? render(math[+i]) : m))
}

export const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Display of a math span without KaTeX (not loaded yet, or a render error). */
export const mathSource = (m: MathSpan, cls = 'math-src'): string =>
  `<span class="${cls}">${escapeHtml(m.display ? `$$${m.src}$$` : `$${m.src}$`)}</span>`

/** Plain fallback before the markdown chunk has loaded. */
export function plainHtml(text: string): string {
  const { text: t, math } = extractMath(text)
  const html = escapeHtml(keywords(t, false).replace(/\\\$/g, '$')).replace(/\n/g, '<br>')
  return restoreMath(html, math, (m) => mathSource(m))
}

/** True when text has an unescaped `$` (math chunk needed). */
export const hasMath = (text: string): boolean => /(^|[^\\])\$/.test(text)
