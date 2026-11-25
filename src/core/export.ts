// Standalone HTML export (docs/ARCH.md, Phase 7): the set source is embedded in player.html as JSON inside a
// text/plain script, with every "<" escaped so no sequence in the content can end or alter the script element.

const SLOT = /<script\b[^>]*\bid="ciinder-src"[^>]*>[\s\S]*?<\/script>/
const TITLE = /<title>[\s\S]*?<\/title>/

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** JSON text safe to place inside a script element. */
export function embedSource(source: string): string {
  return JSON.stringify(source).replace(/[<\u2028\u2029]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))
}

/** Reads what `embedSource` wrote; null when empty or damaged. */
export function readEmbedded(text: string | null | undefined): string | null {
  if (!text?.trim()) return null
  try {
    const v: unknown = JSON.parse(text)
    return typeof v === 'string' && v.trim() ? v : null
  } catch {
    return null
  }
}

/** Fills the empty source slot and the title of the built player.html. Null when the template has no slot. */
export function injectSource(template: string, source: string, title: string): string | null {
  if (!SLOT.test(template)) return null
  const slot = `<script type="text/plain" id="ciinder-src">${embedSource(source)}</script>`
  return template.replace(SLOT, () => slot).replace(TITLE, () => `<title>${escapeHtml(title)}</title>`)
}

/** ASCII file name from a set title (some browsers drop the name and extension when it has diacritics); never empty. */
export function fileName(title: string, ext: string): string {
  const base = title
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[^\x20-\x7e]+/g, '')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
    .trim()
  return `${base || 'ciinder'}.${ext}`
}

/** Stable id for a standalone file (progress is keyed by it): FNV-1a of the source. */
export function sourceId(source: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < source.length; i++) {
    h ^= source.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return 'e' + (h >>> 0).toString(36)
}
