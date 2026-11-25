import { describe, expect, it } from 'vitest'
import { issuesReport } from './issues'
import { parse } from './parse'
import type { Item } from './types'

const doc = (s: string) => parse(s)
const first = (s: string): Item => doc(s).set.items[0]
const codes = (s: string) => doc(s).issues.map((i) => i.code)

describe('happy paths', () => {
  it('meta, sections, mcq', () => {
    const r = doc('# Tiêu đề\n@desc: mô tả\n@mode: test\n@time: 15\n@shuffle: yes\n\n## Phần I\n\n--- mcq\nCâu?\n- a\n+ b\n?? vì sao\n!! gợi ý')
    expect(r.ok).toBe(true)
    expect(r.set.title).toBe('Tiêu đề')
    expect(r.set.meta).toMatchObject({ desc: 'mô tả', mode: 'test', time: 15, shuffle: true })
    expect(r.set.sections).toHaveLength(1)
    const m = r.set.items[0]
    expect(m).toMatchObject({ kind: 'mcq', multi: false, explain: 'vì sao', hint: 'gợi ý', sectionId: 's0' })
  })
  it('mcq multi', () => {
    expect(first('--- mcq\nQ\n+ a\n+ b\n- c')).toMatchObject({ multi: true })
  })
  it('tf', () => {
    expect(first('--- tf\nCtx\n+ a\n- b')).toMatchObject({ kind: 'tf', statements: [{ text: 'a', correct: true }, { text: 'b', correct: false }] })
  })
  it('short numeric and text', () => {
    expect(first('--- short tol=0.01\nQ\n= 0,2')).toMatchObject({ numeric: true, tol: 0.01 })
    expect(first('--- short loose\nQ\n= Hà Nội\n= Hanoi')).toMatchObject({ numeric: false, loose: true, answers: ['Hà Nội', 'Hanoi'] })
  })
  it('cloze with bank', () => {
    const it = first('--- cloze bank\nA {{x|y}} b {{z}}.\n- d1\n- d2') as Extract<Item, { kind: 'cloze' }>
    expect(it.bank).toBe(true)
    expect(it.distractors).toEqual(['d1', 'd2'])
    expect(it.segments.filter((s) => s.t === 'blank')).toHaveLength(2)
  })
  it('match with distractor', () => {
    expect(first('--- match\nQ\na :: b\nc :: d\n:: e')).toMatchObject({ pairs: [{ left: 'a', right: 'b' }, { left: 'c', right: 'd' }], distractors: ['e'] })
  })
  it('order and group', () => {
    expect(first('--- order\nQ\n- a\n- b\n- c')).toMatchObject({ items: ['a', 'b', 'c'] })
    expect(first('--- group\nQ\n[G1]\n- a\n[G2]\n- b\n- c')).toMatchObject({ groups: [{ name: 'G1', items: ['a'] }, { name: 'G2', items: ['b', 'c'] }] })
  })
  it('essay keywords, flash, note scoping', () => {
    const r = doc('--- note\nCtx\n--- mcq\nQ\n+ a\n- b\n## Sec\n--- essay\nQ\n>>>\nHello [[world]] and [[you]]\n--- flash\nF\n>>>\nB')
    expect(r.ok).toBe(true)
    const [note, q, essay, flash] = r.set.items
    expect(q.noteId).toBe(note.id)
    expect(essay.noteId).toBeUndefined()
    expect(essay).toMatchObject({ keywords: ['world', 'you'] })
    expect(flash).toMatchObject({ back: 'B' })
    expect(note.points).toBe(0)
  })
  it('points attr and stable ids', () => {
    const a = first('--- mcq points=2\nQ\n+ a\n- b')
    expect(a.points).toBe(2)
    expect(first('--- mcq\nQ\n+ a\n- b').id).toBe(first('--- mcq\nQ\n+ a\n- b').id)
    const dup = doc('--- mcq\nQ\n+ a\n- b\n--- mcq\nQ\n+ a\n- b').set.items
    expect(dup[0].id).not.toBe(dup[1].id)
  })
})

