import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./cloud.config', () => ({ cloudConfig: { apiKey: 'K', projectId: 'P' } }))
vi.mock('idb-keyval', () => {
  const m = new Map<string, unknown>()
  return { get: async (k: string) => m.get(k), set: async (k: string, v: unknown) => void m.set(k, v), del: async (k: string) => void m.delete(k) }
})

import { CloudFailure, get, newShortId, parseShortId, put, shortIdFor } from './cloud'

const reply = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status })

afterEach(() => vi.unstubAllGlobals())

describe('cloud short links', () => {
  it('makes 10-char alphanumeric ids', () => {
    for (let i = 0; i < 50; i++) expect(newShortId()).toMatch(/^[A-Za-z0-9]{10}$/)
  })

  it('parses ids from hrefs polluted by Zalo', () => {
    expect(parseShortId('https://x/ciinder/#k=Ab3dEf9hIj')).toBe('Ab3dEf9hIj')
    expect(parseShortId('https://x/ciinder/#k=Ab3dEf9hIj?zarsrc=30&utm_source=zalo')).toBe('Ab3dEf9hIj')
    expect(parseShortId('https://x/ciinder/?fbclid=1#k=Ab3dEf9hIj&utm_campaign=y')).toBe('Ab3dEf9hIj')
    expect(parseShortId('https://x/ciinder/#s=Aabc')).toBeNull()
  })

  it('retries once with a new id on collision', async () => {
    const f = vi.fn().mockResolvedValueOnce(reply(409)).mockResolvedValueOnce(reply(200))
    vi.stubGlobal('fetch', f)
    expect(await put('payload')).toMatch(/^[A-Za-z0-9]{10}$/)
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('reports offline and not-found', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('net')))
    await expect(put('p')).rejects.toMatchObject({ kind: 'offline' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(404)))
    await expect(get('Ab3dEf9hIj')).rejects.toBeInstanceOf(CloudFailure)
    await expect(get('Ab3dEf9hIj')).rejects.toMatchObject({ kind: 'notfound' })
  })

  it('reads the stored payload', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(200, { fields: { z: { stringValue: 'Aabc' } } })))
    expect(await get('Ab3dEf9hIj')).toBe('Aabc')
  })

  it('reuses the id for the same source', async () => {
    const f = vi.fn().mockResolvedValue(reply(200))
    vi.stubGlobal('fetch', f)
    const a = await shortIdFor('same source', 'Ax')
    const b = await shortIdFor('same source', 'Ax')
    expect(a).toBe(b)
    expect(f).toHaveBeenCalledTimes(1)
  })
})
