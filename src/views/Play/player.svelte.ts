// Player controller: position, answers, practice checks, finishing. Mutates the attempt held in state/progress.
import { isAnswered } from '../../core/attempt'
import { gradeItem, scoreSet, type Answer } from '../../core/grade'
import { isScored, type Item, type QuizSet } from '../../core/types'
import type { KindApi } from '../../play/registry'
import { buzz } from '../../lib/haptics'
import { play } from '../../lib/sound'
import { touchSet } from '../../state/library.svelte'
import { finishAttempt, progress, saveSoon, type Attempt } from '../../state/progress.svelte'

const STREAK_AT = new Set([3, 5, 10])

export class Player {
  readonly items: Item[]
  /** Direction of the last move: 1 forward, -1 back (drives the card deal). */
  dir = $state(1)
  private streak = 0
  /** Mounted kind components by item id (keyboard 1–9). */
  readonly apis = new Map<string, KindApi>()

  constructor(
    readonly setId: string,
    readonly set: QuizSet,
    readonly attempt: Attempt,
    readonly review: boolean,
  ) {
    const byId = new Map(set.items.map((it) => [it.id, it]))
    this.items = attempt.order.map((id) => byId.get(id)).filter((it): it is Item => !!it)
  }

  get pos(): number {
    return Math.min(this.attempt.pos, this.items.length - 1)
  }
  get item(): Item {
    return this.items[this.pos]
  }
  get last(): boolean {
    return this.pos === this.items.length - 1
  }
  get practice(): boolean {
    return this.attempt.mode === 'practice'
  }

  note(item: Item): Item | undefined {
    return item.noteId ? this.set.items.find((it) => it.id === item.noteId) : undefined
  }

  answer(id: string): Answer | undefined {
    return this.attempt.answers[id]
  }

  /** Score shown for an item: after a practice check, or any item in review. */
  shown(id: string): number | undefined {
    return this.review || this.practice ? this.attempt.scores[id] : undefined
  }

  locked(id: string): boolean {
    return this.review || this.shown(id) !== undefined
  }

  setAnswer(id: string, a: Answer): void {
    if (this.locked(id)) return
    this.attempt.answers[id] = a
    if (a.kind === 'flash' || a.kind === 'essay') progress.data.mastery[id] = a.rating
    saveSoon()
  }

  answered(id: string): boolean {
    return isAnswered(this.attempt.answers[id])
  }

  /** Practice: the current item still waits for Kiểm tra (self-rated kinds never do). */
  get checkable(): boolean {
    return !this.review && this.practice && isScored(this.item) && this.shown(this.item.id) === undefined
  }

  /** Items that count toward progress: checked (practice) or answered (test); flash once rated. */
  done(it: Item): boolean {
    return this.practice && isScored(it) ? this.shown(it.id) !== undefined : this.answered(it.id)
  }

  unanswered(): number {
    return this.items.filter((it) => isScored(it) && !this.answered(it.id)).length
  }

  moveTo(i: number): void {
    if (i < 0 || i >= this.items.length || i === this.pos) return
    this.dir = i > this.pos ? 1 : -1
    play(this.dir > 0 ? 'forward' : 'back')
    this.attempt.pos = i
    if (!this.review) saveSoon()
  }

  choose(n: number): void {
    this.apis.get(this.item.id)?.choose?.(n)
  }

  next(): void {
    this.moveTo(this.pos + 1)
  }
  prev(): void {
    this.moveTo(this.pos - 1)
  }

  /** Practice: grade the current item and give feedback. */
  check(): void {
    const it = this.item
    if (!this.checkable || !this.answered(it.id)) return
    const score = gradeItem(it, this.attempt.answers[it.id]!) ?? 0
    this.attempt.scores[it.id] = score
    saveSoon()
    if (score === 1) {
      this.streak++
      play(STREAK_AT.has(this.streak) ? 'streak' : 'check')
      buzz('good')
    } else {
      this.streak = 0
      play('error')
      buzz('bad')
    }
  }

  /** Grade everything, close the attempt. Returns the final percent. */
  finish(): number {
    const scores: Record<string, number> = {}
    for (const it of this.items) {
      if (!isScored(it)) continue
      const a = this.attempt.answers[it.id]
      scores[it.id] = this.attempt.scores[it.id] ?? (a ? (gradeItem(it, a) ?? 0) : 0)
    }
    const { ratio, percent } = scoreSet(this.items, scores)
    finishAttempt(scores, percent)
    void touchSet(this.setId, { lastScore: ratio, openedAt: Date.now() })
    play(percent >= 90 ? 'achievement' : 'complete')
    return percent
  }
}
