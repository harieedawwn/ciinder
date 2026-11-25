// UI sounds via Web Audio (docs/DESIGN.md "Sound"). Only the selected pack is fetched, after the first gesture.
import { settings, type SoundPack } from '../state/settings.svelte'

export type Cue =
  | 'press' | 'select' | 'deselect' | 'check' | 'error' | 'forward' | 'back' | 'expand' | 'collapse'
  | 'snap' | 'drag-start' | 'drop' | 'reorder' | 'toggle-on' | 'toggle-off' | 'open' | 'close'
  | 'streak' | 'complete' | 'achievement' | 'success' | 'copy' | 'progress-step'

const MASTER = 0.5
const GAIN: Record<Cue, number> = {
  press: 0.35, select: 0.5, deselect: 0.4, check: 0.7, error: 0.45, forward: 0.4, back: 0.4, expand: 0.45,
  collapse: 0.35, snap: 0.55, 'drag-start': 0.4, drop: 0.4, reorder: 0.4, 'toggle-on': 0.4, 'toggle-off': 0.4,
  open: 0.35, close: 0.35, streak: 0.5, complete: 0.6, achievement: 0.6, success: 0.6, copy: 0.5,
  'progress-step': 0.25,
}
/** Minimum ms between two plays of the same cue. */
const THROTTLE: Partial<Record<Cue, number>> = { press: 60, error: 400, 'progress-step': 120 }

let ctx: AudioContext | null = null
let master: GainNode | null = null
let loadedPack: SoundPack | null = null
let buffers = new Map<Cue, AudioBuffer>()
const pending = new Map<Cue, Promise<AudioBuffer | null>>()
const lastPlayed = new Map<Cue, number>()

type WinAudio = typeof window & { webkitAudioContext?: typeof AudioContext }

/** Create/resume the AudioContext. Must run inside a user gesture (first pointerdown). */
export function unlockAudio(): void {
  if (settings.sound === 'off') return
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as WinAudio).webkitAudioContext
    if (!Ctor) return
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = MASTER
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
}

/** Drop buffers of a previous pack when the setting changed. */
function syncPack(): void {
  if (loadedPack === settings.sound) return
  loadedPack = settings.sound
  buffers = new Map()
  pending.clear()
}

function load(cue: Cue): Promise<AudioBuffer | null> {
  const pack = settings.sound
  if (!ctx || pack === 'off') return Promise.resolve(null)
  syncPack()
  const hit = buffers.get(cue)
  if (hit) return Promise.resolve(hit)
  let p = pending.get(cue)
  if (!p) {
    const audio = ctx
    p = fetch(`${import.meta.env.BASE_URL}sfx/${pack}/${cue}.mp3`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((data) => audio.decodeAudioData(data))
      .then((buf) => {
        if (loadedPack === pack) buffers.set(cue, buf)
        return buf
      })
      .catch(() => null)
      .finally(() => pending.delete(cue))
    pending.set(cue, p)
  }
  return p
}

/** Warm the common cues so the first taps are instant. */
export function preloadSounds(): void {
  for (const c of ['press', 'select', 'deselect', 'check', 'error', 'forward', 'back', 'open', 'close'] as Cue[]) void load(c)
}

export function play(cue: Cue): void {
  if (settings.sound === 'off' || !ctx || !master) return
  const now = performance.now()
  const gap = THROTTLE[cue]
  if (gap && now - (lastPlayed.get(cue) ?? -Infinity) < gap) return
  lastPlayed.set(cue, now)
  syncPack()
  const buf = buffers.get(cue)
  if (buf) start(buf, cue)
  else void load(cue).then((b) => b && performance.now() - now < 250 && start(b, cue))
}

function start(buf: AudioBuffer, cue: Cue): void {
  if (!ctx || !master) return
  const src = ctx.createBufferSource()
  const g = ctx.createGain()
  g.gain.value = GAIN[cue]
  src.buffer = buf
  src.connect(g).connect(master)
  src.start()
}
