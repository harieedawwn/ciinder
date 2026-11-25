// Fingerprint data for one set: question kinds + whether each was answered correctly last time.
import { parse } from '../../core/parse'
import type { Kind } from '../../core/types'
import { getSet } from '../../state/library.svelte'
import { loadProgress } from '../../state/progress.svelte'

export interface Print { kinds: Kind[]; done: boolean[] }

export async function setPrint(id: string): Promise<Print | null> {
  const rec = await getSet(id)
  if (!rec) return null
  const items = parse(rec.source).set.items.filter((it) => it.kind !== 'note')
  const { results } = await loadProgress(id)
  return { kinds: items.map((it) => it.kind), done: items.map((it) => (results[it.id] ?? 0) >= 0.999) }
}
