import { describe, expect, it } from 'vitest'
import { issuesReport } from './issues'
import { parse } from './parse'
import type { ClozeItem, EssayItem, FlashItem, GroupItem, Item, MatchItem, McqItem, OrderItem, ShortItem, TfItem } from './types'

const codes = (src: string) => parse(src).issues.map((i) => i.code)
const errors = (src: string) => codes(src).filter((c) => c.startsWith('E_'))
const one = <T extends Item>(src: string) => parse(src).set.items[0] as T

describe('document', () => {
  it('reads title, meta, sections, notes', () => {
    const { set, issues } = parse(`# Bộ A
@desc: Mô tả
@subject: Hóa
@grade: 11
@mode: test
@time: 45
@shuffle: yes
@color: red

## Phần I
--- note
Đọc đoạn sau.
--- mcq
Câu 1
+ a
- b
## Phần II
--- flash
Mặt trước
>>>
Mặt sau
`)
    expect(set.title).toBe('Bộ A')
    expect(set.meta).toEqual({ desc: 'Mô tả', subject: 'Hóa', grade: '11', mode: 'test', time: 45, shuffle: true })
    expect(set.sections.map((s) => [s.title, s.firstItem])).toEqual([['Phần I', 0], ['Phần II', 2]])
    const [note, mcq, flash] = set.items
    expect(note.kind).toBe('note')
    expect(mcq.noteId).toBe(note.id)
    expect(mcq.sectionId).toBe('s1')
    expect(flash.noteId).toBeUndefined()
    expect(flash.sectionId).toBe('s2')
    expect(issues.find((i) => i.code === 'W_UNKNOWN_META')?.line).toBe(8)
  })

  it('defaults', () => {
    const { set } = parse('--- short\nx\n= 1')
    expect(set.title).toBeTruthy()
    expect(set.meta).toEqual({ mode: 'practice', shuffle: false })
    expect(set.items[0].points).toBe(1)
  })

  it('ids are stable and unique', () => {
    const src = '--- short\nx\n= 1\n--- short\nx\n= 1'
    const a = parse(src).set.items.map((i) => i.id)
    expect(a[0]).not.toBe(a[1])
    expect(parse('# other title\n' + src).set.items.map((i) => i.id)).toEqual(a)
  })

  it('"---" alone is content, not a header', () => {
    const it = one<EssayItem>('--- essay\nQ\n>>>\nphần [[một]]\n---\nphần hai')
    expect(it.answer).toBe('phần [[một]]\n---\nphần hai')
  })
})

describe('kinds', () => {
  it('mcq single and multi', () => {
    const it = one<McqItem>('--- mcq\nCâu\nhai dòng\n- a\n+ b\n- c\n?? vì\n?? thế\n!! gợi ý')
    expect(it.prompt).toBe('Câu\nhai dòng')
    expect(it.options).toEqual([{ text: 'a', correct: false }, { text: 'b', correct: true }, { text: 'c', correct: false }])
    expect(it.multi).toBe(false)
    expect(it.shuffle).toBe(true)
    expect(it.explain).toBe('vì\nthế')
    expect(it.hint).toBe('gợi ý')
    expect(one<McqItem>('--- mcq shuffle=no\nQ\n+ a\n+ b\n- c').multi).toBe(true)
    expect(one<McqItem>('--- mcq shuffle=no\nQ\n+ a\n- b').shuffle).toBe(false)
  })

  it('tf', () => {
    const it = one<TfItem>('--- tf\nNgữ cảnh\n+ a\n- b\n+ c\n- d')
    expect(it.statements.map((s) => s.correct)).toEqual([true, false, true, false])
  })

  it('short with tol and loose', () => {
    const it = one<ShortItem>('--- short tol=0.01 points=2\nQ\n= 0,2\n= 0.2')
    expect(it).toMatchObject({ answers: ['0,2', '0.2'], numeric: true, tol: 0.01, points: 2, loose: false })
    expect(one<ShortItem>('--- short loose\nQ\n= Hà Nội')).toMatchObject({ numeric: false, loose: true })
  })

  it('cloze with bank and distractors', () => {
    const it = one<ClozeItem>('--- cloze bank\nA {{x|y}} B {{z}}.\n- w')
    expect(it.segments).toEqual([
      { t: 'text', text: 'A ' },
      { t: 'blank', answers: ['x', 'y'] },
      { t: 'text', text: ' B ' },
      { t: 'blank', answers: ['z'] },
      { t: 'text', text: '.' },
    ])
    expect(it.bank).toBe(true)
    expect(it.distractors).toEqual(['w'])
  })

  it('match with distractor', () => {
    const it = one<MatchItem>('--- match\nNối\na :: 1\nb :: 2\n:: 3')
    expect(it.pairs).toEqual([{ left: 'a', right: '1' }, { left: 'b', right: '2' }])
    expect(it.distractors).toEqual(['3'])
  })

  it('order, including numbered lines', () => {
    expect(one<OrderItem>('--- order\nQ\n- a\n- b\n- c').items).toEqual(['a', 'b', 'c'])
    const r = parse('--- order\nQ\n1. a\n2. b')
    expect((r.set.items[0] as OrderItem).items).toEqual(['a', 'b'])
    expect(r.issues.map((i) => i.code)).toContain('W_ITEM_STYLE')
  })

  it('group', () => {
    const it = one<GroupItem>('--- group\nQ\n[A]\n- 1\n- 2\n[B]\n- 3')
    expect(it.groups).toEqual([{ name: 'A', items: ['1', '2'] }, { name: 'B', items: ['3'] }])
  })

  it('essay keeps raw markdown after >>> and extracts keywords', () => {
    const it = one<EssayItem>('--- essay\nQ\n>>>\n- ý [[một]]\n+ ý [[hai ba]]\n\nđoạn = x\n?? giải thích')
    expect(it.answer).toBe('- ý [[một]]\n+ ý [[hai ba]]\n\nđoạn = x')
    expect(it.keywords).toEqual(['một', 'hai ba'])
    expect(it.explain).toBe('giải thích')
  })

  it('flash', () => {
    const it = one<FlashItem>('--- flash\nTrước\n>>>\nSau $x$')
    expect(it).toMatchObject({ prompt: 'Trước', back: 'Sau $x$' })
  })

  it('note keeps every line as content', () => {
    const it = parse('--- note\n| a | b |\n|---|---|\n- x\n?? y').set.items[0]
    expect(it.prompt).toBe('| a | b |\n|---|---|\n- x\n?? y')
  })

  it('aliases are canonicalized with a warning', () => {
    const r = parse('--- TN\nQ\n+ a\n- b\n--- dung-sai\nQ\n+ a\n- b')
    expect(r.set.items.map((i) => i.kind)).toEqual(['mcq', 'tf'])
    expect(r.issues.filter((i) => i.code === 'W_ALIAS')).toHaveLength(2)
  })
})

