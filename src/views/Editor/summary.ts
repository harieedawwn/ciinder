// Plain-text summary of parsed items for the editor preview (rich rendering arrives with src/render/).
import type { Item, Kind } from '../../core/types'

export const KIND_NAME: Record<Kind, string> = {
  mcq: 'Trắc nghiệm',
  tf: 'Đúng/sai',
  short: 'Trả lời ngắn',
  cloze: 'Điền khuyết',
  match: 'Nối cột',
  order: 'Sắp xếp',
  group: 'Phân loại',
  essay: 'Tự luận',
  flash: 'Thẻ ghi nhớ',
  note: 'Ngữ cảnh',
}

export interface Row {
  text: string
  good?: boolean
}

const clip = (s: string, n = 140) => (s.length > n ? s.slice(0, n) + '…' : s)
const flat = (s: string) => s.replace(/\s+/g, ' ').trim()

/** Compact rows under an item's prompt. */
export function rows(item: Item): Row[] {
  switch (item.kind) {
    case 'mcq':
      return item.options.map((o) => ({ text: clip(flat(o.text)), good: o.correct }))
    case 'tf':
      return item.statements.map((o) => ({ text: clip(flat(o.text)), good: o.correct }))
    case 'short':
      return item.answers.map((a) => ({ text: clip(a), good: true }))
    case 'cloze':
      return item.segments
        .filter((s) => s.t === 'blank')
        .map((s) => ({ text: s.t === 'blank' ? s.answers.join(' / ') : '', good: true }))
    case 'match':
      return item.pairs.map((p) => ({ text: `${clip(flat(p.left), 60)} — ${clip(flat(p.right), 60)}` }))
    case 'order':
      return item.items.map((t, i) => ({ text: `${i + 1}. ${clip(flat(t))}` }))
    case 'group':
      return item.groups.map((g) => ({ text: `${g.name}: ${clip(g.items.join(', '))}` }))
    case 'essay':
      return [{ text: clip(flat(item.answer), 200) }]
    case 'flash':
      return [{ text: clip(flat(item.back), 200) }]
    default:
      return []
  }
}

export function countByKind(items: Item[]): { kind: Kind; n: number }[] {
  const m = new Map<Kind, number>()
  for (const it of items) m.set(it.kind, (m.get(it.kind) ?? 0) + 1)
  return [...m].map(([kind, n]) => ({ kind, n }))
}

export const promptText = (item: Item): string => clip(flat(item.kind === 'cloze' ? item.prompt.replace(/\{\{([^}|]*)[^}]*\}\}/g, '___') : item.prompt), 220)
