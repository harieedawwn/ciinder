// Short vibrations on answer feedback (Android; no-op elsewhere). Independent of sound.
import { settings } from '../state/settings.svelte'

const PATTERNS = { good: 8, bad: [6, 40, 6] } as const

export function buzz(kind: keyof typeof PATTERNS): void {
  if (!settings.haptics || typeof navigator.vibrate !== 'function') return
  try {
    navigator.vibrate(PATTERNS[kind] as number | number[])
  } catch {
    // Some webviews throw when vibration is blocked.
  }
}

export const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
