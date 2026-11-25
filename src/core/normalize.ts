// Text and number normalization used by grading (docs/FORMAT.md §7).

/** Removes Vietnamese (and other) diacritics, including đ/Đ → d/D. */
export function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
}

/** Trim, collapse spaces, lowercase, drop trailing punctuation; `loose` also strips diacritics. */
export function normText(s: string, loose = false): string {
  let t = s.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase()
  t = t.replace(/[\s.,;:!?…。]+$/u, '')
  return loose ? stripDiacritics(t) : t
}

const GROUPED = /^\d{1,3}(?:[.,]\d{3})+$/

/**
 * Parses a number written with `,` or `.` as decimal separator.
 * Both present → the last one is the decimal separator. Spaces between digits are thousands separators.
 * A single separator is decimal ("0,2", "1.5"); several identical ones must group by 3 ("1.234.567").
 */
export function parseNumber(input: string): number | null {
  let s = input.trim().replace(/[−–]/g, '-').replace(/(\d)[\s ]+(?=\d)/g, '$1')
  if (!s) return null
  let sign = ''
  if (s[0] === '-' || s[0] === '+') {
    sign = s[0] === '-' ? '-' : ''
    s = s.slice(1).trim()
  }
  let exp = ''
  const e = /[eE][-+]?\d+$/.exec(s)
  if (e) {
    exp = e[0]
    s = s.slice(0, e.index)
  }
  if (!/^[\d.,]+$/.test(s) || !/\d/.test(s)) return null
  const dots = (s.match(/\./g) ?? []).length
  const commas = (s.match(/,/g) ?? []).length
  let plain: string
  if (dots && commas) {
    const dec = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ','
    const thou = dec === '.' ? ',' : '.'
    const [int, frac, ...rest] = s.split(dec)
    if (rest.length || frac === undefined || frac.includes(thou) || !GROUPED.test(int)) return null
    plain = int.split(thou).join('') + '.' + frac
  } else if (dots + commas > 1) {
    if (!GROUPED.test(s)) return null
    plain = s.replace(/[.,]/g, '')
  } else {
    plain = s.replace(',', '.')
  }
  if (plain.startsWith('.') || plain.endsWith('.')) return null
  const n = Number(sign + plain + exp)
  return Number.isFinite(n) ? n : null
}

export const DEFAULT_TOL = 1e-9

/**
 * True if `input` matches one of `answers`. If every answer is numeric, compares as numbers within `tol`;
 * otherwise compares normalized text.
 */
export function matchesAnswer(input: string, answers: string[], opts: { loose?: boolean; tol?: number } = {}): boolean {
  if (!answers.length) return false
  const nums = answers.map(parseNumber)
  if (nums.every((n) => n !== null)) {
    const x = parseNumber(input)
    if (x === null) return false
    const tol = opts.tol ?? DEFAULT_TOL
    return nums.some((a) => Math.abs(x - (a as number)) <= tol + 1e-12)
  }
  const got = normText(input, opts.loose)
  if (!got) return false
  return answers.some((a) => normText(a, opts.loose) === got)
}
