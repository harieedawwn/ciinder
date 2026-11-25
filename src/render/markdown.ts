// Markdown subset → sanitized HTML (lazy chunk: marked + DOMPurify). Content is untrusted (share links, files).
import DOMPurify from 'dompurify'
import { Marked } from 'marked'
import { extractMath, keywords, mathSource, restoreMath, type MathSpan } from './tokens'

export interface MdOptions {
  /** Inline only (options, statements, chips): no paragraphs, lists or tables. */
  inline?: boolean
  /** Keep [[keywords]] as <mark class="kw" data-k> (essay answers). */
  kw?: boolean
}

export type Tex = (m: MathSpan) => string

const md = new Marked({
  gfm: true,
  breaks: true,
  async: false,
  // Subset: no headings (setext "---" belongs to the format) and no indented code blocks (indent is continuation).
  tokenizer: { heading: () => undefined, lheading: () => undefined, code: () => undefined },
})

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  } else if (node.tagName === 'IMG') {
    node.setAttribute('loading', 'lazy')
    node.setAttribute('decoding', 'async')
  }
})

const PURIFY = { FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select'], FORBID_ATTR: ['style'] }

export function toHtml(src: string, opts: MdOptions, tex: Tex | null): string {
  const { text, math } = extractMath(src)
  const body = keywords(text, !!opts.kw)
  const raw = opts.inline ? md.parseInline(body) : md.parse(body)
  const clean = DOMPurify.sanitize(raw as string, PURIFY)
  return restoreMath(clean, math, (m) => {
    const out = tex ? tex(m) : mathSource(m)
    return m.display ? `<span class="math-block">${out}</span>` : out
  })
}
