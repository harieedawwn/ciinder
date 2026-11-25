// Seeded shuffling (one seed per attempt, so a resumed attempt shows the same order).

/** mulberry32 PRNG: returns a function yielding floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Derives a 32-bit seed from a string (e.g. attempt id + item id). */
export function seedFrom(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193)
  return h >>> 0
}

/** Fisher–Yates on a copy. */
export function shuffle<T>(arr: readonly T[], seed: number): T[] {
  const out = arr.slice()
  const rnd = mulberry32(seed)
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Shuffled indices 0..n-1. */
export function shuffledIndices(n: number, seed: number): number[] {
  return shuffle(
    Array.from({ length: n }, (_, i) => i),
    seed,
  )
}
