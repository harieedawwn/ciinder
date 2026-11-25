import { describe, expect, it } from 'vitest'
import { gradeItem, scoreSet } from './grade'
import { parse } from './parse'
import type { Item } from './types'

const item = (src: string): Item => parse(src).set.items[0]

describe('grade', () => {
  it('mcq single and multi', () => {
    const s = item('--- mcq\nQ\n- a\n+ b\n- c')
    expect(gradeItem(s, { kind: 'mcq', picks: [1] })).toBe(1)
    expect(gradeItem(s, { kind: 'mcq', picks: [0] })).toBe(0)
    expect(gradeItem(s, { kind: 'mcq', picks: [] })).toBe(0)
    const m = item('--- mcq\nQ\n+ a\n+ b\n- c\n- d')
    expect(gradeItem(m, { kind: 'mcq', picks: [0, 1] })).toBe(1)
    expect(gradeItem(m, { kind: 'mcq', picks: [0] })).toBe(0.5)
    expect(gradeItem(m, { kind: 'mcq', picks: [0, 2] })).toBe(0)
    expect(gradeItem(m, { kind: 'mcq', picks: [2, 3] })).toBe(0)
  })

  it('tf uses the THPT ladder for 4 statements, fraction otherwise', () => {
    const t = item('--- tf\nQ\n+ a\n- b\n+ c\n- d')
    const ladder = [0, 0.1, 0.25, 0.5, 1]
    const truth = [true, false, true, false]
    for (let k = 0; k <= 4; k++) {
      const marks = truth.map((v, i) => (i < k ? v : !v))
      expect(gradeItem(t, { kind: 'tf', marks })).toBe(ladder[k])
    }
    expect(gradeItem(t, { kind: 'tf', marks: [true, null, null, null] })).toBe(0.1)
    const t3 = item('--- tf\nQ\n+ a\n- b\n+ c')
    expect(gradeItem(t3, { kind: 'tf', marks: [true, false, false] })).toBeCloseTo(2 / 3)
  })

  it('short numeric with comma and tol', () => {
    const s = item('--- short tol=0.01\nQ\n= 0,2')
    for (const ok of ['0,2', '0.2', ' 0,21 ', '0.19', '0.20']) expect(gradeItem(s, { kind: 'short', text: ok })).toBe(1)
    for (const bad of ['0,22', 'abc', '', '0,2 mol']) expect(gradeItem(s, { kind: 'short', text: bad })).toBe(0)
    const exact = item('--- short\nQ\n= 1500')
    expect(gradeItem(exact, { kind: 'short', text: '1 500' })).toBe(1)
    expect(gradeItem(exact, { kind: 'short', text: '1.500,0' })).toBe(1)
    expect(gradeItem(exact, { kind: 'short', text: '1500.01' })).toBe(0)
  })

  it('short text: normalized, loose strips diacritics incl. đ', () => {
    const s = item('--- short\nQ\n= Hà Nội')
    expect(gradeItem(s, { kind: 'short', text: '  hà   nội. ' })).toBe(1)
    expect(gradeItem(s, { kind: 'short', text: 'ha noi' })).toBe(0)
    const l = item('--- short loose\nQ\n= Điện Biên Phủ')
    expect(gradeItem(l, { kind: 'short', text: 'dien bien phu' })).toBe(1)
    expect(gradeItem(l, { kind: 'short', text: 'ĐIỆN BIÊN PHỦ!' })).toBe(1)
  })

  it('cloze fraction of blanks', () => {
    const c = item('--- cloze\nA {{x|y}} B {{z}}')
    expect(gradeItem(c, { kind: 'cloze', blanks: ['Y', 'z'] })).toBe(1)
    expect(gradeItem(c, { kind: 'cloze', blanks: ['x', 'w'] })).toBe(0.5)
    expect(gradeItem(c, { kind: 'cloze', blanks: [] })).toBe(0)
  })

  it('match, order, group', () => {
    const m = item('--- match\nQ\na :: 1\nb :: 2\n:: 3')
    expect(gradeItem(m, { kind: 'match', rights: ['1', '3'] })).toBe(0.5)
    const o = item('--- order\nQ\n- a\n- b\n- c\n- d')
    expect(gradeItem(o, { kind: 'order', sequence: [0, 1, 3, 2] })).toBe(0.5)
    const g = item('--- group\nQ\n[A]\n- 1\n- 2\n[B]\n- 3\n- 4')
    expect(gradeItem(g, { kind: 'group', placements: [[0, 1], [1, null]] })).toBe(0.5)
  })

  it('unscored kinds and mismatched answers return null', () => {
    expect(gradeItem(item('--- flash\nA\n>>>\nB'), { kind: 'short', text: 'x' })).toBeNull()
    expect(gradeItem(item('--- short\nQ\n= 1'), { kind: 'mcq', picks: [0] })).toBeNull()
  })

  it('scoreSet weights by points and skips unscored', () => {
    const { set } = parse('--- short points=3\nQ\n= 1\n--- short\nQ2\n= 2\n--- essay\nQ\n>>>\n[[a]]')
    const [a, b] = set.items
    const s = scoreSet(set.items, { [a.id]: 1, [b.id]: 0 })
    expect(s).toEqual({ ratio: 0.75, percent: 75, ten: 7.5 })
    expect(scoreSet(set.items, {}).ratio).toBe(0)
    expect(scoreSet([], {}).percent).toBe(0)
  })
})
