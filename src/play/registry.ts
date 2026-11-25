// Question kind → component. Adding a kind = one component + one line here (+ parser case, guide section, tests).
import type { Component } from 'svelte'
import type { Answer } from '../core/grade'
import type { Item, Kind } from '../core/types'
import Cloze from './Cloze.svelte'
import Flash from './Flash.svelte'
import Group from './Group.svelte'
import Match from './Match.svelte'
import Mcq from './Mcq.svelte'
import Order from './Order.svelte'
import Short from './Short.svelte'
import Tf from './Tf.svelte'

export interface KindProps<I extends Item = Item> {
  item: I
  answer: Answer | undefined
  onanswer: (a: Answer) => void
  /** Attempt seed (option / bank order). */
  seed: number
  /** No more input (checked or review). */
  locked: boolean
  /** Show correct / wrong marks. */
  reveal: boolean
  /** Item score 0..1 once revealed. */
  score: number | undefined
}

/** Exports a kind component may offer to the player (keyboard 1–9). */
export interface KindApi {
  choose?: (n: number) => void
}

// Props are contravariant in `item`, so the map stores components loosely; each one types its own item.
type KindComponent = Component<KindProps<any>, KindApi>

export const REGISTRY: Partial<Record<Kind, KindComponent>> = {
  mcq: Mcq,
  tf: Tf,
  short: Short,
  cloze: Cloze,
  match: Match,
  order: Order,
  group: Group,
  flash: Flash,
}

export const PLAYABLE: ReadonlySet<Kind> = new Set(Object.keys(REGISTRY) as Kind[])

/** Display labels for options (A–H) and THPT statements (a–f). */
export const LETTERS = 'ABCDEFGH'
export const TF_LETTERS = 'abcdef'