describe('lenient input', () => {
  it('strips the largest fenced block and reports original lines', () => {
    const src = 'Đây là bộ câu hỏi:\n\n```text\n# T\n--- mcq\nQ\n+ a\n```\n\nChúc bạn học tốt!'
    const r = parse(src)
    expect(r.set.title).toBe('T')
    expect(r.issues.map((i) => i.code)).toContain('W_FENCE_STRIPPED')
    const e = r.issues.find((i) => i.code === 'E_MCQ_OPTIONS')
    expect(e?.line).toBe(5)
  })

  it('drops preamble chatter', () => {
    const r = parse('Chắc chắn rồi! Đây là kết quả.\n\n# T\n--- short\nQ\n= 1')
    expect(r.set.title).toBe('T')
    expect(r.issues.map((i) => i.code)).toContain('W_PREAMBLE')
    expect(r.set.items[0].line).toBe(4)
  })

  it('A. labels, [x], Đáp án', () => {
    const a = one<McqItem>('--- mcq\nQ\n+ A. đúng\n- B. sai')
    expect(a.options.map((o) => o.text)).toEqual(['đúng', 'sai'])
    const b = one<McqItem>('--- mcq\nQ\n[x] một\n[ ] hai')
    expect(b.options).toEqual([{ text: 'một', correct: true }, { text: 'hai', correct: false }])
    const c = one<McqItem>('--- mcq\nQ\nA. một\nB) hai\nC. ba\nĐáp án: B')
    expect(c.options.map((o) => o.correct)).toEqual([false, true, false])
    const d = one<McqItem>('--- mcq\nQ\nA. một\nB. hai\nC. ba\nAnswer: A, C')
    expect(d.options.map((o) => o.correct)).toEqual([true, false, true])
    expect(d.multi).toBe(true)
  })

  it('tf (Đ)/(S) suffixes', () => {
    const it = one<TfItem>('--- tf\nNgữ cảnh\na) Một (Đ)\nb) Hai (S)\n- c) Ba [Đúng]\n+ Bốn (Sai)')
    expect(it.statements).toEqual([
      { text: 'Một', correct: true },
      { text: 'Hai', correct: false },
      { text: 'Ba', correct: true },
      { text: 'Bốn', correct: false },
    ])
  })

  it('backslash escape, // comments, CRLF, NBSP, BOM, continuation', () => {
    const src = '\uFEFF# T\r\n// note to self\r\n--- mcq\r\n\\- 5 là số\u00A0âm?\r\n+ đúng\r\n  vẫn là phương án\r\n- sai\r\n'
    const it = parse(src).set.items[0] as McqItem
    expect(it.prompt).toBe('- 5 là số âm?')
    expect(it.options[0].text).toBe('đúng\nvẫn là phương án')
    expect(it.line).toBe(3)
  })
})

