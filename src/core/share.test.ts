import { describe, expect, it } from 'vitest'
import { buildShareLink, decodeFromHref, encodeSource, isLongLink } from './share'

const SRC = '# Hóa học 11 — Ancol\n--- mcq\nCông thức $\\ce{C_nH_{2n+1}OH}$ là gì?\n+ đúng\n- sai\n?? Giải thích tiếng Việt: ăn, ơ, ư, đ.'

describe('share codec', () => {
  it('round-trips Vietnamese and math', () => {
    const link = buildShareLink(SRC, 'https://harieedawwn.github.io', '/ciinder/')
    expect(link).toMatch(/^https:\/\/harieedawwn\.github\.io\/ciinder\/#s=A[A-Za-z0-9_-]+$/)
    expect(decodeFromHref(link)).toEqual({ ok: true, source: SRC })
  })
  it('round-trips large input', () => {
    const big = Array.from({ length: 3000 }, (_, i) => `dòng ${i} ✓ ${i * 7}`).join('\n')
    expect(decodeFromHref('https://x/#s=' + encodeSource(big))).toEqual({ ok: true, source: big })
  })
  it('survives params appended after the hash (Zalo)', () => {
    const p = encodeSource(SRC)
    expect(decodeFromHref(`https://x.io/ciinder/#s=${p}?zarsrc=30&utm_source=zalo&utm_medium=zalo`)).toEqual({ ok: true, source: SRC })
  })
  it('survives params before the hash (Facebook)', () => {
    const p = encodeSource(SRC)
    expect(decodeFromHref(`https://x.io/ciinder/?fbclid=x#s=${p}`)).toEqual({ ok: true, source: SRC })
  })
  it('truncated payload gives a clean error', () => {
    const p = encodeSource(SRC)
    for (const n of [1, 3, 8, p.length - 6, p.length - 1]) {
      expect(decodeFromHref('https://x/#s=' + p.slice(0, p.length - n)).ok).toBe(false)
    }
    expect(decodeFromHref('https://x/#s=A!!!')).toEqual({ ok: false, reason: 'none' })
  })
  it('no payload', () => {
    expect(decodeFromHref('https://x/ciinder/')).toEqual({ ok: false, reason: 'none' })
  })
  it('flags long links', () => {
    expect(isLongLink('x'.repeat(12001))).toBe(true)
    expect(isLongLink('x')).toBe(false)
  })
})
