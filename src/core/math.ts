// Best-effort math sanity check (E_MATH): balanced `$` and balanced braces inside math.
export function mathBroken(text: string): boolean {
  const t = text.replace(/\\\$/g, '').replace(/\$\$/g, '\u0001')
  const display = t.split('\u0001')
  if (display.length % 2 === 0) return true
  const segs: string[] = []
  for (let i = 0; i < display.length; i++) {
    if (i % 2 === 1) segs.push(display[i])
    else {
      const parts = display[i].split('$')
      if (parts.length % 2 === 0) return true
      for (let k = 1; k < parts.length; k += 2) segs.push(parts[k])
    }
  }
  return segs.some((s) => {
    let d = 0
    for (const ch of s.replace(/\\[{}]/g, '')) {
      if (ch === '{') d++
      else if (ch === '}' && --d < 0) return true
    }
    return d !== 0
  })
}