describe('errors', () => {
  const cases: [string, string][] = [
    ['E_NO_BLOCKS', '# Chỉ có tên'],
    ['E_UNKNOWN_TYPE', '--- quiz\nQ'],
    ['E_EMPTY_PROMPT', '--- mcq\n+ a\n- b'],
    ['E_MCQ_OPTIONS', '--- mcq\nQ\n- a\n- b'],
    ['E_TF_ITEMS', '--- tf\nQ\n+ a'],
    ['E_SHORT_ANSWER', '--- short\nQ'],
    ['E_CLOZE_BLANK', '--- cloze\nKhông có chỗ trống'],
    ['E_MATCH_PAIRS', '--- match\nQ\na :: b'],
    ['E_ORDER_ITEMS', '--- order\nQ\n- a'],
    ['E_GROUPS', '--- group\nQ\n[A]\n- a\n[B]'],
    ['E_SEPARATOR', '--- flash\nTrước'],
    ['E_MATH', '--- short\nTính $x^{2$\n= 1'],
  ]
  it.each(cases)('%s', (code, src) => expect(errors(src)).toEqual([code]))

  it('E_CLOZE_BLANK on empty blank, E_SEPARATOR on empty answer, E_MATH on odd $', () => {
    expect(errors('--- cloze\nA {{ }} B')).toEqual(['E_CLOZE_BLANK'])
    expect(errors('--- essay\nQ\n>>>\n')).toEqual(['E_SEPARATOR'])
    expect(errors('--- short\nGiá $5\n= 1')).toEqual(['E_MATH'])
    expect(errors('--- tf\nQ\n' + '+ a\n'.repeat(9))).toEqual(['E_TF_ITEMS'])
  })

  it('warnings', () => {
    expect(codes('--- mcq\nQ\n+ a\n- a')).toContain('W_DUP_OPTION')
    expect(codes('--- mcq\nQ\n+ a\n+ b')).toContain('W_ALL_CORRECT')
    expect(codes('--- mcq\nQ\n+ 1\n- 2\n- 3\n- 4\n- 5\n- 6\n- 7')).toContain('W_MCQ_MANY_OPTIONS')
    expect(codes('--- essay\nQ\n>>>\nkhông có từ khóa')).toContain('W_ESSAY_NO_KEYWORD')
    expect(codes('--- mcq colour=red\nQ\n+ a\n- b')).toContain('W_UNKNOWN_ATTR')
    expect(codes('--- flash bank\nQ\n>>>\nA')).toContain('W_UNKNOWN_ATTR')
  })

  it('W_NO_EXPLAIN is a single summary issue', () => {
    const r = parse('--- short\nQ\n= 1\n--- short\nQ2\n= 2\n--- short\nQ3\n= 3\n?? vì')
    const w = r.issues.filter((i) => i.code === 'W_NO_EXPLAIN')
    expect(w).toHaveLength(1)
    expect(w[0].line).toBe(1)
    expect(w[0].message_vi).toContain('2 câu')
  })

  it('every issue points at the block header in the original text', () => {
    const src = '# T\n\n--- mcq\nQ\n- a\n- b\n\n--- short\nQ'
    const r = parse(src)
    expect(r.issues.filter((i) => i.code.startsWith('E_')).map((i) => i.line)).toEqual([3, 8])
  })

  it('issuesReport lists errors with line and context', () => {
    const src = '# T\n--- mcq\nQ\n- a\n- b'
    const text = issuesReport(parse(src).issues, src)
    expect(text.split('\n')[0]).toMatch(/^ciinder không đọc được/)
    expect(text).toContain('- Dòng 2 (--- mcq): Câu trắc nghiệm')
    expect(text).toContain('Thêm dấu + trước phương án đúng')
  })
})

describe('perf', () => {
  it('parses 300 items under 50 ms', () => {
    const blocks = Array.from({ length: 300 }, (_, i) =>
      i % 3 === 0
        ? `--- mcq\nCâu ${i}: $\\ce{H2SO4}$ là gì?\n+ axit\n- bazơ\n- muối\n- oxit\n?? vì ${i}`
        : i % 3 === 1
          ? `--- tf\nNgữ cảnh ${i}\n+ a\n- b\n+ c\n- d`
          : `--- essay\nCâu ${i}\n>>>\n- ý [[một]] và [[hai]]\n- ý ba`,
    )
    const src = '# Lớn\n' + blocks.join('\n')
    parse(src)
    const t = performance.now()
    const r = parse(src)
    expect(performance.now() - t).toBeLessThan(50)
    expect(r.set.items).toHaveLength(300)
  })
})
