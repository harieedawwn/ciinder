// Text → QuizSet + issues (docs/FORMAT.md §1–§5). Line numbers always refer to the original text.
import { parseBlock, type Attrs, type BlockItem, type Line } from './block'
import { makeIssue, type Issue } from './issues'
import { parseNumber } from './normalize'
import { KINDS, SCORED_KINDS, isScored, type Item, type Kind, type Meta, type QuizSet, type Section } from './types'

export interface ParseResult {
  set: QuizSet
  issues: Issue[]
}

const ALIASES: Record<string, Kind> = {
  tn: 'mcq', 'trac-nghiem': 'mcq', choice: 'mcq', multiple: 'mcq',
  ds: 'tf', 'dung-sai': 'tf', truefalse: 'tf', 'true-false': 'tf',
  tln: 'short', 'tra-loi-ngan': 'short', answer: 'short',
  dien: 'cloze', fill: 'cloze', blank: 'cloze',
  noi: 'match', pair: 'match', pairs: 'match',
  'sap-xep': 'order', sequence: 'order', sort: 'order',
  'phan-loai': 'group', category: 'group', categorize: 'group',
  'tu-luan': 'essay', recall: 'essay',
  the: 'flash', card: 'flash', flashcard: 'flash',
  'ngu-canh': 'note', context: 'note', passage: 'note', info: 'note',
}

