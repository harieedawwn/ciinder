// Last start options per set, kept in localStorage (a per-device convenience; everything works without it).
import type { Kind } from '../../core/types'

export interface StartPrefs {
  mode: 'practice' | 'test'
  shuffle: boolean
  mixOptions: boolean
  kinds: Kind[]
  sections: string[]
  /** 0 = all. */
  count: number
  /** Seed of the random pick, shared by Bắt đầu and Đáp án & in so both show the same questions. */
  seed: number
}

const key = (id: string) => `ciinder:opts:${id}`
export const newSeed = () => (Math.random() * 2 ** 32) >>> 0

export function loadPrefs(id: string): Partial<StartPrefs> | null {
  try {
    const raw = localStorage.getItem(key(id))
    return raw ? (JSON.parse(raw) as Partial<StartPrefs>) : null
  } catch {
    return null
  }
}

export function savePrefs(id: string, prefs: StartPrefs): void {
  try {
    localStorage.setItem(key(id), JSON.stringify(prefs))
  } catch {
    /* storage unavailable: options just aren't remembered */
  }
}
