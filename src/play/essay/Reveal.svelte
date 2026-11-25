<script lang="ts">
  // Đọc dần: slider (or a horizontal drag on the text, touch) reveals the answer word by word.
  import Rich from '../../render/Rich.svelte'
  import { play } from '../../lib/sound'
  import Button from '../../ui/Button.svelte'
  import { showWords, wrapWords } from './words'

  let { src, ondone }: { src: string; ondone: () => void } = $props()

  /** Pixels of horizontal drag per word. */
  const STEP = 9

  let els: HTMLElement[] = []
  let ends = $state<number[]>([])
  let total = $state(0)
  let n = $state(0)
  let applied = 0

  function onrender(root: HTMLElement) {
    const w = wrapWords(root)
    els = w.els
    ends = w.ends
    total = els.length
    applied = 0
    n = Math.min(n, total)
    showWords(els, 0, n)
    applied = n
  }

  $effect(() => {
    const to = n
    if (to === applied) return
    if (ends.some((e) => (e > applied && e <= to) || (e <= applied && e > to))) play('progress-step')
    showWords(els, applied, to)
    applied = to
    if (to === total && total) ondone()
  })

  const nextEnd = () => ends.find((e) => e > n) ?? total

  // Touch drag across the text: right reveals, left hides. Vertical drags scroll the page as usual.
  let start: { x: number; y: number; n: number; id: number } | null = null
  let dragging = false
  function down(e: PointerEvent) {
    if (e.pointerType === 'mouse') return
    start = { x: e.clientX, y: e.clientY, n, id: e.pointerId }
    dragging = false
  }
  function move(e: PointerEvent) {
    if (!start || e.pointerId !== start.id) return
    const dx = e.clientX - start.x
    if (!dragging) {
      if (Math.abs(e.clientY - start.y) > 10) return void (start = null)
      if (Math.abs(dx) < 10) return
      dragging = true
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    n = Math.max(0, Math.min(total, start.n + Math.round(dx / STEP)))
  }
  function up() {
    start = null
    dragging = false
  }
</script>

<div class="reveal">
  <div class="text" data-noswipe role="presentation" onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}>
    <Rich {src} {onrender} />
  </div>
  <div class="bar">
    <input type="range" min="0" max={total} step="1" bind:value={n} aria-label="Đọc dần" aria-valuetext="{n}/{total}" data-noswipe />
    <div class="btns">
      <Button variant="secondary" disabled={n >= total} onclick={() => (n = nextEnd())}>+1 câu</Button>
      <Button variant="quiet" disabled={n >= total} onclick={() => (n = total)}>Hiện hết</Button>
    </div>
  </div>
</div>

<style>
  .reveal { display: grid; gap: 16px; }
  .text { touch-action: pan-y; user-select: none; -webkit-user-select: none; }
  .text :global(.w:not(.on)) { color: transparent; background: var(--line); border-radius: 3px; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
  .text :global(.w.u:not(.on) > *) { opacity: 0; }
  .text :global(img.w:not(.on)) { opacity: 0.15; }
  .text :global(a .w:not(.on)) { text-decoration-color: transparent; }
  .bar { display: grid; gap: 8px; }
  .btns { display: flex; flex-wrap: wrap; gap: 8px; }
  input[type='range'] { width: 100%; height: 40px; accent-color: var(--accent); touch-action: pan-x; }
</style>
