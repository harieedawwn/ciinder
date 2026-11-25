// Short share links (docs/PHASES.md Phase 12): the encoded payload lives in Firestore, the link carries `#k=<id>`.
// Plain fetch against the Firestore REST API, no SDK. Disabled while cloud.config.ts is empty.
import { del, get as idbGet, set as idbSet } from 'idb-keyval'
import { sourceId } from '../core/export'
import { cloudConfig } from './cloud.config'

const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const SHORT_ID = /[#&?]k=([A-Za-z0-9]{6,16})/
const TIMEOUT = 8000

export type CloudError = 'off' | 'offline' | 'notfound' | 'failed'

export class CloudFailure extends Error {
  constructor(readonly kind: CloudError) {
    super(kind)
  }
}

export const cloudEnabled = (): boolean => Boolean(cloudConfig.apiKey && cloudConfig.projectId)

/** 10 random chars from [A-Za-z0-9] (rejection sampling, no modulo bias). */
export function newShortId(length = 10): string {
  let out = ''
  const buf = new Uint8Array(length * 2)
  while (out.length < length) {
    crypto.getRandomValues(buf)
    for (const b of buf) if (b < 248 && out.length < length) out += ID_CHARS[b % 62]
  }
  return out
}

/** Short id from any href (survives Zalo/Facebook params), or null. */
export const parseShortId = (href: string): string | null => SHORT_ID.exec(href)?.[1] ?? null

export const shortLink = (id: string, base: string): string => `${base}#k=${id}`

const root = () => `https://firestore.googleapis.com/v1/projects/${cloudConfig.projectId}/databases/(default)/documents`

async function request(url: string, init?: RequestInit): Promise<Response> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), TIMEOUT)
  try {
    return await fetch(url, { ...init, signal: ctl.signal })
  } catch {
    throw new CloudFailure('offline')
  } finally {
    clearTimeout(timer)
  }
}

// Written through `commit` so `t` is the server's REQUEST_TIME, which the rules in docs/firestore.rules require.
async function create(id: string, payload: string): Promise<'ok' | 'taken'> {
  const name = `projects/${cloudConfig.projectId}/databases/(default)/documents/sets/${id}`
  const res = await request(`${root()}:commit?key=${cloudConfig.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      writes: [
        {
          update: { name, fields: { z: { stringValue: payload } } },
          updateTransforms: [{ fieldPath: 't', setToServerValue: 'REQUEST_TIME' }],
          currentDocument: { exists: false },
        },
      ],
    }),
  })
  if (res.ok) return 'ok'
  if (res.status === 409) return 'taken'
  throw new CloudFailure('failed')
}

/** Stores a payload and returns its short id; retries once with a new id on a collision. */
export async function put(payload: string): Promise<string> {
  if (!cloudEnabled()) throw new CloudFailure('off')
  for (let attempt = 0; attempt < 2; attempt++) {
    const id = newShortId()
    if ((await create(id, payload)) === 'ok') return id
  }
  throw new CloudFailure('failed')
}

/** Fetches the stored payload for a short id. */
export async function get(id: string): Promise<string> {
  if (!cloudEnabled()) throw new CloudFailure('off')
  const res = await request(`${root()}/sets/${id}?key=${cloudConfig.apiKey}`)
  if (res.status === 404 || res.status === 403) throw new CloudFailure('notfound')
  if (!res.ok) throw new CloudFailure('failed')
  try {
    const doc = (await res.json()) as { fields?: { z?: { stringValue?: string } } }
    const z = doc.fields?.z?.stringValue
    if (z) return z
  } catch {
    // Fall through to the error below.
  }
  throw new CloudFailure('failed')
}

const cacheKey = (source: string) => `short:${sourceId(source)}`

/** Short id for a source: reuses the one created earlier on this device, else uploads. */
export async function shortIdFor(source: string, payload: string): Promise<string> {
  const key = cacheKey(source)
  const cached = await idbGet<string>(key).catch(() => undefined)
  if (cached) return cached
  const id = await put(payload)
  await idbSet(key, id).catch(() => undefined)
  return id
}

export const forgetShortId = (source: string): Promise<void> => del(cacheKey(source)).catch(() => undefined)
