// UI sounds synthesized with Web Audio (docs/DESIGN.md "Sound"). No audio files: every cue is built from
// two layers — a 2–5 ms band-passed noise "tick" (the contact) and a short pitch-dropping triangle "body"
// (the thock). Short, dry, low-mid: solid and tactile, never chimey. Works offline and in the standalone file.
import { settings } from '../state/settings.svelte'

export type Cue =
  | 'press' | 'select' | 'deselect' | 'check' | 'error' | 'forward' | 'back' | 'expand' | 'collapse'
  | 'snap' | 'drag-start' | 'drop' | 'reorder' | 'toggle-on' | 'toggle-off' | 'open' | 'close'
  | 'streak' | 'complete' | 'achievement' | 'success' | 'copy' | 'progress-step'

/** Minimum ms between two plays of the same cue. */
const THROTTLE: Partial<Record<Cue, number>> = { press: 45, error: 400, 'progress-step': 110, reorder: 60 }

let ctx: AudioContext | null = null
let out: AudioNode | null = null
let noise: AudioBuffer | null = null
const lastPlayed = new Map<Cue, number>()

type WinAudio = typeof window & { webkitAudioContext?: typeof AudioContext }

/** Create/resume the AudioContext. Must run inside a user gesture (first pointerdown). */
export function unlockAudio(): void {
  if (!settings.sound) return
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as WinAudio).webkitAudioContext
    if (!Ctor) return
    ctx = new Ctor({ latencyHint: 'interactive' })
    // master: gentle top cut (no harsh highs) → light compression (keeps clicks dense and even)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 7000
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.ratio.value = 4
    comp.attack.value = 0.001
    comp.release.value = 0.08
    const master = ctx.createGain()
    master.gain.value = 0.55
    lp.connect(comp).connect(master).connect(ctx.destination)
    out = lp
    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate)
    const d = noise.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  if (ctx.state === 'suspended') void ctx.resume()
}

/** Kept for API compatibility: synthesized cues need no preloading. */
export function preloadSounds(): void {}

interface Tick { freq: number; q?: number; dur?: number; gain: number }
interface Body { freq: number; drop?: number; decay: number; gain: number; tone?: number }

/** Contact transient: very short band-passed noise. */
function tick(t: number, k: Tick): void {
  if (!ctx || !out || !noise) return
  const src = ctx.createBufferSource()
  src.buffer = noise
  src.playbackRate.value = 0.9 + Math.random() * 0.2
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = k.freq
  bp.Q.value = k.q ?? 0.9
  const g = ctx.createGain()
  const dur = k.dur ?? 0.004
  g.gain.setValueAtTime(k.gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(bp).connect(g).connect(out)
  src.start(t, Math.random() * 0.2, dur + 0.01)
}

/** Body: triangle with a fast downward pitch blip, low-passed, exponential decay. */
function body(t: number, b: Body): void {
  if (!ctx || !out) return
  const f = b.freq * (0.97 + Math.random() * 0.06) // small variation so repeats don't feel robotic
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(f * (b.drop ?? 1.5), t)
  osc.frequency.exponentialRampToValueAtTime(f, t + 0.012)
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = b.tone ?? 1800
  lp.Q.value = 0.7
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(b.gain, t + 0.0015)
  g.gain.exponentialRampToValueAtTime(0.0001, t + b.decay)
  osc.connect(lp).connect(g).connect(out)
  osc.start(t)
  osc.stop(t + b.decay + 0.02)
}

/** One "thock" = tick + body. */
function thock(t: number, freq: number, decay: number, gain: number, tickFreq = 2600, tone?: number): void {
  tick(t, { freq: tickFreq, gain: gain * 0.55 })
  body(t, { freq, decay, gain, tone })
}

/** Filtered noise sweep (card sliding). */
function sweep(t: number, from: number, to: number, dur: number, gain: number): void {
  if (!ctx || !out || !noise) return
  const src = ctx.createBufferSource()
  src.buffer = noise
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 1.4
  bp.frequency.setValueAtTime(from, t)
  bp.frequency.exponentialRampToValueAtTime(to, t + dur)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(gain, t + dur * 0.35)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(bp).connect(g).connect(out)
  src.start(t, 0, dur + 0.02)
}

const RECIPES: Record<Cue, (t: number) => void> = {
  press: (t) => thock(t, 190, 0.045, 0.55),
  select: (t) => thock(t, 250, 0.06, 0.6, 3000),
  deselect: (t) => thock(t, 200, 0.04, 0.4, 2400),
  check: (t) => { thock(t, 330, 0.07, 0.55, 3200); thock(t + 0.065, 495, 0.11, 0.5, 3600, 2600) },
  error: (t) => { thock(t, 150, 0.07, 0.6, 1400, 900); thock(t + 0.08, 118, 0.09, 0.5, 1200, 800) },
  forward: (t) => { sweep(t, 700, 2200, 0.09, 0.12); thock(t + 0.06, 220, 0.04, 0.35) },
  back: (t) => { sweep(t, 2200, 700, 0.09, 0.12); thock(t + 0.06, 200, 0.04, 0.35) },
  expand: (t) => { sweep(t, 900, 2600, 0.07, 0.09); thock(t + 0.03, 280, 0.04, 0.35, 3200) },
  collapse: (t) => { sweep(t, 2600, 900, 0.07, 0.08); thock(t + 0.03, 210, 0.035, 0.3) },
  open: (t) => { sweep(t, 600, 1800, 0.12, 0.1); thock(t + 0.05, 200, 0.05, 0.35) },
  close: (t) => { sweep(t, 1800, 600, 0.1, 0.09); thock(t + 0.04, 170, 0.05, 0.35) },
  snap: (t) => { tick(t, { freq: 4200, q: 1.2, dur: 0.003, gain: 0.6 }); body(t, { freq: 420, decay: 0.035, gain: 0.5, tone: 2600 }) },
  'drag-start': (t) => thock(t, 170, 0.035, 0.35, 2000),
  drop: (t) => thock(t, 140, 0.075, 0.6, 1800, 1200),
  reorder: (t) => thock(t, 300, 0.025, 0.25, 3400),
  'toggle-on': (t) => thock(t, 300, 0.045, 0.45, 3200),
  'toggle-off': (t) => thock(t, 210, 0.045, 0.4, 2400),
  copy: (t) => { thock(t, 260, 0.04, 0.45, 3000); thock(t + 0.05, 350, 0.05, 0.4, 3400) },
  'progress-step': (t) => body(t, { freq: 520, decay: 0.018, gain: 0.14, tone: 3000 }),
  streak: (t) => [330, 415, 495].forEach((f, i) => thock(t + i * 0.055, f, 0.08, 0.45, 3400, 2600)),
  complete: (t) => [262, 330, 392].forEach((f, i) => thock(t + i * 0.07, f, 0.16, 0.42, 3000, 2400)),
  success: (t) => [330, 392, 495].forEach((f, i) => thock(t + i * 0.06, f, 0.14, 0.42, 3200, 2600)),
  achievement: (t) => [330, 415, 495, 660].forEach((f, i) => thock(t + i * 0.06, f, 0.16, 0.42, 3400, 2800)),
}

export function play(cue: Cue): void {
  if (!settings.sound || !ctx || !out) return
  const now = performance.now()
  const gap = THROTTLE[cue]
  if (gap && now - (lastPlayed.get(cue) ?? -Infinity) < gap) return
  lastPlayed.set(cue, now)
  if (ctx.state === 'suspended') void ctx.resume()
  RECIPES[cue](ctx.currentTime + 0.005)
}
