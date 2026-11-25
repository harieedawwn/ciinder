// Text of one item on the printable sheet: "Đề" (no answers) or "Đáp án". Unclipped, markdown strings for <Rich>.
import { shuffle } from '../../core/shuffle'
import type { Item } from '../../core/types'

export interface KeyRow { text: string; good?: boolean }

/** Prompt with cloze blanks drawn as ___ (Đề) or filled with the first accepted answer in bold (Đáp án). */
export function keyPrompt(item: Item, answers: boolean): string {
  if (item.kind !== 'cloze') return item.prompt
  return item.segments.map((s) => (s.t === 'text' ? s.text : answers ? `**${s.answers[0] ?? ''}**` : '___')).join('')
}

const plain = (s: string) => s.replace(/\[\[|\]\]/g, '')

/** Rows under the prompt; `good` marks correct choices (Đáp án only). */
export function keyRows(item: Item, answers: boolean): KeyRow[] {
  switch (item.kind) {
    case 'mcq':
      return item.options.map((o) => ({ text: o.text, good: answers && o.correct }))
    case 'tf':
      return item.statements.map((o) => ({ text: answers ? `${o.text} — ${o.correct ? 'Đúng' : 'Sai'}` : o.text, good: answers && o.correct }))
    case 'short':
      return answers ? item.answers.map((a) => ({ text: a, good: true })) : []
    case 'cloze':
      return !answers && item.bank
        ? [{ text: [...item.segments.flatMap((s) => (s.t === 'blank' ? [s.answers[0] ?? ''] : [])), ...item.distractors].sort().join(' · ') }]
        : []
    case 'match':
      return answers
        ? item.pairs.map((p) => ({ text: `${p.left} — ${p.right}`, good: true }))
        : [...item.pairs.map((p) => ({ text: p.left })), ...shuffle([...item.pairs.map((p) => p.right), ...item.distractors], 1).map((t) => ({ text: t }))]
    case 'order':
      return answers ? item.items.map((t, i) => ({ text: `${i + 1}. ${t}`, good: true })) : shuffle(item.items, 1).map((t) => ({ text: t }))
    case 'group':
      return answers
        ? item.groups.map((g) => ({ text: `${g.name}: ${g.items.join(', ')}`, good: true }))
        : [{ text: item.groups.map((g) => g.name).join(' · ') }, ...shuffle(item.groups.flatMap((g) => g.items), 1).map((t) => ({ text: t }))]
    case 'essay':
      return answers ? [{ text: plain(item.answer), good: true }] : []
    case 'flash':
      return answers ? [{ text: item.back, good: true }] : []
    default:
      return []
  }
}
