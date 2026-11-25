import { describe, expect, it } from 'vitest'
import { decodeShare, encodeShare, hasSharePayload, shareLink } from './share'

const SRC = `# Hóa học 11 — Ancol
--- mcq
Công thức chung của ancol no, đơn chức là
+ $\\ce{C_nH_{2n+1}OH}$ ($n \\ge 1$)
- $\\frac{a}{b}$ và tiếng Việt: ắ ằ ẳ ẵ ặ đ Đ
?? Giải thích 🙂`

describe('share codec', () => {
  it('round-trips Vietnamese + math', () => {
    const link = shareLink(SRC, 'https://x.github.io/ciinder/')
    expect(link).toMatch(/^https:\/\/x\.github\.io\/ciinder\/#s=A[A-Za-z0-9_-]+$/)
    expect(decodeShare(link)).toEqual({ ok: true, source: SRC })
  })

  it('decodes hrefs polluted by Zalo / Facebook', () => {
    const p = encodeShare(SRC)
    for (const href of [
      `https://x.github.io/ciinder/#s=${p}?zarsrc=30&utm_source=zalo&utm_medium=zalo`,
      `https://x.github.io/ciinder/?fbclid=x#s=${p}`,
      `https://x.github.io/ciinder/?fbclid=IwAR0abc&s=x#s=${p}&utm_campaign=y`,
    ]) {
      expect(decodeShare(href)).toEqual({ ok: true, source: SRC })
    }
  })

  it('reports missing and truncated payloads without throwing', () => {
    expect(decodeShare('https://x/ciinder/#/')).toEqual({ ok: false, reason: 'missing' })
    const p = encodeShare(SRC.repeat(5))
    for (const cut of [p.slice(0, 3), p.slice(0, p.length - 1), p.slice(0, p.length - 6), p.slice(0, p.length / 2)]) {
      const r = decodeShare('https://x/#s=' + cut)
      expect(r.ok, cut.length.toString()).toBe(false)
    }
    expect(decodeShare('#s=A!!!').ok).toBe(false)
    expect(hasSharePayload('#s=A')).toBe(true)
  })

  it('handles large sources', () => {
    const big = SRC.repeat(400)
    expect(decodeShare('#s=' + encodeShare(big))).toEqual({ ok: true, source: big })
  })
})
