// Scoring (docs/FORMAT.md §7). Pure functions; every score is in 0..1.
import { matchesAnswer } from './normalize'
import { isScored, type Item, type McqItem, type TfItem } from './types'

/** A learner's response, keyed by kind. Indices refer to the item's original (unshuffled) order. */
export type Answer =
  | { kind: 'mcq'; picks: number[] }
  | { kind: 'tf'; marks: (boolean | null)[] }
  | { kind: 'short'; text: string }
  | { kind: 'cloze'; blanks: string[] }
  /** For each pair (by index), the right-hand text the learner attached, or null. */
  | { kind: 'match'; rights: (string | null)[] }
  /** The learner's sequence, as original item indices. */
  | { kind: 'order'; sequence: number[] }
  /** placements[g][i] = group index chosen for item i of group g, or null. */
  | { kind: 'group'; placements: (number | null)[][] }
  /** Self-rating of a flash card; not scored. */
  | { kind: 'flash'; rating: Mastery }

export type Mastery = 'again' | 'partial' | 'known'

const TF_LADDER = [0, 0.1, 0.25, 0.5, 1]

const fraction = (right: number, total: number) => (total ? right / total : 0)

export function gradeMcq(item: McqItem, picks: number[]): number {
  const chosen = new Set(picks)
  if (!item.multi) return chosen.size === 1 && item.options[picks[0]]?.correct ? 1 : 0
  const correct = item.options.filter((o) => o.correct).length
  let score = 0
  for (const i of chosen) score += item.options[i]?.correct ? 1 : -1
  return Math.max(0, score / correct)
}

export function gradeTf(item: TfItem, marks: (boolean | null)[]): number {
  const right = item.statements.filter((s, i) => marks[i] === s.correct).length
  return item.statements.length === 4 ? TF_LADDER[right] : fraction(right, item.statements.length)
}

/** Score of one item, or null for unscored kinds (essay, flash, note) or a mismatched answer. */
export function gradeItem(item: Item, answer: Answer): number | null {
  if (item.kind !== answer.kind) return null
  switch (answer.kind) {
    case 'mcq':
      return gradeMcq(item as McqItem, answer.picks)
    case 'tf':
      return gradeTf(item as TfItem, answer.marks)
    case 'short': {
      if (item.kind !== 'short') return null
      return matchesAnswer(answer.text, item.answers, { loose: item.loose, tol: item.tol }) ? 1 : 0
    }
    case 'cloze': {
      if (item.kind !== 'cloze') return null
      const blanks = item.segments.filter((s) => s.t === 'blank')
      const right = blanks.filter((b, i) => matchesAnswer(answer.blanks[i] ?? '', b.answers, { loose: item.loose })).length
      return fraction(right, blanks.length)
    }
    case 'match': {
      if (item.kind !== 'match') return null
      return fraction(item.pairs.filter((p, i) => answer.rights[i] === p.right).length, item.pairs.length)
    }
    case 'order': {
      if (item.kind !== 'order') return null
      return fraction(item.items.filter((_, i) => answer.sequence[i] === i).length, item.items.length)
    }
    case 'group': {
      if (item.kind !== 'group') return null
      let right = 0
      let total = 0
      item.groups.forEach((g, gi) =>
        g.items.forEach((_, ii) => {
          total++
          if (answer.placements[gi]?.[ii] === gi) right++
        }),
      )
      return fraction(right, total)
    }
    case 'flash':
      return null
  }
}

export interface SetScore {
  /** 0..1 */
  ratio: number
  /** 0..100, rounded */
  percent: number
  /** 0..10, one decimal */
  ten: number
}

/** Σ(score·points) / Σ(points) over scored items; missing scores count as 0. */
export function scoreSet(items: Item[], scores: Record<string, number | null | undefined>): SetScore {
  let got = 0
  let max = 0
  for (const it of items) {
    if (!isScored(it)) continue
    max += it.points
    got += (scores[it.id] ?? 0) * it.points
  }
  const ratio = max ? got / max : 0
  return { ratio, percent: Math.round(ratio * 100), ten: Math.round(ratio * 100) / 10 }
}
