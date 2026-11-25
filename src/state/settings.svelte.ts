// User settings (theme, sound, haptics, text size, motion) — persisted in IndexedDB, mirrored to <html>.
import { get, set } from 'idb-keyval'

export const THEMES = [
  { id: 'sang', name: 'Sáng', bg: '#F4F5F7', accent: '#2B59C3', mark: '#FFE27A' },
  { id: 'la', name: 'Lá', bg: '#ECF0EA', accent: '#3B7149', mark: '#F3D98B' },
  { id: 'dao', name: 'Đào', bg: '#F7EDEA', accent: '#A34740', mark: '#FFD9A8' },
  { id: 'oai', name: 'Oải hương', bg: '#EEECF6', accent: '#6752BC', mark: '#FFE48A' },
  { id: 'dem', name: 'Đêm', bg: '#121416', accent: '#E3B15C', mark: '#6B5622' },
] as const
export type ThemeId = (typeof THEMES)[number]['id']

export const SOUND_PACKS = [
  { id: 'off', name: 'Tắt' },
  { id: 'soft', name: 'Mềm' },
  { id: 'glass', name: 'Trong' },
  { id: 'minimal', name: 'Gọn' },
] as const
export type SoundPack = (typeof SOUND_PACKS)[number]['id']

export const TEXT_SIZES = [90, 100, 110, 120, 130] as const

export interface Settings {
  /** null = follow system (Sáng / Đêm). */
  theme: ThemeId | null
  sound: SoundPack
  haptics: boolean
  textSize: number
  reduceMotion: boolean
}

const KEY = 'settings'
/** Read synchronously by the inline script in index.html to avoid a theme flash. */
const THEME_HINT = 'ciinder:theme'
const DEFAULTS: Settings = { theme: null, sound: 'soft', haptics: true, textSize: 100, reduceMotion: false }

const darkQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null
const motionQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null

let systemDark = $state(darkQuery?.matches ?? false)
let systemReduce = $state(motionQuery?.matches ?? false)
darkQuery?.addEventListener('change', (e) => (systemDark = e.matches))
motionQuery?.addEventListener('change', (e) => (systemReduce = e.matches))

export const settings: Settings = $state({ ...DEFAULTS })

export function activeTheme(): ThemeId {
  return settings.theme ?? (systemDark ? 'dem' : 'sang')
}

export function motionReduced(): boolean {
  return settings.reduceMotion || systemReduce
}

export async function loadSettings(): Promise<void> {
  try {
    const saved = await get<Partial<Settings>>(KEY)
    if (saved) Object.assign(settings, sanitize(saved))
  } catch {
    // Storage unavailable (private mode / in-app browser): keep defaults in memory.
  }
}

function sanitize(s: Partial<Settings>): Partial<Settings> {
  const out: Partial<Settings> = {}
  if (s.theme === null || THEMES.some((t) => t.id === s.theme)) out.theme = s.theme
  if (SOUND_PACKS.some((p) => p.id === s.sound)) out.sound = s.sound
  if (typeof s.haptics === 'boolean') out.haptics = s.haptics
  if (typeof s.textSize === 'number' && (TEXT_SIZES as readonly number[]).includes(s.textSize)) out.textSize = s.textSize
  if (typeof s.reduceMotion === 'boolean') out.reduceMotion = s.reduceMotion
  return out
}

/** Mirror settings to the document and persist them. Call once from App inside an $effect root. */
export function applySettings(): void {
  $effect(() => {
    const root = document.documentElement
    const theme = activeTheme()
    root.dataset.theme = theme
    try {
      localStorage.setItem(THEME_HINT, theme)
    } catch {
      // Storage blocked: the inline hint in index.html then falls back to the system scheme.
    }
    root.dataset.motion = motionReduced() ? 'reduce' : 'full'
    root.style.setProperty('--scale', String(settings.textSize / 100))
    const bg = THEMES.find((t) => t.id === theme)!.bg
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
  })
  $effect(() => {
    const snapshot = $state.snapshot(settings)
    set(KEY, snapshot).catch(() => {})
  })
}
