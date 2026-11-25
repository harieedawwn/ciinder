// Library backup (Phase 7): every set plus its progress in one JSON file; import merges by set id.

export const BACKUP_APP = 'ciinder'
export const BACKUP_VERSION = 1

export interface BackupSet {
  id: string
  title: string
  source: string
  createdAt: number
  updatedAt: number
}

export interface Backup {
  app: typeof BACKUP_APP
  version: number
  exportedAt: number
  sets: BackupSet[]
  /** Progress objects by set id (opaque here; the progress store reads them). */
  progress: Record<string, unknown>
}

export function buildBackup(sets: BackupSet[], progress: Record<string, unknown>, now = Date.now()): string {
  const body: Backup = { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now, sets, progress }
  return JSON.stringify(body)
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/** Parses backup text; null when it is not a ciinder backup. Drops malformed sets instead of failing. */
export function parseBackup(text: string): Backup | null {
  let data: unknown
  try {
    data = JSON.parse(text.trim().replace(/^﻿/, ''))
  } catch {
    return null
  }
  if (!isObj(data) || data.app !== BACKUP_APP || !Array.isArray(data.sets)) return null
  const now = Date.now()
  const sets = data.sets.flatMap((s): BackupSet[] => {
    if (!isObj(s) || typeof s.id !== 'string' || !s.id || typeof s.source !== 'string' || !s.source.trim()) return []
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : now)
    return [{ id: s.id, title: typeof s.title === 'string' ? s.title : '', source: s.source, createdAt: num(s.createdAt), updatedAt: num(s.updatedAt) }]
  })
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: typeof data.exportedAt === 'number' ? data.exportedAt : now, sets, progress: isObj(data.progress) ? data.progress : {} }
}

/** Sets not yet in the library (skip duplicates by id). */
export function newSets(backup: Backup, existing: Iterable<string>): BackupSet[] {
  const have = new Set(existing)
  return backup.sets.filter((s, i) => !have.has(s.id) && backup.sets.findIndex((x) => x.id === s.id) === i)
}

export const backupName = (now = new Date()): string => `ciinder-sao-luu-${now.toISOString().slice(0, 10)}.json`
