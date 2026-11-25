// Seeded shuffle so one attempt keeps a stable order (seed per attempt).

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

/** Permutation of 0..n-1 (Fisher-Yates). */
export function permutation(n: number, seed: number): number[] {
  const rand = mulberry32(seed)
  const p = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[p[i], p[j]] = [p[j], p[i]]
  }
  return p
}

export function shuffled<T>(arr: readonly T[], seed: number): T[] {
  return permutation(arr.length, seed).map((i) => arr[i])
}
