// JSON import: a QuizSet-like object with `source`, or an array of them (backup export, Phase 7).

function sourceOf(v: unknown): string | null {
  if (typeof v === 'string') return v.trim() ? v : null
  if (v && typeof v === 'object' && 'source' in v) return sourceOf((v as { source: unknown }).source)
  return null
}

/** Sources found in JSON text; null when the text is not JSON; [] when JSON holds no usable source. */
export function jsonSources(text: string): string[] | null {
  const t = text.trim().replace(/^﻿/, '')
  if (!/^[[{]/.test(t)) return null
  let data: unknown
  try {
    data = JSON.parse(t)
  } catch {
    return null
  }
  const list = Array.isArray(data) ? data : Array.isArray((data as { sets?: unknown })?.sets) ? (data as { sets: unknown[] }).sets : [data]
  return list.map(sourceOf).filter((s): s is string => s !== null)
}
