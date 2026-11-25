// Attempt helpers: question order, option order, answered checks, bank words, section breakdown. Pure, seeded.
import type { Answer } from './grade'
import { seedFrom, shuffle, shuffledIndices } from './shuffle'
import { isScored, type ClozeItem, type Item, type Kind, type QuizSet } from './types'

/** Item ids to play, in order. Shuffles within sections; items sharing a note stay together, the note's order kept. */
export function buildOrder(set: QuizSet, opts: { shuffle: boolean; seed: number; kinds: ReadonlySet<Kind>; only?: readonly string[] }): string[] {
  const only = opts.only ? new Set(opts.only) : null
  const pick = (it: Item) => it.kind !== 'note' && opts.kinds.has(it.kind) && (!only || only.has(it.id))
  const runs: Item[][][] = []
  let lastSection: string | undefined = '\u0000'
  for (const it of set.items) {
    if (!pick(it)) continue
    if (it.sectionId !== lastSection) {
      runs.push([])
      lastSection = it.sectionId
    }
    const blocks = runs[runs.length - 1]
    const prev = blocks[blocks.length - 1]
    if (prev && it.noteId && prev[0].noteId === it.noteId) prev.push(it)
    else blocks.push([it])
  }
  return runs.flatMap((blocks, i) => (opts.shuffle ? shuffle(blocks, opts.seed + i) : blocks)).flat().map((it) => it.id)
}

/** Display order of an item's options/statements as original indices. */
export function optionOrder(item: Item, seed: number): number[] {
  const n = item.kind === 'mcq' ? item.options.length : item.kind === 'tf' ? item.statements.length : 0
  const mixed = (item.kind === 'mcq' || item.kind === 'tf') && item.shuffle
  return mixed ? shuffledIndices(n, seedFrom(`${seed}:${item.id}`)) : Array.from({ length: n }, (_, i) => i)
}

/** Word bank of a cloze item: first accepted answer of each blank plus distractors, seeded mix. */
export function bankWords(item: ClozeItem, seed: number): string[] {
  const words = item.segments.flatMap((s) => (s.t === 'blank' ? [s.answers[0] ?? ''] : []))
  return shuffle([...words, ...item.distractors], seedFrom(`${seed}:bank:${item.id}`))
}

/** True when the learner gave any input. */
export function isAnswered(answer: Answer | undefined): boolean {
  if (!answer) return false
  switch (answer.kind) {
    case 'mcq':
      return answer.picks.length > 0
    case 'tf':
      return answer.marks.some((m) => m !== null)
    case 'short':
      return answer.text.trim() !== ''
    case 'cloze':
      return answer.blanks.some((b) => b.trim() !== '')
    case 'match':
      return answer.rights.some((r) => r !== null)
    case 'order':
      return answer.sequence.length > 0
    case 'group':
      return answer.placements.some((g) => g.some((p) => p !== null))
  }
}

export interface SectionScore {
  title: string
  got: number
  max: number
}

/** Points per section over the played items (items without a section are grouped under ''). */
export function sectionScores(set: QuizSet, ids: readonly string[], scores: Record<string, number>): SectionScore[] {
  const titles = new Map(set.sections.map((s) => [s.id, s.title]))
  const played = new Set(ids)
  const out = new Map<string, SectionScore>()
  for (const it of set.sections.length ? set.items : []) {
    if (!played.has(it.id) || !isScored(it)) continue
    const key = it.sectionId ?? ''
    const row = out.get(key) ?? { title: titles.get(key) ?? '', got: 0, max: 0 }
    row.max += it.points
    row.got += (scores[it.id] ?? 0) * it.points
    out.set(key, row)
  }
  return [...out.values()]
}