describe('error codes', () => {
  const cases: [string, string][] = [
    ['E_NO_BLOCKS', '# only title'],
    ['E_UNKNOWN_TYPE', '--- wat\nx'],
    ['E_EMPTY_PROMPT', '--- mcq\n+ a\n- b'],
    ['E_MCQ_OPTIONS', '--- mcq\nQ\n- a\n- b'],
    ['E_TF_ITEMS', '--- tf\nQ\n+ a'],
    ['E_SHORT_ANSWER', '--- short\nQ'],
    ['E_CLOZE_BLANK', '--- cloze\nno blanks here'],
    ['E_MATCH_PAIRS', '--- match\nQ\na :: b'],
    ['E_ORDER_ITEMS', '--- order\nQ\n- a'],
    ['E_GROUPS', '--- group\nQ\n[A]\n- x\n[B]'],
    ['E_SEPARATOR', '--- essay\nQ\nno sep'],
    ['E_MATH', '--- short\nTính $x + 1\n= 2'],
  ]
  it.each(cases)('%s', (code, src) => {
    expect(codes(src)).toContain(code)
    expect(doc(src).ok).toBe(false)
  })
  it('empty cloze blank', () => expect(codes('--- cloze\nA {{}} b')).toContain('E_CLOZE_BLANK'))
  it('unbalanced braces in math', () => expect(codes('--- short\n$\\frac{1}{2$\n= 1')).toContain('E_MATH'))
  it('balanced math ok', () => expect(codes('--- short\nTính $\\frac{1}{2}$ và $$x^2$$\n= 1')).not.toContain('E_MATH'))
})

describe('warnings', () => {
  it('collects warnings without blocking', () => {
    const r = doc('@foo: x\n--- tn points=2 zzz\nQ\n+ a\n+ a\n--- essay\nQ\n>>>\nno keywords')
    expect(r.ok).toBe(true)
    const c = r.issues.map((i) => i.code)
    for (const w of ['W_UNKNOWN_META', 'W_ALIAS', 'W_UNKNOWN_ATTR', 'W_DUP_OPTION', 'W_ALL_CORRECT', 'W_ESSAY_NO_KEYWORD', 'W_NO_EXPLAIN']) expect(c).toContain(w)
    expect(c.filter((x) => x === 'W_NO_EXPLAIN')).toHaveLength(1)
  })
  it('many options', () => expect(codes('--- mcq\nQ\n+ 1\n- 2\n- 3\n- 4\n- 5\n- 6\n- 7')).toContain('W_MCQ_MANY_OPTIONS'))
})

