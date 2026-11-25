// Scoring (docs/FORMAT.md §7). Pure functions; every score is 0..1.
import { normText, parseNumber } from './normalize'
import type { Item, Mastery, QuizSet } from './types'

/** Answer shape per kind:
 * mcq: selected option indices · tf: boolean|null per statement · short: string · cloze: string per blank
 * match: chosen right index per pair (>= pairs.length means a distractor) · order: item indices in the user's order
 * group: chosen group index (or null) per flattened item (groups concatenated). essay/flash/note: not scored. */
export type Answer = number[] | (boolean | null)[] | (number | null)[] | string[] | string

const TF_LADDER = [0, 0.1, 0.25, 0.5, 1]

export function isScored(it: Item): boolean {
  return it.kind !== 'essay' && it.kind !== 'flash' && it.kind !== 'note'
}

const frac = (ok: number, total: number) => (total > 0 ? ok / total : 0)

export function gradeItem(it: Item, ans: Answer | undefined): number {
  if (ans === undefined || ans === null) return 0
  switch (it.kind) {
    case 'mcq': {
      const sel = new Set(ans as number[])
      const correct = it.options.reduce((n, o) => n + (o.correct ? 1 : 0), 0)
      if (!it.multi) return sel.size === 1 && it.options[[...sel][0]]?.correct ? 1 : 0
      let right = 0
      let wrong = 0
      for (const i of sel) {
        if (it.options[i]?.correct) right++
        else wrong++
      }
      return Math.max(0, (right - wrong) / correct)
    }
    case 'tf': {
      const a = ans as (boolean | null)[]
      const ok = it.statements.reduce((n, s, i) => n + (a[i] === s.correct ? 1 : 0), 0)
      return it.statements.length === 4 ? TF_LADDER[ok] : frac(ok, it.statements.length)
    }
    case 'short': {
      const text = String(ans)
      if (it.numeric) {
        const x = parseNumber(text)
        if (x === null) return 0
        return it.answers.some((a) => Math.abs(x - (parseNumber(a) as number)) <= it.tol) ? 1 : 0
      }
      const t = normText(text, it.loose)
      return it.answers.some((a) => normText(a, it.loose) === t) ? 1 : 0
    }
    case 'cloze': {
      const a = ans as string[]
      const blanks = it.segments.filter((s) => s.t === 'blank')
      const ok = blanks.reduce((n, s, i) => {
        const t = normText(a[i] ?? '', it.loose)
        return n + (s.t === 'blank' && t !== '' && s.answers.some((x) => normText(x, it.loose) === t) ? 1 : 0)
      }, 0)
      return frac(ok, blanks.length)
    }
    case 'match': {
      const a = ans as (number | null)[]
      return frac(it.pairs.reduce((n, _, i) => n + (a[i] === i ? 1 : 0), 0), it.pairs.length)
    }
    case 'order': {
      const a = ans as number[]
      return frac(it.items.reduce((n, _, i) => n + (a[i] === i ? 1 : 0), 0), it.items.length)
    }
    case 'group': {
      const a = ans as (number | null)[]
      let k = 0
      let ok = 0
      it.groups.forEach((g, gi) => {
        for (let j = 0; j < g.items.length; j++) if (a[k++] === gi) ok++
      })
      return frac(ok, k)
    }
    default:
      return 0
  }
}

export interface SetScore {
  earned: number
  total: number
  /** 0..1 */
  ratio: number
  percent: number
  /** 0..10, one decimal */
  score10: number
  perItem: Record<string, number>
}

export function gradeSet(set: QuizSet, answers: Record<string, Answer | undefined>): SetScore {
  let earned = 0
  let total = 0
  const perItem: Record<string, number> = {}
  for (const it of set.items) {
    if (!isScored(it)) continue
    const s = gradeItem(it, answers[it.id])
    perItem[it.id] = s
    earned += s * it.points
    total += it.points
  }
  const ratio = total > 0 ? earned / total : 0
  return { earned, total, ratio, percent: Math.round(ratio * 100), score10: Math.round(ratio * 100) / 10, perItem }
}

/** Self-rating of essay/flash → mastery value 0..1 for progress bars. */
export const MASTERY_VALUE: Record<Mastery, number> = { again: 0, partial: 0.5, known: 1 }
