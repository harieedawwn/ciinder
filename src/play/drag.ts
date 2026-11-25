// Pointer drag (touch, mouse, pen; no library). Svelte action: the node follows the pointer via transform,
// the page auto-scrolls near the viewport edges, and a click right after a drag is swallowed.
// Callers find drop targets with `dropTarget(x, y)` (elements marked `data-drop`).

export interface DragOptions {
  disabled?: boolean
  /** Element that starts the drag (defaults to the node). Gets `touch-action: none`. */
  handle?: (node: HTMLElement) => HTMLElement | null | undefined
  onstart?: () => void
  /** Called every frame while dragging with the pointer position (client coords). */
  onmove?: (x: number, y: number) => void
  /** `cancelled` when the pointer was lost (pointercancel). */
  onend?: (x: number, y: number, cancelled: boolean) => void
}

const THRESHOLD = 6
const EDGE = 64
const MAX_SPEED = 18

export function dropTarget(x: number, y: number): HTMLElement | null {
  return (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>('[data-drop]') ?? null
}

export function drag(node: HTMLElement, initial: DragOptions) {
  let opts = initial
  let id = -1
  let started = false
  let startX = 0
  let startY = 0
  let x = 0
  let y = 0
  /** Pointer offset inside the node's untransformed box. */
  let grabX = 0
  let grabY = 0
  let tx = 0
  let ty = 0
  let raf = 0
  let handleEl: HTMLElement = node

  const bindHandle = () => {
    const next = opts.handle?.(node) ?? node
    if (next === handleEl && next.style.touchAction === 'none') return
    handleEl.removeEventListener('pointerdown', down)
    handleEl = next
    handleEl.style.touchAction = 'none'
    handleEl.addEventListener('pointerdown', down)
  }

  function down(e: PointerEvent) {
    if (opts.disabled || id !== -1 || (e.pointerType === 'mouse' && e.button !== 0)) return
    id = e.pointerId
    startX = x = e.clientX
    startY = y = e.clientY
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancel)
  }

  function begin() {
    started = true
    const r = node.getBoundingClientRect()
    grabX = startX - r.left
    grabY = startY - r.top
    tx = ty = 0
    node.classList.add('dragging')
    document.documentElement.classList.add('drag-active')
    getSelection()?.removeAllRanges()
    try {
      handleEl.setPointerCapture(id)
    } catch {
      // Pointer already gone.
    }
    opts.onstart?.()
    raf = requestAnimationFrame(frame)
  }

  function move(e: PointerEvent) {
    if (e.pointerId !== id) return
    x = e.clientX
    y = e.clientY
    if (!started && Math.hypot(x - startX, y - startY) > THRESHOLD) begin()
    if (started) e.preventDefault()
  }

  /** Re-measures every frame, so the node stays under the pointer through scrolling and list reorders. */
  function frame() {
    const speed = y < EDGE ? -(EDGE - y) / EDGE : y > innerHeight - EDGE ? (y - (innerHeight - EDGE)) / EDGE : 0
    if (speed) window.scrollBy(0, Math.round(speed * MAX_SPEED))
    const r = node.getBoundingClientRect()
    tx = x - grabX - (r.left - tx)
    ty = y - grabY - (r.top - ty)
    node.style.transform = `translate3d(${tx}px, ${ty}px, 0)`
    opts.onmove?.(x, y)
    raf = requestAnimationFrame(frame)
  }

  function finish(cancelled: boolean) {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    window.removeEventListener('pointercancel', cancel)
    cancelAnimationFrame(raf)
    const was = started
    id = -1
    started = false
    if (!was) return
    node.classList.remove('dragging')
    document.documentElement.classList.remove('drag-active')
    node.style.transform = ''
    // Swallow the click that follows a drag.
    window.addEventListener('click', swallow, { capture: true, once: true })
    setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0)
    opts.onend?.(x, y, cancelled)
  }

  const up = (e: PointerEvent) => e.pointerId === id && finish(false)
  const cancel = (e: PointerEvent) => e.pointerId === id && finish(true)
  const swallow = (e: Event) => {
    e.stopPropagation()
    e.preventDefault()
  }

  bindHandle()

  return {
    update(next: DragOptions) {
      opts = next
      bindHandle()
    },
    destroy() {
      if (id !== -1) finish(true)
      handleEl.removeEventListener('pointerdown', down)
    },
  }
}
