import { describe, expect, it } from 'vitest'
import { ago } from './time'

describe('ago', () => {
  const now = Date.UTC(2026, 0, 31)
  it('picks the right unit', () => {
    expect(ago(now - 10_000, now)).toBe('Vừa xong')
    expect(ago(now - 5 * 60_000, now)).toContain('5 phút')
    expect(ago(now - 3 * 3600_000, now)).toContain('3 giờ')
    expect(ago(now - 3 * 86400_000, now)).toContain('3 ngày')
    expect(ago(now - 14 * 86400_000, now)).toContain('2 tuần')
  })
})
