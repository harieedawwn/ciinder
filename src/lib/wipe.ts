// Svelte action: adds `on` one frame after mount so a freshly shown `.hl` / `.strike` animates in.
export function wipe(node: HTMLElement) {
  const raf = requestAnimationFrame(() => requestAnimationFrame(() => node.classList.add('on')))
  return { destroy: () => cancelAnimationFrame(raf) }
}
