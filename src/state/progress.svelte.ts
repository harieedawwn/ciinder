// Per-set progress in IndexedDB (`prog:<id>`): the running attempt (resume), last finished attempt, history, per-item results.
import { get, set } from 'idb-keyval'
import type { Answer, Mastery } from '../core/grade'

export type Mode = 'practice' | 'test'

export interface Attempt {
  id: string
  mode: Mode
  seed: number
  /** Item ids in play order. */
  order: string[]
  pos: number
  answers: Record<string, Answer>
  /** Practice: score of each checked item. After finishing: score of every played item. */
  scores: Record<string, number>
  startedAt: number
  /** Test timer deadline (ms epoch). */
  endsAt?: number
  finishedAt?: number
  percent?: number
  /** Only the wrong items of a previous attempt. */
  retry?: boolean
}

export interface HistoryRow {
  at: number
  mode: Mode
  percent: number
  count: number
}

export interface Progress {
  current: Attempt | null
  last: Attempt | null
  history: HistoryRow[]
  /** Last score per item id. */
  results: Record<string, number>
  /** Flash card self-ratings by item id. */
  mastery: Record<string, Mastery>
}

const HISTORY_MAX = 30
const key = (setId: string) => `prog:${setId}`
const empty = (): Progress => ({ current: null, last: null, history: [], results: {}, mastery: {} })

export const progress = $state({ setId: '', data: empty() })

let timer = 0

export async function loadProgress(setId: string): Promise<Progress> {
  if (progress.setId === setId) return progress.data
  flush()
  let data: Progress
  try {
    data = { ...empty(), ...((await get<Progress>(key(setId))) ?? {}) }
  } catch {
    data = empty()
  }
  progress.setId = setId
  progress.data = data
  return progress.data
}

/** Persist now (pagehide, route change). */
export function flush(): void {
  clearTimeout(timer)
  timer = 0
  if (!progress.setId) return
  void set(key(progress.setId), $state.snapshot(progress.data)).catch(() => {})
}

/** Persist after a short pause; call after every change. */
export function saveSoon(): void {
  clearTimeout(timer)
  timer = window.setTimeout(flush, 300)
}

export function startAttempt(a: Omit<Attempt, 'id' | 'pos' | 'answers' | 'scores' | 'startedAt'>): Attempt {
  const now = Date.now()
  progress.data.current = { ...a, id: now.toString(36), pos: 0, answers: {}, scores: {}, startedAt: now }
  flush()
  return progress.data.current
}

/** Close the running attempt with final per-item scores. */
export function finishAttempt(scores: Record<string, number>, percent: number): Attempt | null {
  const cur = progress.data.current
  if (!cur) return null
  const done: Attempt = { ...cur, scores, percent, finishedAt: Date.now() }
  progress.data.last = done
  progress.data.current = null
  progress.data.results = { ...progress.data.results, ...scores }
  progress.data.history = [{ at: done.finishedAt!, mode: done.mode, percent, count: done.order.length }, ...progress.data.history].slice(0, HISTORY_MAX)
  flush()
  return done
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush())
}
