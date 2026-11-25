import { describe, expect, it } from 'vitest'
import { mulberry32, seedFrom, shuffle, shuffledIndices } from './shuffle'

describe('shuffle', () => {
  it('is deterministic per seed and a permutation', () => {
    const a = shuffledIndices(20, 42)
    expect(shuffledIndices(20, 42)).toEqual(a)
    expect([...a].sort((x, y) => x - y)).toEqual(Array.from({ length: 20 }, (_, i) => i))
    expect(shuffledIndices(20, 43)).not.toEqual(a)
    expect(shuffle(['x'], 1)).toEqual(['x'])
  })
  it('mulberry32 stays in [0,1)', () => {
    const r = mulberry32(seedFrom('attempt-1'))
    for (let i = 0; i < 1000; i++) {
      const v = r()
      expect(v >= 0 && v < 1).toBe(true)
    }
  })
})
