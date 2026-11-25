import { describe, expect, it } from 'vitest'
import { gradeItem, gradeSet } from './grade'
import { normText, parseNumber } from './normalize'
import { parse } from './parse'
import { permutation, shuffled } from './shuffle'

const item = (s: string) => parse(s).set.items[0]

describe('normalize', () => {
  it('numbers', () => {
    expect(parseNumber('1,5')).toBe(1.5)
    expect(parseNumber('1.5')).toBe(1.5)
    expect(parseNumber(' 1 000 ')).toBe(1000)
    expect(parseNumber('1.000.000')).toBe(1000000)
    expect(parseNumber('1.234,5')).toBe(1234.5)
    expect(parseNumber('-2,5')).toBe(-2.5)
    expect(parseNumber('abc')).toBeNull()
    expect(parseNumber('')).toBeNull()
  })
  it('text', () => {
    expect(normText('  Hà   Nội. ')).toBe('hà nội')
    expect(normText('Đà Nẵng', true)).toBe('da nang')
    expect(normText('Đà Nẵng')).toBe('đà nẵng')
  })
})

describe('grade', () => {
  it('mcq single / multi', () => {
    const s = item('--- mcq\nQ\n- a\n+ b')
    expect(gradeItem(s, [1])).toBe(1)
    expect(gradeItem(s, [0])).toBe(0)
    expect(gradeItem(s, [0, 1])).toBe(0)
    const m = item('--- mcq\nQ\n+ a\n+ b\n- c\n- d')
    expect(gradeItem(m, [0, 1])).toBe(1)
    expect(gradeItem(m, [0])).toBe(0.5)
    expect(gradeItem(m, [0, 2])).toBe(0)
    expect(gradeItem(m, [2, 3])).toBe(0)
  })
  it('tf THPT ladder and fraction', () => {
    const t4 = item('--- tf\nQ\n+ a\n- b\n+ c\n- d')
    const ladder = [0, 0.1, 0.25, 0.5, 1]
    for (let k = 0; k <= 4; k++) {
      const ans = [true, false, true, false].map((v, i) => (i < k ? v : !v))
      expect(gradeItem(t4, ans)).toBe(ladder[k])
    }
    const t3 = item('--- tf\nQ\n+ a\n- b\n+ c')
    expect(gradeItem(t3, [true, false, null])).toBeCloseTo(2 / 3)
  })
  it('short numeric with comma and tol', () => {
    const s = item('--- short tol=0.01\nQ\n= 0,2')
    expect(gradeItem(s, '0.205')).toBe(1)
    expect(gradeItem(s, '0,2')).toBe(1)
    expect(gradeItem(s, '0,3')).toBe(0)
    expect(gradeItem(s, 'x')).toBe(0)
    expect(gradeItem(item('--- short\nQ\n= 1000'), '1 000')).toBe(1)
  })
  it('short text strict vs loose', () => {
    expect(gradeItem(item('--- short\nQ\n= Đà Nẵng'), 'da nang')).toBe(0)
    expect(gradeItem(item('--- short loose\nQ\n= Đà Nẵng'), ' DA NANG. ')).toBe(1)
    expect(gradeItem(item('--- short\nQ\n= a\n= b'), 'B')).toBe(1)
  })
  it('cloze, match, order, group fractions', () => {
    const c = item('--- cloze\n{{a|b}} and {{c}}')
    expect(gradeItem(c, ['B', 'x'])).toBe(0.5)
    expect(gradeItem(c, [])).toBe(0)
    const m = item('--- match\nQ\na :: 1\nb :: 2\n:: 3')
    expect(gradeItem(m, [0, 2])).toBe(0.5)
    const o = item('--- order\nQ\n- a\n- b\n- c\n- d')
    expect(gradeItem(o, [0, 1, 3, 2])).toBe(0.5)
    const g = item('--- group\nQ\n[A]\n- x\n- y\n[B]\n- z')
    expect(gradeItem(g, [0, 1, 1])).toBeCloseTo(2 / 3)
  })
  it('set score weights points, unanswered counts, essay excluded', () => {
    const r = parse('--- mcq points=3\nQ\n+ a\n- b\n--- short\nQ\n= 1\n--- essay\nQ\n>>>\nA')
    const [m, s] = r.set.items
    const sc = gradeSet(r.set, { [m.id]: [0] })
    expect(sc.total).toBe(4)
    expect(sc.percent).toBe(75)
    expect(sc.score10).toBe(7.5)
    expect(gradeSet(r.set, { [m.id]: [0], [s.id]: '1' }).percent).toBe(100)
  })
})

describe('shuffle', () => {
  it('is deterministic and a permutation', () => {
    expect(permutation(10, 7)).toEqual(permutation(10, 7))
    expect([...permutation(10, 7)].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(permutation(10, 7)).not.toEqual(permutation(10, 8))
    expect(shuffled(['a', 'b', 'c'], 1)).toHaveLength(3)
  })
})