const HEADER = /^---[ \t]*([A-Za-z][\w-]*)(?:[ \t]+(.*))?$/
const SECTION = /^##[ \t]+(.+)$/
const TITLE = /^#[ \t]+(.+)$/
const META = /^@([A-Za-z_]+)[ \t]*:[ \t]*(.*)$/
const FENCE = /^[ \t]*```/

export const DEFAULT_TITLE = 'Bộ câu hỏi chưa đặt tên'

/** Normalizes the text and selects the lines to parse (fence body, minus chatter and comments). */
function preprocess(source: string, issues: Issue[]): Line[] {
  const all = source
    .replace(/^﻿/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/ /g, ' ')
    .split('\n')
    .map((text, i) => ({ n: i + 1, text: text.replace(/[ \t]+$/, '') }))

  let lines = all
  let best: Line[] | null = null
  for (let i = 0; i < all.length; i++) {
    if (!FENCE.test(all[i].text)) continue
    const start = i + 1
    let end = start
    while (end < all.length && !FENCE.test(all[end].text)) end++
    const body = all.slice(start, end)
    if (body.some((l) => HEADER.test(l.text)) && (!best || body.length > best.length)) best = body
    i = end
  }
  if (best) {
    lines = best
    issues.push(makeIssue('W_FENCE_STRIPPED', best[0].n))
  }

  const first = lines.findIndex((l) => [TITLE, SECTION, META, HEADER].some((re) => re.test(l.text)))
  if (first > 0) {
    if (lines.slice(0, first).some((l) => l.text.trim())) issues.push(makeIssue('W_PREAMBLE', lines[0].n))
    lines = lines.slice(first)
  }
  return lines.filter((l) => !l.text.trimStart().startsWith('//'))
}

function parseAttrs(kind: Kind, raw: string, line: number, issues: Issue[]): Attrs {
  const attrs: Attrs = {}
  const scored = SCORED_KINDS.includes(kind)
  for (const tok of raw.split(/\s+/).filter(Boolean)) {
    const [k, v] = tok.toLowerCase().split('=', 2)
    const num = v === undefined ? null : parseNumber(v)
    let ok = true
    if (k === 'shuffle' && ['mcq', 'tf', 'match'].includes(kind) && v !== undefined) {
      ok = ['yes', 'no', 'true', 'false', '1', '0'].includes(v)
      attrs.shuffle = ['yes', 'true', '1'].includes(v)
    } else if (k === 'points' && scored && num !== null && num > 0) attrs.points = num
    else if (k === 'tol' && kind === 'short' && num !== null && num >= 0) attrs.tol = num
    else if (k === 'loose' && v === undefined && (kind === 'short' || kind === 'cloze')) attrs.loose = true
    else if (k === 'bank' && v === undefined && kind === 'cloze') attrs.bank = true
    else ok = false
    if (!ok) issues.push(makeIssue('W_UNKNOWN_ATTR', line, `(${tok})`))
  }
  return attrs
}

function applyMeta(meta: Meta, key: string, value: string, line: number, issues: Issue[]) {
  const k = key.toLowerCase()
  const v = value.trim()
  const lv = v.toLowerCase()
  if (k === 'desc' || k === 'subject' || k === 'grade') meta[k] = v
  else if (k === 'mode' && (lv === 'practice' || lv === 'test')) meta.mode = lv
  else if (k === 'time' && (parseNumber(v) ?? 0) > 0) meta.time = parseNumber(v)!
  else if (k === 'shuffle' && ['yes', 'no'].includes(lv)) meta.shuffle = lv === 'yes'
  else issues.push(makeIssue('W_UNKNOWN_META', line, `(@${key})`))
}

/** Best-effort check of `$` pairing and `{}` balance inside math. */
export function mathBalanced(text: string): boolean {
  const s = text.replace(/\\[$\\{}]/g, '')
  if ((s.match(/\$/g) ?? []).length % 2) return false
  for (const m of s.matchAll(/\$\$([\s\S]*?)\$\$|\$([^$]*)\$/g)) {
    let depth = 0
    for (const c of m[1] ?? m[2]) {
      if (c === '{') depth++
      else if (c === '}' && --depth < 0) return false
    }
    if (depth) return false
  }
  return true
}

function hash(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193)
  return (h >>> 0).toString(36)
}

function firstOf(it: BlockItem): string {
  switch (it.kind) {
    case 'mcq': return it.options[0]?.text ?? ''
    case 'tf': return it.statements[0]?.text ?? ''
    case 'short': return it.answers[0] ?? ''
    case 'match': return it.pairs[0]?.left ?? ''
    case 'order': return it.items[0] ?? ''
    case 'group': return it.groups[0]?.name ?? ''
    case 'essay': return it.answer.slice(0, 80)
    case 'flash': return it.back.slice(0, 80)
    default: return ''
  }
}

export function parse(source: string): ParseResult {
  const issues: Issue[] = []
  const lines = preprocess(source, issues)
  const meta: Meta = { mode: 'practice', shuffle: false }
  const sections: Section[] = []
  const items: Item[] = []
  const ids = new Set<string>()
  let title = ''
  let headers = 0
  let started = false
  let sectionId: string | undefined
  let noteId: string | undefined

  const finish = (kind: Kind, attrs: Attrs, header: number, body: Line[]) => {
    if (!mathBalanced(body.map((l) => l.text).join('\n'))) issues.push(makeIssue('E_MATH', header))
    const it = parseBlock(kind, attrs, header, body, issues)
    if (!it) return
    const h = hash(kind + '\u0000' + it.prompt + '\u0000' + firstOf(it))
    let id = h
    for (let k = 2; ids.has(id); k++) id = `${h}-${k}`
    ids.add(id)
    if (it.kind === 'note') noteId = id
    items.push({ ...it, id, sectionId, noteId: it.kind === 'note' ? undefined : noteId } as Item)
  }

  for (let i = 0; i < lines.length; i++) {
    const { n, text } = lines[i]
    let m: RegExpExecArray | null
    if ((m = HEADER.exec(text))) {
      started = true
      headers++
      const word = m[1].toLowerCase()
      const kind = (KINDS as readonly string[]).includes(word) ? (word as Kind) : ALIASES[word]
      let j = i + 1
      while (j < lines.length && !HEADER.test(lines[j].text) && !SECTION.test(lines[j].text)) j++
      if (!kind) issues.push(makeIssue('E_UNKNOWN_TYPE', n, `(${m[1]})`))
      else {
        if (!KINDS.includes(word as Kind)) issues.push(makeIssue('W_ALIAS', n, `(${m[1]} → ${kind})`))
        finish(kind, parseAttrs(kind, m[2] ?? '', n, issues), n, lines.slice(i + 1, j))
      }
      i = j - 1
    } else if ((m = SECTION.exec(text))) {
      started = true
      sectionId = `s${sections.length + 1}`
      noteId = undefined
      sections.push({ id: sectionId, title: m[1].trim(), firstItem: items.length })
    } else if (!started && !title && (m = TITLE.exec(text))) {
      title = m[1].trim()
    } else if (!started && (m = META.exec(text))) {
      applyMeta(meta, m[1], m[2], n, issues)
    }
  }

  if (!headers) issues.push(makeIssue('E_NO_BLOCKS', 0))
  const noExplain = items.filter((it) => isScored(it) && !it.explain)
  if (noExplain.length) issues.push(makeIssue('W_NO_EXPLAIN', noExplain[0].line, `(${noExplain.length} câu)`))

  return { set: { v: 1, title: title || DEFAULT_TITLE, meta, sections, items, source }, issues }
}
