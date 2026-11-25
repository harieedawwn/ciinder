import { describe, expect, it } from 'vitest'
import { bankWords, buildOrder, isAnswered, kindCounts, optionOrder, sectionCounts, sectionScores, selectItems, type Selection } from './attempt'
import { parse } from './parse'
import type { ClozeItem, Kind } from './types'

const SRC = `# T

## A

--- mcq
Q1
+ a
- b
- c

--- note
Đoạn văn

--- mcq
Q2
+ a
- b

--- tf
Q3
+ s1
- s2

## B

--- short
Q4
= 5

--- cloze bank
X {{kì giữa}} và {{kì sau}}.
- kì nghỉ

--- mcq shuffle=no
Q6
+ a
- b
- c
`
const set = parse(SRC).set
const kinds = new Set<Kind>(['mcq', 'tf', 'short', 'cloze'])

describe('attempt', () => {
  it('keeps source order without shuffle and skips notes', () => {
    const ids = buildOrder(set, { shuffle: false, seed: 1, kinds })
    expect(ids.map((id) => set.items.find((i) => i.id === id)!.prompt)).toEqual(['Q1', 'Q2', 'Q3', 'Q4', 'X {{kì giữa}} và {{kì sau}}.', 'Q6'])
  })

  it('shuffles within sections, keeps note groups together, is deterministic', () => {
    for (let seed = 1; seed < 30; seed++) {
      const ids = buildOrder(set, { shuffle: true, seed, kinds })
      expect(ids).toEqual(buildOrder(set, { shuffle: true, seed, kinds }))
      const prompts = ids.map((id) => set.items.find((i) => i.id === id)!.prompt)
      expect(new Set(prompts.slice(0, 3))).toEqual(new Set(['Q1', 'Q2', 'Q3']))
      const q2 = prompts.indexOf('Q2')
      expect(prompts[q2 + 1]).toBe('Q3')
    }
  })

  it('filters by kind and by only', () => {
    expect(buildOrder(set, { shuffle: false, seed: 1, kinds: new Set<Kind>(['tf']) })).toHaveLength(1)
    const q4 = set.items.find((i) => i.prompt === 'Q4')!.id
    expect(buildOrder(set, { shuffle: true, seed: 3, kinds, only: [q4] })).toEqual([q4])
  })

  it('option order respects shuffle=no and is a permutation', () => {
    const fixed = set.items.find((i) => i.prompt === 'Q6')!
    expect(optionOrder(fixed, 9)).toEqual([0, 1, 2])
    const q1 = set.items.find((i) => i.prompt === 'Q1')!
    expect([...optionOrder(q1, 9)].sort()).toEqual([0, 1, 2])
    expect(optionOrder(q1, 9)).toEqual(optionOrder(q1, 9))
  })

  it('bank holds answers and distractors', () => {
    const cloze = set.items.find((i) => i.kind === 'cloze') as ClozeItem
    expect([...bankWords(cloze, 4)].sort()).toEqual(['kì giữa', 'kì nghỉ', 'kì sau'])
  })

  it('answered checks', () => {
    expect(isAnswered(undefined)).toBe(false)
    expect(isAnswered({ kind: 'mcq', picks: [] })).toBe(false)
    expect(isAnswered({ kind: 'tf', marks: [null, true] })).toBe(true)
    expect(isAnswered({ kind: 'short', text: '  ' })).toBe(false)
    expect(isAnswered({ kind: 'cloze', blanks: ['', 'x'] })).toBe(true)
  })

  it('section breakdown', () => {
    const ids = buildOrder(set, { shuffle: false, seed: 1, kinds })
    const scores = Object.fromEntries(ids.map((id) => [id, 1]))
    const rows = sectionScores(set, ids, scores)
    expect(rows.map((r) => [r.title, r.got, r.max])).toEqual([
      ['A', 3, 3],
      ['B', 3, 3],
    ])
  })
})

describe('selectItems', () => {
  const all: Selection = { kinds: [], sections: [], count: 0, seed: 1 }
  const ids = (o: Partial<Selection>) => selectItems(set, { ...all, ...o }, kinds)

  it('returns every askable item in set order by default', () => {
    expect(ids({})).toHaveLength(6)
  })
  it('filters by kind and by section', () => {
    expect(ids({ kinds: ['mcq'] })).toHaveLength(3)
    const b = set.sections[1].id
    expect(ids({ sections: [b] })).toHaveLength(3)
    expect(ids({ kinds: ['mcq'], sections: [b] })).toHaveLength(1)
  })
  it('picks a seeded subset of the filtered pool, keeping set order', () => {
    const a = ids({ count: 3, seed: 7 })
    expect(a).toHaveLength(3)
    expect(ids({ count: 3, seed: 7 })).toEqual(a)
    const order = ids({})
    expect(a).toEqual(order.filter((id) => a.includes(id)))
    expect(ids({ count: 99 })).toHaveLength(6)
  })
  it('counts kinds and sections', () => {
    expect(kindCounts(set, kinds).find((k) => k.kind === 'mcq')?.n).toBe(3)
    expect(sectionCounts(set, kinds).map((s) => s.n)).toEqual([3, 3])
  })
  it('keeps author option order when mixing is off', () => {
    const q = set.items.find((it) => it.kind === 'mcq')!
    expect(optionOrder(q, 5, false)).toEqual([0, 1, 2])
  })
})
