// Hash router (docs/ARCH.md "Routing"). Never reads location.search.
import { tick } from 'svelte'
import { transition } from '../lib/vt'

export type Route =
  | { name: 'home' }
  | { name: 'new' }
  | { name: 'edit'; id: string }
  | { name: 'play'; id: string }
  | { name: 'result'; id: string }
  | { name: 'review'; id: string }
  | { name: 'guide' }
  | { name: 'shared'; payload: string }

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#/, '')
  if (h.startsWith('s=')) return { name: 'shared', payload: h.slice(2) }
  const [, a = '', b = ''] = h.split('/')
  const id = decodeURIComponent(b)
  if (a === 'new') return { name: 'new' }
  if (a === 'guide') return { name: 'guide' }
  if ((a === 'edit' || a === 'play' || a === 'result' || a === 'review') && id) return { name: a, id }
  return { name: 'home' }
}

export const router = $state({ route: parseHash(location.hash) as Route })

export const viewTransitions = 'startViewTransition' in document

/** Set by a view with unsaved work: return true to block leaving (hash is restored; the view decides what to do). */
export const leaveGuard = { check: null as ((target: string) => boolean) | null }
let accepted = location.hash

window.addEventListener('hashchange', () => {
  if (location.hash === accepted) return
  if (leaveGuard.check?.(location.hash)) {
    location.hash = accepted
    return
  }
  accepted = location.hash
  const next = parseHash(location.hash)
  void transition(async () => {
    router.route = next
    await tick()
  })
})

export function go(path: string): void {
  const target = '#' + path
  if (location.hash !== target) location.hash = target
}
