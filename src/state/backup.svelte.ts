// Library backup: export every set + its progress as one JSON; import merges (existing ids are kept untouched).
import { get, set } from 'idb-keyval'
import { backupName, buildBackup, newSets, parseBackup } from '../core/backup'
import { saveText } from '../lib/download.svelte'
import { addRecords, getSet, library, type SetRecord } from './library.svelte'
import { flush } from './progress.svelte'

/** Returns how many sets were exported. */
export async function exportBackup(): Promise<number> {
  flush()
  const sets: SetRecord[] = []
  const progress: Record<string, unknown> = {}
  for (const e of library.entries) {
    const rec = await getSet(e.id)
    if (!rec) continue
    sets.push(rec)
    const p = await get(`prog:${e.id}`).catch(() => undefined)
    if (p) progress[e.id] = p
  }
  if (sets.length) saveText(backupName(), buildBackup(sets, progress), 'application/json', false)
  return sets.length
}

/** Merge a backup file's text into the library; null when it is not a ciinder backup, else the number added. */
export async function importBackup(text: string): Promise<number | null> {
  const backup = parseBackup(text)
  if (!backup) return null
  const fresh = newSets(backup, library.entries.map((e) => e.id))
  await addRecords(fresh.map((s) => ({ ...s })))
  for (const s of fresh) if (backup.progress[s.id]) await set(`prog:${s.id}`, backup.progress[s.id]).catch(() => {})
  return fresh.length
}
