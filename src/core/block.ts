// Parses the body of one `--- kind` block into an Item (docs/FORMAT.md §3, §5).
import { makeIssue, type Issue, type IssueCode } from './issues'
import { delimited, maskMath } from './mathspan'
import { normText, parseNumber } from './normalize'
import type { Choice, ClozeSegment, Group, Item, Kind, Pair } from './types'

export interface Line {
  /** 1-based line number in the original text. */
  n: number
  text: string
}

export interface Attrs {
  shuffle?: boolean
  points?: number
  tol?: number
  loose?: boolean
  bank?: boolean
}

/** Item fields assigned later by the document parser. */
type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
export type BlockItem = DistOmit<Item, 'id'>

type Role =
  | { r: 'explain' | 'hint'; text: string }
  | { r: 'sep' }
  | { r: 'choice'; text: string; correct: boolean; styled: boolean }
  | { r: 'key'; letters: number[] }
  | { r: 'answer' | 'distractor' | 'entry'; text: string; styled?: boolean }
  | { r: 'group'; name: string }
  | { r: 'pair'; left: string; right: string }

type Entry = { r: string; text: string; correct?: boolean; left?: string; right?: string }

const LABEL = /^(?:[A-Ha-h]|\d{1,2})[.)]\s+/
const LETTERED = /^([A-Ha-h])[.)]\s+(.+)$/
const KEY = /^(?:đáp án(?: đúng)?|answer|key)\s*[:：]\s*([A-H](?:\s*(?:,|;|&|và|and|\s)\s*[A-H])*)\s*\.?$/iu
const TF_SUFFIX = /\s*[([](đúng|sai|đ|s|t|f)[)\]]\s*$/iu
const TRUE_MARKS = ['đúng', 'đ', 't']

function stripLabel(text: string): [string, boolean] {
  const t = text.replace(LABEL, '')
  return [t, t !== text]
}

function roleOf(kind: Kind, t: string, hasGroup: boolean): Role | null {
  if (kind === 'note') return null
  let m: RegExpExecArray | null
  if ((m = /^\?\?(?:\s(.*)|$)/.exec(t))) return { r: 'explain', text: m[1] ?? '' }
  if ((m = /^!!(?:\s(.*)|$)/.exec(t))) return { r: 'hint', text: m[1] ?? '' }
  switch (kind) {
    case 'essay':
    case 'flash':
      return t === '>>>' ? { r: 'sep' } : null
    case 'mcq':
    case 'tf': {
      let text: string | null = null
      let correct = false
      let styled = false
      if ((m = /^\[( |x|X)\]\s+(.+)$/.exec(t))) [text, correct, styled] = [m[2], m[1] !== ' ', true]
      else if ((m = /^([+-])\s+(.*)$/.exec(t))) [text, correct] = [m[2], m[1] === '+']
      else if (kind === 'mcq' && (m = KEY.exec(t)))
        return { r: 'key', letters: m[1].toUpperCase().match(/[A-H]/g)!.map((c) => c.charCodeAt(0) - 65) }
      else if (kind === 'mcq' && (m = LETTERED.exec(t))) [text, styled] = [m[2], true]
      if (kind === 'tf') {
        const s = TF_SUFFIX.exec(text ?? t)
        if (s) [text, correct, styled] = [(text ?? t).slice(0, s.index), TRUE_MARKS.includes(s[1].toLowerCase()), true]
      }
      if (text === null) return null
      const [clean, labelled] = stripLabel(text.trim())
      return { r: 'choice', text: clean, correct, styled: styled || labelled }
    }
    case 'short':
      return (m = /^=\s*(.+)$/.exec(t)) ? { r: 'answer', text: m[1].trim() } : null
    case 'cloze':
      return (m = /^-\s+(.+)$/.exec(t)) ? { r: 'distractor', text: m[1].trim() } : null
    case 'match':
    {
      const at = maskMath(t).indexOf('::')
      return at < 0 ? null : { r: 'pair', left: t.slice(0, at).trim(), right: t.slice(at + 2).trim() }
    }
    case 'order':
      if ((m = /^-\s+(.+)$/.exec(t))) return { r: 'entry', text: m[1].trim() }
      return (m = /^\d{1,2}[.)]\s+(.+)$/.exec(t)) ? { r: 'entry', text: m[1].trim(), styled: true } : null
    case 'group':
      if ((m = /^\[([^\]]+)\]$/.exec(t))) return { r: 'group', name: m[1].trim() }
      return hasGroup && (m = /^-\s+(.+)$/.exec(t)) ? { r: 'entry', text: m[1].trim() } : null
    default:
      return null
  }
}

