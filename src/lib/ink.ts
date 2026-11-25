// Svelte action: ink press (docs/DESIGN.md motion #2). Sets the pointer origin for `.ink::after`.
export function ink(node: HTMLElement) {
  let timer = 0
  const down = (e: PointerEvent) => {
    const r = node.getBoundingClientRect()
    node.style.setProperty('--px', `${e.clientX - r.left}px`)
    node.style.setProperty('--py', `${e.clientY - r.top}px`)
    node.classList.remove('inking')
    void node.offsetWidth
    node.classList.add('inking')
    clearTimeout(timer)
  }
  const up = () => {
    clearTimeout(timer)
    timer = window.setTimeout(() => node.classList.remove('inking'), 180)
  }
  node.classList.add('ink')
  node.addEventListener('pointerdown', down)
  node.addEventListener('pointerup', up)
  node.addEventListener('pointercancel', up)
  node.addEventListener('pointerleave', up)
  return {
    destroy() {
      clearTimeout(timer)
      node.removeEventListener('pointerdown', down)
      node.removeEventListener('pointerup', up)
      node.removeEventListener('pointercancel', up)
      node.removeEventListener('pointerleave', up)
    },
  }
}
