// Saved sets in IndexedDB (docs/ARCH.md "Storage"): `set:<id>` records + a small `sets:index` for instant render.
import { del, get, set } from 'idb-keyval'
import { parse } from '../core/parse'

export interface SetRecord {
  id: string
  title: string
  source: string
  createdAt: number
  updatedAt: number
}

export interface SetEntry {
  id: string
  title: string
  subject?: string
  count: number
  updatedAt: number
  openedAt?: number
  /** Last attempt score 0..1 (written by the player). */
  lastScore?: number
}

const INDEX = 'sets:index'
const setKey = (id: string) => `set:${id}`

export const library = $state({ entries: [] as SetEntry[], ready: false })

/** Entries sorted for display: most recently opened or edited first. */
export function sortedEntries(): SetEntry[] {
  return [...library.entries].sort((a, b) => (b.openedAt ?? b.updatedAt) - (a.openedAt ?? a.updatedAt))
}

export async function loadLibrary(): Promise<void> {
  try {
    library.entries = (await get<SetEntry[]>(INDEX)) ?? []
  } catch {
    library.entries = []
  }
  library.ready = true
}

function persistIndex(): Promise<void> {
  return set(INDEX, $state.snapshot(library.entries)).catch(() => {})
}

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function summarize(source: string): Pick<SetEntry, 'title' | 'subject' | 'count'> {
  const { set: quiz } = parse(source)
  return { title: quiz.title, subject: quiz.meta.subject, count: quiz.items.length }
}

export async function getSet(id: string): Promise<SetRecord | undefined> {
  return get<SetRecord>(setKey(id))
}

/** Create (no id) or update a set from its source text. Returns the id. */
export async function saveSet(source: string, id?: string): Promise<string> {
  const now = Date.now()
  const prev = id ? await getSet(id) : undefined
  const sum = summarize(source)
  const record: SetRecord = {
    id: prev?.id ?? newId(),
    title: sum.title,
    source,
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
  }
  await set(setKey(record.id), record)
  const old = library.entries.find((e) => e.id === record.id)
  const entry: SetEntry = { ...old, id: record.id, ...sum, updatedAt: now }
  library.entries = [entry, ...library.entries.filter((e) => e.id !== record.id)]
  await persistIndex()
  return record.id
}

export async function renameSet(id: string, title: string): Promise<void> {
  const name = title.trim()
  const record = await getSet(id)
  if (!record || !name) return
  await set(setKey(id), { ...record, title: name, updatedAt: Date.now() })
  const e = library.entries.find((x) => x.id === id)
  if (e) e.title = name
  await persistIndex()
}

export async function duplicateSet(id: string): Promise<string | undefined> {
  const record = await getSet(id)
  const src = library.entries.find((e) => e.id === id)
  if (!record || !src) return
  const now = Date.now()
  const copy: SetRecord = { ...record, id: newId(), title: `${record.title} (bản sao)`, createdAt: now, updatedAt: now }
  await set(setKey(copy.id), copy)
  library.entries = [{ ...src, id: copy.id, title: copy.title, updatedAt: now, openedAt: undefined, lastScore: undefined }, ...library.entries]
  await persistIndex()
  return copy.id
}

/** Hide from the index immediately; the record is deleted when `commit` runs (after the undo window). */
export function removeSet(id: string): { undo: () => void; commit: () => Promise<void> } {
  const pos = library.entries.findIndex((e) => e.id === id)
  const entry = library.entries[pos]
  library.entries = library.entries.filter((e) => e.id !== id)
  void persistIndex()
  return {
    undo() {
      if (!entry || library.entries.some((e) => e.id === id)) return
      const next = [...library.entries]
      next.splice(Math.min(pos, next.length), 0, entry)
      library.entries = next
      void persistIndex()
    },
    async commit() {
      if (!library.entries.some((e) => e.id === id)) await del(setKey(id)).catch(() => {})
    },
  }
}

export async function touchSet(id: string, patch: Partial<Pick<SetEntry, 'openedAt' | 'lastScore'>>): Promise<void> {
  const e = library.entries.find((x) => x.id === id)
  if (!e) return
  Object.assign(e, patch)
  await persistIndex()
}
