// Text and number normalization used by grading (docs/FORMAT.md §7).

export function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
}

/** Compare-ready text: trim, collapse spaces, lowercase, drop trailing punctuation; `loose` also drops diacritics. */
export function normText(s: string, loose = false): string {
  let t = s.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase()
  t = t.replace(/[.,;:!?…]+$/u, '').trim()
  return loose ? stripDiacritics(t) : t
}

/** Parse "1,5", "1.5", "1 000", "1.000.000", "1.234,5" → number, or null when not numeric. */
export function parseNumber(input: string): number | null {
  let s = input.trim().replace(/[\s ]/g, '').replace(/^\+/, '')
  if (!s || !/^-?[\d.,]+$/.test(s)) return null
  const dots = (s.match(/\./g) ?? []).length
  const commas = (s.match(/,/g) ?? []).length
  if (dots && commas) {
    const dec = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ','
    const thou = dec === '.' ? ',' : '.'
    s = s.split(thou).join('').replace(dec, '.')
  } else if (commas) {
    s = commas > 1 ? s.replace(/,/g, '') : s.replace(',', '.')
  } else if (dots > 1) {
    s = s.replace(/\./g, '')
  }
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}
