import { describe, expect, it } from 'vitest'
import { normText, parseNumber, stripDiacritics } from './normalize'

describe('normalize', () => {
  it('parseNumber', () => {
    const cases: [string, number | null][] = [
      ['5', 5], ['0,2', 0.2], ['0.2', 0.2], ['-1,5', -1.5], ['−3', -3], ['1 000', 1000], ['1.234.567', 1234567],
      ['1,234,567', 1234567], ['1.234,5', 1234.5], ['1,234.5', 1234.5], ['2e3', 2000], ['+7', 7],
      ['', null], ['abc', null], ['1,2,3', null], ['1.2.3', null], ['5 mol', null], ['1.', null], [',5', null], ['1.234,5.6', null],
    ]
    for (const [s, n] of cases) expect(parseNumber(s), s).toBe(n)
  })

  it('normText and diacritics', () => {
    expect(normText('  Xin   CHÀO!! ')).toBe('xin chào')
    expect(normText('Đà Nẵng.', true)).toBe('da nang')
    expect(stripDiacritics('Đường đi')).toBe('Duong di')
    expect(normText('hòa'.normalize('NFD'))).toBe(normText('hòa'))
  })
})
