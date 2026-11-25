import { describe, expect, it } from 'vitest'
import guide from '../../public/ciinder-guide.md?raw'
import { parse } from './parse'

// Keeps public/ciinder-guide.md and the parser in sync: every ```text example must parse without errors.
const blocks = [...guide.matchAll(/```text\n([\s\S]*?)```/g)].map((m) => m[1])

describe('ciinder-guide.md examples', () => {
  it('has examples', () => expect(blocks.length).toBeGreaterThanOrEqual(10))
  it.each(blocks.map((b, i) => [i, b] as const))('example %i parses cleanly', (_, src) => {
    const { set, issues } = parse(src)
    expect(issues.filter((i) => i.code.startsWith('E_'))).toEqual([])
    expect(set.items.length).toBeGreaterThan(0)
  })
  it('all examples together form one valid set', () => {
    const { set, issues } = parse(blocks.join('\n'))
    expect(issues.filter((i) => i.code.startsWith('E_'))).toEqual([])
    expect(new Set(set.items.map((i) => i.kind)).size).toBe(10)
  })
})
