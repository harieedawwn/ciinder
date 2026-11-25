import { describe, expect, it } from 'vitest'
import { parse } from './parse'

const files = import.meta.glob('../../public/ciinder-guide.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const guide = Object.values(files)[0] ?? ''
const blocks = [...guide.matchAll(/```text\n([\s\S]*?)\n```/g)].map((m) => m[1])

describe('ciinder-guide.md stays in sync with the parser', () => {
  it('has examples', () => expect(blocks.length).toBeGreaterThan(10))
  it.each(blocks.map((b, i) => [i, b] as const))('example %i parses with 0 errors', (_i, b) => {
    const r = parse(b)
    expect(r.errors, JSON.stringify(r.errors)).toEqual([])
    expect(r.set.items.length).toBeGreaterThan(0)
  })
})
