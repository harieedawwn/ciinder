// Shared block walker: splits role lines into prompt / explain / hint and lets a kind handle the rest.
import type { Line } from './preprocess'
import { tokenize, type Tok } from './tokens'
import type { Kind } from './types'

export interface Parts {
  prompt: string
  explain?: string
  hint?: string
}

export interface Handler {
  /** Return true when the token was consumed as an item. */
  take(t: Tok): boolean
  /** Continuation line (indented) of the last item. */
  cont(text: string): void
}

const clean = (a: string[]): string => a.join('\n').replace(/^\n+|\n+$/g, '').trim()

export function walk(body: Line[], kind: Kind, h: Handler): Parts {
  const prompt: string[] = []
  const explain: string[] = []
  const hint: string[] = []
  let last: 'item' | 'explain' | 'hint' | null = null
  for (const l of body) {
    const t = tokenize(l.text, kind, false)
    if (t.role === 'explain') {
      explain.push(t.text)
      last = 'explain'
    } else if (t.role === 'hint') {
      hint.push(t.text)
      last = 'hint'
    } else if (t.role !== 'plain' && h.take(t)) {
      last = 'item'
    } else if (t.role === 'plain' && t.text.trim() !== '' && h.take(t)) {
      last = 'item'
    } else if (t.role === 'plain' && t.indented && last === 'item') {
      h.cont(t.text.trim())
    } else if (t.role === 'plain' && t.indented && (last === 'explain' || last === 'hint')) {
      ;(last === 'explain' ? explain : hint).push(t.text.trim())
    } else {
      // unhandled role lines fall back to plain content
      prompt.push(t.role === 'plain' ? t.text : l.text)
      if (t.text.trim() !== '') last = null
    }
  }
  return { prompt: clean(prompt), explain: clean(explain) || undefined, hint: clean(hint) || undefined }
}

/** essay / flash: split at ">>>"; role prefixes after it are NOT parsed except ?? and !!. */
export function walkSeparated(body: Line[], kind: Kind): Parts & { answer: string; hasSep: boolean } {
  const prompt: string[] = []
  const answer: string[] = []
  const explain: string[] = []
  const hint: string[] = []
  let after = false
  for (const l of body) {
    const t = tokenize(l.text, kind, after)
    if (t.role === 'sep' && !after) after = true
    else if (t.role === 'explain') explain.push(t.text)
    else if (t.role === 'hint') hint.push(t.text)
    else (after ? answer : prompt).push(t.role === 'plain' ? t.text : l.text)
  }
  return {
    prompt: clean(prompt),
    answer: clean(answer),
    hasSep: after,
    explain: clean(explain) || undefined,
    hint: clean(hint) || undefined,
  }
}
