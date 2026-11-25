// text → QuizSet + issues (docs/FORMAT.md). Never throws.
import { buildCloze, buildGroup, buildMatch, buildMcq, buildOrder, buildShort, buildTf, type Attrs, type Ctx } from './build'
import { buildEssay, buildFlash, buildNote } from './build-text'
import { makeIssue } from './issues'
import { mathBroken } from './math'
import { stripDiacritics } from './normalize'
import { preprocess, type Line } from './preprocess'
import type { Issue, Item, Kind, Meta, ParseResult, QuizSet, Section } from './types'

const ALIASES: Record<Kind, string[]> = {
  mcq: ['tn', 'trac-nghiem', 'choice', 'multiple'],
  tf: ['ds', 'dung-sai', 'truefalse', 'true-false'],
  short: ['tln', 'tra-loi-ngan', 'answer'],
  cloze: ['dien', 'fill', 'blank'],
  match: ['noi', 'pair', 'pairs'],
  order: ['sap-xep', 'sequence', 'sort'],
  group: ['phan-loai', 'category', 'categorize'],
  essay: ['tu-luan', 'recall'],
  flash: ['the', 'card', 'flashcard'],
  note: ['ngu-canh', 'context', 'passage', 'info'],
}
const KINDS = Object.keys(ALIASES) as Kind[]
const LOOKUP = new Map<string, { kind: Kind; alias: boolean }>()
for (const k of KINDS) {
  LOOKUP.set(k, { kind: k, alias: false })
  for (const a of ALIASES[k]) LOOKUP.set(a, { kind: k, alias: true })
}

const BUILDERS: Record<Kind, (c: Ctx) => Item> = {
  mcq: buildMcq,
  tf: buildTf,
  short: buildShort,
  cloze: buildCloze,
  match: buildMatch,
  order: buildOrder,
  group: buildGroup,
  essay: buildEssay,
  flash: buildFlash,
  note: buildNote,
}
const ATTRS = new Set(['shuffle', 'points', 'tol', 'loose', 'bank'])
const META_KEYS = new Set(['desc', 'subject', 'grade', 'mode', 'time', 'shuffle'])
const HEADER = /^---[ \t]+(\S+)(?:[ \t]+(.*))?$/

function hash(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193)
  return (h >>> 0).toString(36)
}

function itemKey(it: Item): string {
  const first =
    it.kind === 'mcq' ? it.options[0]?.text
    : it.kind === 'tf' ? it.statements[0]?.text
    : it.kind === 'short' ? it.answers[0]
    : it.kind === 'match' ? it.pairs[0]?.left
    : it.kind === 'order' ? it.items[0]
    : it.kind === 'group' ? it.groups[0]?.name
    : it.kind === 'essay' ? it.answer.slice(0, 40)
    : it.kind === 'flash' ? it.back.slice(0, 40)
    : ''
  return it.kind + '\u0000' + it.prompt + '\u0000' + (first ?? '')
}

function parseAttrs(s: string | undefined, c: { warn: Ctx['warn'] }): Attrs {
  const attrs: Attrs = {}
  for (const tok of (s ?? '').split(/\s+/).filter(Boolean)) {
    const eq = tok.indexOf('=')
    const key = (eq < 0 ? tok : tok.slice(0, eq)).toLowerCase()
    if (!ATTRS.has(key)) c.warn('W_UNKNOWN_ATTR', tok)
    else attrs[key] = eq < 0 ? true : tok.slice(eq + 1).toLowerCase()
  }
  return attrs
}

function applyMeta(meta: Meta, key: string, val: string, warn: () => void): void {
  if (key === 'mode') {
    if (val === 'practice' || val === 'test') meta.mode = val
    else warn()
  } else if (key === 'time') {
    const n = Number(val.replace(',', '.'))
    if (n > 0) meta.time = n
    else warn()
  } else if (key === 'shuffle') meta.shuffle = /^(yes|true|có|co|1)$/i.test(val)
  else if (key === 'desc' || key === 'subject' || key === 'grade') meta[key] = val
}