describe('lenient input', () => {
  it('strips fences and preamble with original line numbers', () => {
    const src = 'Đây là bộ câu hỏi:\n```text\n# T\n--- mcq\nQ\n+ a\n- b\n```\nHết.'
    const r = doc(src)
    expect(r.ok).toBe(true)
    expect(r.set.title).toBe('T')
    expect(r.set.items[0].line).toBe(4)
    expect(r.issues.map((i) => i.code)).toContain('W_FENCE_STRIPPED')
  })
  it('preamble without fence', () => {
    const r = doc('Chào bạn!\n\n# T\n--- mcq\nQ\n+ a\n- b')
    expect(r.issues.map((i) => i.code)).toContain('W_PREAMBLE')
    expect(r.set.items[0].line).toBe(4)
  })
  it('keeps content fences when doc already starts clean', () => {
    const r = doc('# T\n--- essay\nQ\n>>>\n```\n--- x\n```')
    expect(r.set.items).toHaveLength(1)
  })
  it('labels and [x]', () => {
    expect(first('--- mcq\nQ\n+ A. one\n- B) two\n- C. three')).toMatchObject({ options: [{ text: 'one' }, { text: 'two' }, { text: 'three' }] })
    expect(first('--- mcq\nQ\n[x] one\n[ ] two')).toMatchObject({ options: [{ text: 'one', correct: true }, { text: 'two', correct: false }] })
  })
  it('plain lettered options with Đáp án', () => {
    const it = first('--- mcq\nQ\nA. one\nB. two\nC. three\nĐáp án: B') as Extract<Item, { kind: 'mcq' }>
    expect(it.options.map((o) => o.correct)).toEqual([false, true, false])
    expect((first('--- mcq\nQ\nA. a\nB. b\nC. c\nAnswer: A, C') as typeof it).multi).toBe(true)
  })
  it('tf suffixes', () => {
    expect(first('--- tf\nQ\nSt one (Đ)\nSt two (S)\n- St three [Đ]')).toMatchObject({
      statements: [{ text: 'St one', correct: true }, { text: 'St two', correct: false }, { text: 'St three', correct: true }],
    })
  })
  it('order numbered lines', () => {
    expect(first('--- order\nQ\n1. a\n2. b\n3. c')).toMatchObject({ items: ['a', 'b', 'c'] })
  })
  it('aliases', () => {
    expect(first('--- Dien\nA {{b}}').kind).toBe('cloze')
    expect(first('--- trac-nghiem\nQ\n+ a\n- b').kind).toBe('mcq')
    expect(first('--- ds\nQ\n+ a\n- b').kind).toBe('tf')
  })
  it('backslash escape and // comments', () => {
    const it = first('--- mcq\n// note to self\nQ\n\\- 5 là số âm\n+ a\n- b') as Extract<Item, { kind: 'mcq' }>
    expect(it.prompt).toBe('Q\n- 5 là số âm')
    expect(it.options).toHaveLength(2)
  })
  it('CRLF and BOM', () => {
    const r = doc('\uFEFF# T\r\n--- mcq\r\nQ\r\n+ a\r\n- b\r\n')
    expect(r.ok).toBe(true)
    expect(r.set.title).toBe('T')
  })
  it('continuation lines and multi explain', () => {
    const it = first('--- mcq\nQ\n+ a\n  more\n- b\n?? one\n?? two') as Extract<Item, { kind: 'mcq' }>
    expect(it.options[0].text).toBe('a\nmore')
    expect(it.explain).toBe('one\ntwo')
  })
  it('essay answer is raw', () => {
    const it = first('--- essay\nQ\n>>>\n- a [[k]]\n+ b\n?? note') as Extract<Item, { kind: 'essay' }>
    expect(it.answer).toBe('- a [[k]]\n+ b')
    expect(it.explain).toBe('note')
  })
})

describe('line numbers and report', () => {
  it('points at the original header line', () => {
    const r = doc('# T\n\n--- mcq\nQ\n+ a\n- b\n\n--- short\nQ')
    const e = r.errors[0]
    expect(e.code).toBe('E_SHORT_ANSWER')
    expect(e.line).toBe(8)
  })
  it('issuesReport', () => {
    const src = '--- short\nQ'
    const rep = issuesReport(doc(src).issues, src)
    expect(rep).toContain('Dòng 1 (--- short)')
    expect(rep.startsWith('ciinder không đọc được')).toBe(true)
    expect(issuesReport([], '')).toBe('')
  })
})

describe('perf', () => {
  it('parses 300 items under 50 ms', () => {
    const parts: string[] = ['# Big']
    for (let i = 0; i < 100; i++) {
      parts.push(`--- mcq\nCâu ${i}?\n+ a\n- b\n- c\n?? e`, `--- tf\nCtx ${i}\n+ a\n- b\n+ c\n- d`, `--- short\nQ ${i}\n= ${i}`)
    }
    const src = parts.join('\n')
    parse(src)
    const t = performance.now()
    const r = parse(src)
    expect(r.set.items).toHaveLength(300)
    expect(performance.now() - t).toBeLessThan(50)
  })
})
