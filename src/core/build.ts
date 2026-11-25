// Block → Item builders for the auto-graded kinds (docs/FORMAT.md §3, §5).
import { parseNumber } from './normalize'
import type { Line } from './preprocess'
import type { ClozeItem, ClozeSegment, GroupItem, ItemBase, MatchItem, McqItem, OrderItem, ShortItem, TfItem, Choice } from './types'
import { walk, type Parts } from './walk'

export type Attrs = Record<string, string | true>

export interface Ctx {
  line: number
  attrs: Attrs
  body: Line[]
  warn(code: string, arg?: string): void
  err(code: string, arg?: string): void
}

export function base<K extends ItemBase['kind']>(c: Ctx, kind: K, p: Parts): ItemBase & { kind: K } {
  const pts = Number(c.attrs.points)
  return { id: '', kind, prompt: p.prompt, explain: p.explain, hint: p.hint, points: pts > 0 ? pts : 1, line: c.line }
}

const noShuffle = (c: Ctx) => c.attrs.shuffle !== 'no'

function labelFor(text: string, idx: number): string | null {
  const m = /^([A-Ha-h])[.)]\s+(.*)$/s.exec(text) ?? /^(\d+)[.)]\s+(.*)$/s.exec(text)
  if (!m) return null
  const n = /\d/.test(m[1]) ? Number(m[1]) - 1 : m[1].toUpperCase().charCodeAt(0) - 65
  return n === idx ? m[2] : null
}

export function buildMcq(c: Ctx): McqItem {
  const options: Choice[] = []
  let letters: number[] | null = null
  let styled = false
  const parts = walk(c.body, 'mcq', {
    take(t) {
      if (t.role === 'plus' || t.role === 'minus' || t.role === 'check') {
        const lab = labelFor(t.text, options.length)
        if (lab !== null || t.role === 'check') styled = true
        options.push({ text: lab ?? t.text, correct: t.role === 'plus' || (t.role === 'check' && t.extra === '1') })
        return true
      }
      if (t.role !== 'plain') return false
      const lab = labelFor(t.text.trim(), options.length)
      if (lab !== null && /^[A-Ha-h]/.test(t.text.trim())) {
        options.push({ text: lab, correct: false })
        styled = true
        return true
      }
      if (!options.length) return false
      const a = /^(?:đáp án|dap an|answer|đ\/a)\s*[:：]\s*([A-Za-z](?:\s*[,;&]?\s*[A-Za-z])*)\s*\.?$/i.exec(t.text.trim())
      if (a) {
        letters = [...a[1].toUpperCase().replace(/[^A-Z]/g, '')].map((ch) => ch.charCodeAt(0) - 65)
        styled = true
        return true
      }
      return false
    },
    cont(text) {
      if (options.length) options[options.length - 1].text += '\n' + text
    },
  })
  if (letters && !options.some((o) => o.correct)) for (const i of letters as number[]) if (options[i]) options[i].correct = true
  if (styled) c.warn('W_ITEM_STYLE')
  const right = options.filter((o) => o.correct).length
  if (!parts.prompt) c.err('E_EMPTY_PROMPT')
  if (options.length < 2 || right === 0) c.err('E_MCQ_OPTIONS')
  if (options.length > 6) c.warn('W_MCQ_MANY_OPTIONS')
  if (options.length > 1 && right === options.length) c.warn('W_ALL_CORRECT')
  if (new Set(options.map((o) => o.text.trim().toLowerCase())).size < options.length) c.warn('W_DUP_OPTION')
  return { ...base(c, 'mcq', parts), options, multi: right >= 2, shuffle: noShuffle(c) }
}

const TF_SUFFIX = /\s*[([](đ|đúng|s|sai|t|f|true|false)[)\]]\s*$/i
const TRUE_WORDS = new Set(['đ', 'đúng', 't', 'true'])

export function buildTf(c: Ctx): TfItem {
  const statements: Choice[] = []
  let styled = false
  const parts = walk(c.body, 'tf', {
    take(t) {
      const m = TF_SUFFIX.exec(t.text)
      if (t.role === 'plain') {
        if (!m) return false
        statements.push({ text: t.text.replace(TF_SUFFIX, '').trim(), correct: TRUE_WORDS.has(m[1].toLowerCase()) })
        styled = true
        return true
      }
      if (t.role !== 'plus' && t.role !== 'minus' && t.role !== 'check') return false
      if (t.role === 'check') styled = true
      if (m) {
        statements.push({ text: t.text.replace(TF_SUFFIX, '').trim(), correct: TRUE_WORDS.has(m[1].toLowerCase()) })
        styled = true
      } else {
        const lab = labelFor(t.text, statements.length)
        if (lab !== null) styled = true
        statements.push({ text: lab ?? t.text, correct: t.role === 'plus' || (t.role === 'check' && t.extra === '1') })
      }
      return true
    },
    cont(text) {
      if (statements.length) statements[statements.length - 1].text += '\n' + text
    },
  })
  if (styled) c.warn('W_ITEM_STYLE')
  if (!parts.prompt) c.err('E_EMPTY_PROMPT')
  if (statements.length < 2 || statements.length > 8) c.err('E_TF_ITEMS')
  return { ...base(c, 'tf', parts), statements, shuffle: noShuffle(c) }
}

