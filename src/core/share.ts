// Share codec (docs/FORMAT.md §8): source → zlib → base64url, prefixed with version char "A".
import { strToU8, unzlibSync, zlibSync } from 'fflate'

export const SHARE_VERSION = 'A'
/** Above this length the share UI recommends the HTML file (the link is still offered). */
export const LINK_SOFT_MAX = 12000

const PAYLOAD = /[#&?]s=A([A-Za-z0-9_-]+)/

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function adler32(data: Uint8Array): number {
  let a = 1
  let b = 0
  for (let i = 0; i < data.length; i += 3800) {
    const end = Math.min(i + 3800, data.length)
    for (let j = i; j < end; j++) b += a += data[j]
    a %= 65521
    b %= 65521
  }
  return ((b << 16) | a) >>> 0
}

/** Encodes source text into the payload (without "#s="). */
export function encodeShare(source: string): string {
  return SHARE_VERSION + toBase64Url(zlibSync(strToU8(source), { level: 9 }))
}

/** Full link, e.g. shareLink(src, location.origin + import.meta.env.BASE_URL). */
export function shareLink(source: string, base: string): string {
  return `${base}#s=${encodeShare(source)}`
}

export type DecodeResult = { ok: true; source: string } | { ok: false; reason: 'missing' | 'corrupt' }

/** True if the href carries a share payload (even a broken one). */
export const hasSharePayload = (href: string): boolean => /[#&?]s=A/.test(href)

/** Decodes from any href; tolerates junk added by Zalo/Facebook before or after the hash. Never throws. */
export function decodeShare(href: string): DecodeResult {
  const m = PAYLOAD.exec(href)
  if (!m) return { ok: false, reason: 'missing' }
  try {
    const zipped = fromBase64Url(m[1])
    if (zipped.length < 6) return { ok: false, reason: 'corrupt' }
    const raw = unzlibSync(zipped)
    const v = zipped.subarray(-4)
    const want = ((v[0] << 24) | (v[1] << 16) | (v[2] << 8) | v[3]) >>> 0
    if (adler32(raw) !== want) return { ok: false, reason: 'corrupt' }
    return { ok: true, source: new TextDecoder('utf-8', { fatal: true }).decode(raw) }
  } catch {
    return { ok: false, reason: 'corrupt' }
  }
}