const indentOf = (s: string) => /^[ \t]*/.exec(s)![0].replace(/\t/g, '  ').length

/** Joins lines, dropping blank lines at both edges. */
function trimBlank(lines: string[]): string {
  let a = 0
  let b = lines.length
  while (a < b && !lines[a].trim()) a++
  while (b > a && !lines[b - 1].trim()) b--
  return lines.slice(a, b).join('\n')
}

/** Splits a block body into prompt / role entries / explanation / hint / answer (essay, flash). */
function walk(kind: Kind, lines: Line[], warn: (c: IssueCode) => void) {
  const prompt: string[] = []
  const explain: string[] = []
  const hint: string[] = []
  const answer: string[] = []
  const entries: Entry[] = []
  let last: 'prompt' | 'explain' | 'hint' | 'entry' = 'prompt'
  let sep = false
  let hasGroup = false
  let keys: number[] | null = null

  for (const { text: raw } of lines) {
    if (sep) {
      const m = /^(\?\?|!!)(?:\s(.*)|$)/.exec(raw)
      if (m) (m[1] === '??' ? explain : hint).push(m[2] ?? '')
      else answer.push(raw)
      continue
    }
    if (!raw.trim()) {
      if (last === 'prompt') prompt.push('')
      continue
    }
    const indent = indentOf(raw)
    const escaped = raw.trimStart().startsWith('\\')
    const t = escaped ? raw.trimStart().slice(1) : raw.trimStart()
    const role: Role | null = escaped || (last !== 'prompt' && indent >= 2) ? null : roleOf(kind, t, hasGroup)
    if (!role) {
      const content = escaped ? raw.replace('\\', '') : raw
      if (last === 'prompt') prompt.push(content)
      else if (last === 'explain') explain.push(t)
      else if (last === 'hint') hint.push(t)
      else entries[entries.length - 1].text += '\n' + t
      continue
    }
    switch (role.r) {
      case 'explain':
      case 'hint':
        ;(role.r === 'explain' ? explain : hint).push(role.text)
        last = role.r
        break
      case 'sep':
        sep = true
        break
      case 'key':
        keys = role.letters
        warn('W_ITEM_STYLE')
        break
      case 'group':
        hasGroup = true
        entries.push({ r: 'group', text: role.name })
        last = 'entry'
        break
      case 'pair':
        entries.push({ r: 'pair', text: '', left: role.left, right: role.right })
        last = 'entry'
        break
      case 'choice':
        if (role.styled) warn('W_ITEM_STYLE')
        entries.push({ r: 'choice', text: role.text, correct: role.correct })
        last = 'entry'
        break
      default:
        if (role.styled) warn('W_ITEM_STYLE')
        entries.push({ r: role.r, text: role.text })
        last = 'entry'
    }
  }
  if (keys) {
    const choices = entries.filter((e) => e.r === 'choice')
    choices.forEach((c, i) => (c.correct = keys!.includes(i)))
  }
  return {
    prompt: trimBlank(prompt),
    explain: trimBlank(explain) || undefined,
    hint: trimBlank(hint) || undefined,
    answer: trimBlank(answer),
    entries,
    sep,
  }
}