export function buildShort(c: Ctx): ShortItem {
  const answers: string[] = []
  const parts = walk(c.body, 'short', {
    take(t) {
      if (t.role !== 'eq') return false
      answers.push(t.text)
      return true
    },
    cont() {},
  })
  if (!parts.prompt) c.err('E_EMPTY_PROMPT')
  if (!answers.length) c.err('E_SHORT_ANSWER')
  const tol = parseNumber(String(c.attrs.tol ?? ''))
  return {
    ...base(c, 'short', parts),
    answers,
    numeric: answers.length > 0 && answers.every((a) => parseNumber(a) !== null),
    tol: tol !== null && tol >= 0 ? tol : 1e-9,
    loose: c.attrs.loose === true,
  }
}

export function parseCloze(text: string): { segments: ClozeSegment[]; empty: boolean } {
  const segments: ClozeSegment[] = []
  let empty = false
  let rest = text
  for (;;) {
    const i = rest.indexOf('{{')
    const j = i < 0 ? -1 : rest.indexOf('}}', i + 2)
    if (j < 0) break
    if (i > 0) segments.push({ t: 'text', text: rest.slice(0, i) })
    const answers = rest.slice(i + 2, j).split('|').map((s) => s.trim()).filter(Boolean)
    if (!answers.length) empty = true
    segments.push({ t: 'blank', answers })
    rest = rest.slice(j + 2)
  }
  if (rest) segments.push({ t: 'text', text: rest })
  return { segments, empty }
}

export function buildCloze(c: Ctx): ClozeItem {
  const distractors: string[] = []
  const parts = walk(c.body, 'cloze', {
    take(t) {
      if (t.role !== 'minus' || !t.text) return false
      distractors.push(t.text)
      return true
    },
    cont() {},
  })
  const { segments, empty } = parseCloze(parts.prompt)
  if (!parts.prompt) c.err('E_EMPTY_PROMPT')
  else if (!segments.some((s) => s.t === 'blank') || empty) c.err('E_CLOZE_BLANK')
  return { ...base(c, 'cloze', parts), segments, distractors, bank: c.attrs.bank === true, loose: c.attrs.loose === true }
}

export function buildMatch(c: Ctx): MatchItem {
  const pairs: { left: string; right: string }[] = []
  const distractors: string[] = []
  const parts = walk(c.body, 'match', {
    take(t) {
      if (t.role !== 'pair') return false
      if (!t.text && t.extra) distractors.push(t.extra)
      else if (t.text && t.extra) pairs.push({ left: t.text, right: t.extra })
      else return false
      return true
    },
    cont() {},
  })
  if (!parts.prompt) c.err('E_EMPTY_PROMPT')
  if (pairs.length < 2) c.err('E_MATCH_PAIRS')
  return { ...base(c, 'match', parts), pairs, distractors, shuffle: noShuffle(c) }
}

export function buildOrder(c: Ctx): OrderItem {
  const items: string[] = []
  const parts = walk(c.body, 'order', {
    take(t) {
      if ((t.role !== 'minus' && t.role !== 'num') || !t.text) return false
      items.push(t.text)
      return true
    },
    cont(text) {
      if (items.length) items[items.length - 1] += '\n' + text
    },
  })
  if (!parts.prompt) c.err('E_EMPTY_PROMPT')
  if (items.length < 2) c.err('E_ORDER_ITEMS')
  return { ...base(c, 'order', parts), items }
}

export function buildGroup(c: Ctx): GroupItem {
  const groups: { name: string; items: string[] }[] = []
  const parts = walk(c.body, 'group', {
    take(t) {
      if (t.role === 'group') groups.push({ name: t.text, items: [] })
      else if (t.role === 'minus' && groups.length && t.text) groups[groups.length - 1].items.push(t.text)
      else return false
      return true
    },
    cont() {},
  })
  if (!parts.prompt) c.err('E_EMPTY_PROMPT')
  if (groups.length < 2 || groups.some((g) => !g.items.length)) c.err('E_GROUPS')
  return { ...base(c, 'group', parts), groups }
}
