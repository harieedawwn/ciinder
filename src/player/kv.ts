// Stand-in for idb-keyval inside the standalone player (aliased by vite.player.config.ts).
// Progress and settings live in localStorage under "ciinder:"; set records stay in memory (they are embedded in the file).
const mem = new Map<string, unknown>()
const persisted = (key: string) => !key.startsWith('set:') && key !== 'sets:index'

export async function get<T>(key: string): Promise<T | undefined> {
  if (!persisted(key)) return mem.get(key) as T | undefined
  try {
    const raw = localStorage.getItem(`ciinder:${key}`)
    return raw === null ? undefined : (JSON.parse(raw) as T)
  } catch {
    return undefined
  }
}

export async function set(key: string, value: unknown): Promise<void> {
  if (!persisted(key)) {
    mem.set(key, value)
    return
  }
  try {
    localStorage.setItem(`ciinder:${key}`, JSON.stringify(value))
  } catch {
    // Storage blocked or full: progress then lasts for this tab only.
  }
}

export async function del(key: string): Promise<void> {
  mem.delete(key)
  try {
    localStorage.removeItem(`ciinder:${key}`)
  } catch {
    // Nothing to remove.
  }
}
