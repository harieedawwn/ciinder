// Data model for a parsed ciinder set (docs/FORMAT.md §6).

export const KINDS = ['mcq', 'tf', 'short', 'cloze', 'match', 'order', 'group', 'essay', 'flash', 'note'] as const
export type Kind = (typeof KINDS)[number]

/** Kinds that produce a score (essay/flash are self-rated, note is context). */
export const SCORED_KINDS: readonly Kind[] = ['mcq', 'tf', 'short', 'cloze', 'match', 'order', 'group']

export interface Meta {
  desc?: string
  subject?: string
  grade?: string
  mode: 'practice' | 'test'
  /** Minutes. */
  time?: number
  shuffle: boolean
}

export interface Section {
  id: string
  title: string
  /** Index into QuizSet.items of the first item after the section header. */
  firstItem: number
}

interface ItemBase {
  id: string
  /** Markdown. For flash: the front. For note: the whole body. For cloze: raw text with {{…}}. */
  prompt: string
  explain?: string
  hint?: string
  points: number
  /** 1-based line of the `---` header in the original text. */
  line: number
  sectionId?: string
  /** Id of the note this item is shown with. */
  noteId?: string
}

export interface Choice {
  text: string
  correct: boolean
}

export interface McqItem extends ItemBase {
  kind: 'mcq'
  options: Choice[]
  multi: boolean
  shuffle: boolean
}

export interface TfItem extends ItemBase {
  kind: 'tf'
  statements: Choice[]
  shuffle: boolean
}

export interface ShortItem extends ItemBase {
  kind: 'short'
  answers: string[]
  numeric: boolean
  tol?: number
  loose: boolean
}

export type ClozeSegment = { t: 'text'; text: string } | { t: 'blank'; answers: string[] }

export interface ClozeItem extends ItemBase {
  kind: 'cloze'
  segments: ClozeSegment[]
  bank: boolean
  distractors: string[]
  loose: boolean
}

export interface Pair {
  left: string
  right: string
}

export interface MatchItem extends ItemBase {
  kind: 'match'
  pairs: Pair[]
  distractors: string[]
  shuffle: boolean
}

export interface OrderItem extends ItemBase {
  kind: 'order'
  /** In the correct order. */
  items: string[]
}

export interface Group {
  name: string
  items: string[]
}

export interface GroupItem extends ItemBase {
  kind: 'group'
  groups: Group[]
}

export interface EssayItem extends ItemBase {
  kind: 'essay'
  /** Markdown with [[keyword]] marks. */
  answer: string
  keywords: string[]
}

export interface FlashItem extends ItemBase {
  kind: 'flash'
  back: string
}

export interface NoteItem extends ItemBase {
  kind: 'note'
}

export type Item =
  | McqItem
  | TfItem
  | ShortItem
  | ClozeItem
  | MatchItem
  | OrderItem
  | GroupItem
  | EssayItem
  | FlashItem
  | NoteItem

export interface QuizSet {
  v: 1
  title: string
  meta: Meta
  sections: Section[]
  items: Item[]
  source: string
}

export function isScored(item: Item): boolean {
  return SCORED_KINDS.includes(item.kind)
}
