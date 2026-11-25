// View Transitions helper (docs/DESIGN.md "Layout v2" Transitions). Falls back to running the update directly.
import { tick } from 'svelte'
import { settings } from '../state/settings.svelte'

type Doc = Document & { startViewTransition?: (cb: () => void | Promise<void>) => { finished: Promise<void> } }

/** Run a DOM-changing update inside a view transition when supported and motion is allowed. */
export function transition(update: () => void | Promise<void>, kind?: string): Promise<void> {
  const doc = document as Doc
  const reduce = settings.reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!doc.startViewTransition || reduce) return Promise.resolve(update())
  if (kind) document.documentElement.dataset.vt = kind
  const vt = doc.startViewTransition(update)
  return vt.finished.finally(() => { delete document.documentElement.dataset.vt })
}

/** Morph: give `el` the shared name, run the update; the element on the new screen must use the same name. */
export function morph(el: HTMLElement | null, name: string, update: () => void | Promise<void>): Promise<void> {
  if (el) el.style.viewTransitionName = name
  return transition(async () => {
    if (el) el.style.viewTransitionName = ''
    await update()
    await tick()
  }, 'morph')
}

/** Theme change revealed as a circle growing from (x, y). */
export function themeReveal(x: number, y: number, update: () => void | Promise<void>): Promise<void> {
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  const root = document.documentElement
  root.style.setProperty('--vt-x', `${x}px`)
  root.style.setProperty('--vt-y', `${y}px`)
  root.style.setProperty('--vt-r', `${r}px`)
  return transition(update, 'theme')
}