export function parse(source: string): ParseResult {
  const issues: Issue[] = []
  const lines = preprocess(source, issues)
  const meta: Meta = { mode: 'practice', shuffle: false }
  const sections: Section[] = []
  const items: Item[] = []
  let title = ''
  let noteId: string | undefined
  let sectionId: string | undefined
  let started = false // first section/block seen
  let noExplain = 0

  type Open = { kind: Kind; line: number; attrs: Attrs; body: Line[] }
  let open: Open | null = null

  const flush = () => {
    if (!open) return
    const o = open
    open = null
    const ctx: Ctx = {
      line: o.line,
      attrs: o.attrs,
      body: o.body,
      warn: (code, arg) => issues.push(makeIssue(code, o.line, arg)),
      err: (code, arg) => issues.push(makeIssue(code, o.line, arg)),
    }
    const it = BUILDERS[o.kind](ctx)
    if (mathBroken(o.body.map((l) => l.text).join('\n'))) ctx.err('E_MATH')
    if (it.kind !== 'note' && it.kind !== 'essay' && it.kind !== 'flash' && !it.explain) noExplain++
    it.sectionId = sectionId
    if (it.kind === 'note') noteId = '#'
    else if (noteId) it.noteId = noteId
    items.push(it)
  }

  for (const l of lines) {
    const h = HEADER.exec(l.text)
    if (h) {
      flush()
      started = true
      const raw = h[1].toLowerCase()
      const found = LOOKUP.get(raw) ?? LOOKUP.get(stripDiacritics(raw))
      if (!found) {
        issues.push(makeIssue('E_UNKNOWN_TYPE', l.no, h[1]))
        continue
      }
      if (found.alias) issues.push(makeIssue('W_ALIAS', l.no, h[1]))
      const attrs = parseAttrs(h[2], { warn: (code, arg) => issues.push(makeIssue(code, l.no, arg)) })
      open = { kind: found.kind, line: l.no, attrs, body: [] }
    } else if (/^##(?!#)/.test(l.text)) {
      flush()
      started = true
      noteId = undefined
      sections.push({ id: 's' + sections.length, title: l.text.replace(/^##\s*/, '').trim(), firstItem: items.length })
      sectionId = 's' + (sections.length - 1)
    } else if (open) {
      open.body.push(l)
    } else if (!started && !title && /^#\s/.test(l.text)) {
      title = l.text.replace(/^#\s+/, '').trim()
    } else if (!started && /^@/.test(l.text)) {
      const m = /^@([^:\s]+)\s*:\s*(.*)$/.exec(l.text)
      const key = m?.[1].toLowerCase() ?? ''
      if (!m || !META_KEYS.has(key)) issues.push(makeIssue('W_UNKNOWN_META', l.no, m?.[1] ?? l.text))
      else applyMeta(meta, key, m[2].trim(), () => issues.push(makeIssue('W_UNKNOWN_META', l.no, key)))
    }
  }
  flush()

  // Stable ids; resolve placeholder note id to the actual note item id.
  const seen = new Map<string, number>()
  let lastNote: string | undefined
  let lastSection: string | undefined
  for (const it of items) {
    const h = hash(itemKey(it))
    const n = seen.get(h) ?? 0
    seen.set(h, n + 1)
    it.id = n ? `${h}-${n}` : h
    if (it.sectionId !== lastSection) {
      lastSection = it.sectionId
      lastNote = undefined
    }
    if (it.kind === 'note') lastNote = it.id
    else if (it.noteId) it.noteId = lastNote
  }

  if (!items.length) issues.push(makeIssue('E_NO_BLOCKS', 0))
  if (noExplain) issues.push(makeIssue('W_NO_EXPLAIN', 0, String(noExplain)))
  issues.sort((a, b) => a.line - b.line)

  const set: QuizSet = { v: 1, title: title || 'Bộ câu hỏi không tên', meta, sections, items, source }
  const errors = issues.filter((i) => i.severity === 'error')
  return { set, issues, errors, warnings: issues.filter((i) => i.severity === 'warn'), ok: errors.length === 0 }
}