export function parseBlock(kind: Kind, attrs: Attrs, header: number, lines: Line[], issues: Issue[]): BlockItem | null {
  const warned = new Set<IssueCode>()
  const add = (c: IssueCode) => issues.push(makeIssue(c, header))
  const warn = (c: IssueCode) => {
    if (!warned.has(c)) add(c)
    warned.add(c)
  }
  const w = walk(kind, lines, warn)
  const base = { prompt: w.prompt, explain: w.explain, hint: w.hint, points: attrs.points ?? 1, line: header }
  const texts = (r: string) => w.entries.filter((e) => e.r === r).map((e) => e.text.trim())

  if (kind === 'note') return w.prompt ? { ...base, kind } : null
  if (!w.prompt) add('E_EMPTY_PROMPT')

  switch (kind) {
    case 'mcq': {
      const options: Choice[] = w.entries.filter((e) => e.r === 'choice').map((e) => ({ text: e.text.trim(), correct: !!e.correct }))
      const nCorrect = options.filter((o) => o.correct).length
      if (options.length < 2 || nCorrect === 0) add('E_MCQ_OPTIONS')
      if (new Set(options.map((o) => normText(o.text))).size < options.length) add('W_DUP_OPTION')
      if (options.length >= 2 && nCorrect === options.length) add('W_ALL_CORRECT')
      if (options.length > 6) add('W_MCQ_MANY_OPTIONS')
      return { ...base, kind, options, multi: nCorrect > 1, shuffle: attrs.shuffle ?? true }
    }
    case 'tf': {
      const statements: Choice[] = w.entries.map((e) => ({ text: e.text.trim(), correct: !!e.correct }))
      if (statements.length < 2 || statements.length > 8) add('E_TF_ITEMS')
      return { ...base, kind, statements, shuffle: attrs.shuffle ?? true }
    }
    case 'short': {
      const answers = texts('answer')
      if (!answers.length) add('E_SHORT_ANSWER')
      const numeric = answers.length > 0 && answers.every((a) => parseNumber(a) !== null)
      return { ...base, kind, answers, numeric, tol: attrs.tol, loose: !!attrs.loose }
    }
    case 'cloze': {
      const segments = clozeSegments(w.prompt)
      const blanks = segments.filter((s) => s.t === 'blank')
      if (w.prompt && (!blanks.length || blanks.some((b) => !b.answers.length))) add('E_CLOZE_BLANK')
      return { ...base, kind, segments, bank: !!attrs.bank, distractors: texts('distractor'), loose: !!attrs.loose }
    }
    case 'match': {
      const all = w.entries.filter((e) => e.r === 'pair')
      const pairs: Pair[] = all.filter((e) => e.left && e.right).map((e) => ({ left: e.left!, right: e.right! }))
      const distractors = all.filter((e) => !e.left && e.right).map((e) => e.right!)
      if (pairs.length < 2) add('E_MATCH_PAIRS')
      return { ...base, kind, pairs, distractors, shuffle: attrs.shuffle ?? true }
    }
    case 'order': {
      const items = texts('entry')
      if (items.length < 2) add('E_ORDER_ITEMS')
      return { ...base, kind, items }
    }
    case 'group': {
      const groups: Group[] = []
      for (const e of w.entries) {
        if (e.r === 'group') groups.push({ name: e.text, items: [] })
        else groups[groups.length - 1].items.push(e.text.trim())
      }
      if (groups.length < 2 || groups.some((g) => !g.items.length)) add('E_GROUPS')
      return { ...base, kind, groups }
    }
    case 'essay':
    case 'flash': {
      if (!w.sep || !w.answer) add('E_SEPARATOR')
      if (kind === 'flash') return { ...base, kind, back: w.answer }
      const keywords = delimited(w.answer, '[[', ']]').map((m) => m.inner.trim()).filter(Boolean)
      if (w.answer && !keywords.length) add('W_ESSAY_NO_KEYWORD')
      return { ...base, kind, answer: w.answer, keywords }
    }
  }
}

export function clozeSegments(text: string): ClozeSegment[] {
  const out: ClozeSegment[] = []
  let at = 0
  for (const m of delimited(text, '{{', '}}')) {
    if (m.index > at) out.push({ t: 'text', text: text.slice(at, m.index) })
    out.push({ t: 'blank', answers: m.inner.split('|').map((a) => a.trim()).filter(Boolean) })
    at = m.end
  }
  if (at < text.length) out.push({ t: 'text', text: text.slice(at) })
  return out
}
