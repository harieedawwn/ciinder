// Hash router (docs/ARCH.md "Routing"). Never reads location.search.
import { tick } from 'svelte'

export type Route =
  | { name: 'home' }
  | { name: 'new' }
  | { name: 'edit'; id: string }
  | { name: 'play'; id: string }
  | { name: 'result'; id: string }
  | { name: 'guide' }
  | { name: 'shared'; payload: string }

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#/, '')
  if (h.startsWith('s=')) return { name: 'shared', payload: h.slice(2) }
  const [, a = '', b = ''] = h.split('/')
  const id = decodeURIComponent(b)
  if (a === 'new') return { name: 'new' }
  if (a === 'guide') return { name: 'guide' }
  if ((a === 'edit' || a === 'play' || a === 'result') && id) return { name: a, id }
  return { name: 'home' }
}

export const router = $state({ route: parseHash(location.hash) as Route })

export const viewTransitions = 'startViewTransition' in document

type DocWithVT = Document & { startViewTransition?: (cb: () => void) => unknown }

window.addEventListener('hashchange', () => {
  const next = parseHash(location.hash)
  const doc = document as DocWithVT
  const reduce = document.documentElement.dataset.motion === 'reduce'
  if (doc.startViewTransition && !reduce) doc.startViewTransition(async () => {
      router.route = next
      await tick()
    })
  else router.route = next
})

export function go(path: string): void {
  const target = '#' + path
  if (location.hash !== target) location.hash = target
}
