// Share codec (docs/FORMAT.md §8): utf8 → zlib → base64url, prefixed with version "A".
import { strFromU8, strToU8, unzlibSync, zlibSync } from 'fflate'

const VERSION = 'A'
const HREF_RE = /[#&?]s=A([A-Za-z0-9_-]+)/
export const LONG_LINK = 12000

function adler32(d: Uint8Array): number {
  let a = 1
  let b = 0
  for (let i = 0; i < d.length; i++) {
    a = (a + d[i]) % 65521
    b = (b + a) % 65521
  }
  return ((b << 16) | a) >>> 0
}

function toB64Url(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64Url(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(b.length)
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i)
  return out
}

export function encodeSource(source: string): string {
  return VERSION + toB64Url(zlibSync(strToU8(source), { level: 9 }))
}

export function buildShareLink(source: string, origin: string, base: string): string {
  return `${origin}${base}#s=${encodeSource(source)}`
}

export const isLongLink = (link: string): boolean => link.length > LONG_LINK

export type DecodeResult = { ok: true; source: string } | { ok: false; reason: 'none' | 'broken' }

/** Decode from ANY href, tolerating params appended by Zalo/Facebook. */
export function decodeFromHref(href: string): DecodeResult {
  const m = HREF_RE.exec(href)
  if (!m) return { ok: false, reason: 'none' }
  try {
    const z = fromB64Url(m[1])
    if (z.length < 6) throw new Error('short')
    const raw = unzlibSync(z)
    const tail = new DataView(z.buffer, z.byteOffset + z.length - 4, 4).getUint32(0)
    if (tail !== adler32(raw)) throw new Error('checksum')
    return { ok: true, source: strFromU8(raw) }
  } catch {
    return { ok: false, reason: 'broken' }
  }
}
