// Data model — see docs/FORMAT.md §6.
export type Kind = 'mcq' | 'tf' | 'short' | 'cloze' | 'match' | 'order' | 'group' | 'essay' | 'flash' | 'note'
export type Mode = 'practice' | 'test'

export interface Meta {
  desc?: string
  subject?: string
  grade?: string
  mode: Mode
  time?: number
  shuffle: boolean
}

export interface Section {
  id: string
  title: string
  firstItem: number
}

export interface ItemBase {
  id: string
  kind: Kind
  prompt: string
  explain?: string
  hint?: string
  points: number
  line: number
  sectionId?: string
  noteId?: string
}

export interface Choice {
  text: string
  correct: boolean
}
export type ClozeSegment = { t: 'text'; text: string } | { t: 'blank'; answers: string[] }
export interface Group {
  name: string
  items: string[]
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
  tol: number
  loose: boolean
}
export interface ClozeItem extends ItemBase {
  kind: 'cloze'
  segments: ClozeSegment[]
  distractors: string[]
  bank: boolean
  loose: boolean
}
export interface MatchItem extends ItemBase {
  kind: 'match'
  pairs: { left: string; right: string }[]
  distractors: string[]
  shuffle: boolean
}
export interface OrderItem extends ItemBase {
  kind: 'order'
  items: string[]
}
export interface GroupItem extends ItemBase {
  kind: 'group'
  groups: Group[]
}
export interface EssayItem extends ItemBase {
  kind: 'essay'
  answer: string
  keywords: string[]
}
export interface FlashItem extends ItemBase {
  kind: 'flash'
  back: string
}
export interface NoteItem extends ItemBase {
  kind: 'note'
  body: string
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

export type Mastery = 'again' | 'partial' | 'known'

export interface Issue {
  code: string
  severity: 'error' | 'warn'
  line: number
  message_vi: string
  fix_vi: string
}

export interface ParseResult {
  set: QuizSet
  issues: Issue[]
  errors: Issue[]
  warnings: Issue[]
  ok: boolean
}
