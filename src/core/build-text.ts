// Block → Item builders for the text-heavy kinds: essay, flash, note.
import { base, type Ctx } from './build'
import type { EssayItem, FlashItem, NoteItem } from './types'
import { walk, walkSeparated } from './walk'

export function buildEssay(c: Ctx): EssayItem {
  const w = walkSeparated(c.body, 'essay')
  if (!w.prompt) c.err('E_EMPTY_PROMPT')
  if (!w.hasSep || !w.answer) c.err('E_SEPARATOR')
  const keywords = [...w.answer.matchAll(/\[\[(.+?)\]\]/g)].map((m) => m[1].trim()).filter(Boolean)
  if (w.answer && !keywords.length) c.warn('W_ESSAY_NO_KEYWORD')
  return { ...base(c, 'essay', w), answer: w.answer, keywords }
}

export function buildFlash(c: Ctx): FlashItem {
  const w = walkSeparated(c.body, 'flash')
  if (!w.prompt) c.err('E_EMPTY_PROMPT')
  if (!w.hasSep || !w.answer) c.err('E_SEPARATOR')
  return { ...base(c, 'flash', w), back: w.answer }
}

export function buildNote(c: Ctx): NoteItem {
  const p = walk(c.body, 'note', { take: () => false, cont() {} })
  if (!p.prompt) c.err('E_EMPTY_PROMPT')
  return { ...base(c, 'note', p), points: 0, body: p.prompt }
}
