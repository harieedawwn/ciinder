// "3 ngày trước"-style relative time for library cards.
const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' })
const UNITS: Intl.RelativeTimeFormatUnit[] = ['minute', 'hour', 'day', 'week', 'month', 'year']
/** FACTORS[i] converts UNITS[i] into UNITS[i + 1]. */
const FACTORS = [60, 24, 7, 4.35, 12]

export function ago(ts: number, now = Date.now()): string {
  let v = (ts - now) / 60000
  if (Math.abs(v) < 1) return 'Vừa xong'
  let i = 0
  while (i < FACTORS.length && Math.abs(v) >= FACTORS[i]) v /= FACTORS[i++]
  return rtf.format(Math.round(v), UNITS[i])
}
