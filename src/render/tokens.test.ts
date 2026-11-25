import { describe, expect, it } from 'vitest'
import { extractMath, hasMath, keywords, plainHtml, restoreMath } from './tokens'

describe('render tokens', () => {
  it('extracts inline and display math, keeps escaped dollars', () => {
    const { text, math } = extractMath('Giá \\$5, $x_1 * y_2$ và $$\\frac{a}{b}$$')
    expect(math).toEqual([
      { src: 'x_1 * y_2', display: false },
      { src: '\\frac{a}{b}', display: true },
    ])
    expect(text).not.toContain('x_1')
    expect(text).toContain('\\$5')
    expect(restoreMath(text, math, (m) => `[${m.src}]`)).toBe('Giá \\$5, [x_1 * y_2] và [\\frac{a}{b}]')
  })

  it('never splits keywords inside math', () => {
    const { text, math } = extractMath('[[Định luật]] $[[a]]$')
    expect(keywords(text, true)).toMatch(/^<mark class="kw" data-k="0">Định luật<\/mark> /)
    expect(restoreMath(keywords(text, true), math, (m) => m.src)).toContain('[[a]]')
  })

  it('numbers keywords in order and skips empty ones; plain mode keeps inner text', () => {
    expect(keywords('[[a]] [[ ]] [[b]]', true)).toBe('<mark class="kw" data-k="0">a</mark>   <mark class="kw" data-k="1">b</mark>')
    expect(keywords('[[a]] và [[b]]', false)).toBe('a và b')
  })

  it('plain fallback escapes html and keeps math source', () => {
    expect(plainHtml('<b>x</b>\n$\\ce{H2O}$')).toBe('&lt;b&gt;x&lt;/b&gt;<br><span class="math-src">$\\ce{H2O}$</span>')
  })

  it('detects unescaped dollars only', () => {
    expect(hasMath('a $x$')).toBe(true)
    expect(hasMath('giá \\$5')).toBe(false)
  })
})
