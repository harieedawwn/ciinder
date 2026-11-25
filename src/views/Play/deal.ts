// Card deal transitions (docs/DESIGN.md motion #1). Transform + opacity only; reduced motion → short fade.
import type { TransitionConfig } from 'svelte/transition'

const SPRING: [number, number][] = [[0, 0], [0.07, 0.5], [0.15, 0.86], [0.24, 1.02], [0.3, 1.04], [0.41, 1.01], [1, 1]]

/** JS twin of the CSS --spring linear() curve. */
export function spring(t: number): number {
  for (let i = 1; i < SPRING.length; i++) {
    const [x1, y1] = SPRING[i]
    if (t <= x1) {
      const [x0, y0] = SPRING[i - 1]
      return y0 + ((t - x0) / (x1 - x0)) * (y1 - y0)
    }
  }
  return 1
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const reduced = () => document.documentElement.dataset.motion === 'reduce'

/** Leaving card: up and away to the side of travel (−dir), slight rotation, fade. */
export function leave(_: Element, { dir }: { dir: number }): TransitionConfig {
  if (reduced()) return { duration: 120, css: (t) => `opacity:${t}` }
  return {
    duration: 220,
    easing: easeOut,
    css: (t, u) => `transform:translate3d(${-24 * dir * u}px,${-12 * u}px,0) rotate(${-2 * dir * u}deg);opacity:${t}`,
  }
}

/** Arriving card: rises from the stack beneath. */
export function deal(_: Element, { dir }: { dir: number }): TransitionConfig {
  if (reduced()) return { duration: 120, css: (t) => `opacity:${t}` }
  return {
    duration: 360,
    delay: dir > 0 ? 40 : 0,
    easing: spring,
    css: (t, u) => `transform:translate3d(0,${12 * u}px,0) scale(${0.97 + 0.03 * t});opacity:${Math.min(1, t * 2)}`,
  }
}
