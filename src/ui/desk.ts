// Helpers for the desk look (docs/DESIGN.md "Layout v2").

/** Stable small tilt in degrees (−1.2…1.2) derived from an id, so a card always lies the same way. */
export function tiltFor(id: string): string {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619)
  const deg = (((h >>> 0) % 2401) / 1000 - 1.2).toFixed(2)
  return `${deg}deg`
}
