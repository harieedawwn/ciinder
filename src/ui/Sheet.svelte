<script lang="ts">
  // Bottom sheet on phones, centered dialog ≥ 600px. Native <dialog> gives focus trap + top layer.
  import type { Snippet } from 'svelte'
  import { play } from '../lib/sound'
  import Button from './Button.svelte'

  let { open = $bindable(false), title, vtName, children }: { open?: boolean; title: string; vtName?: string; children: Snippet } = $props()

  let dialog: HTMLDialogElement
  let panel: HTMLDivElement
  let shown = $state(false)
  let morphed = $state(false)
  let dragY = $state(0)
  let dragging = $state(false)
  let startY = 0
  let startT = 0
  let closeTimer = 0

  $effect(() => {
    if (open && !dialog.open) {
      clearTimeout(closeTimer)
      dialog.showModal()
      dialog.dataset.sheetOpen = ''
      play('open')
      morphed = document.documentElement.dataset.vt === 'morph'
      if (morphed) shown = true
      else requestAnimationFrame(() => requestAnimationFrame(() => (shown = true)))
    } else if (!open && dialog.open) {
      shown = false
      play('close')
      const ms = parseFloat(getComputedStyle(panel).transitionDuration) * 1000 || 0
      closeTimer = window.setTimeout(finish, ms + 20)
    }
  })

  $effect(() => () => clearTimeout(closeTimer))

  function finish() {
    if (!dialog) return
    dialog.close()
    delete dialog.dataset.sheetOpen
    dragY = 0
  }

  function cancel(e: Event) {
    e.preventDefault()
    open = false
  }

  function backdrop(e: MouseEvent) {
    if (e.target === dialog) open = false
  }

  function down(e: PointerEvent) {
    if (e.button !== 0 || innerWidth >= 600) return
    dragging = true
    startY = e.clientY
    startT = performance.now()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  function move(e: PointerEvent) {
    if (dragging) dragY = Math.max(0, e.clientY - startY)
  }
  function up() {
    if (!dragging) return
    dragging = false
    const v = dragY / Math.max(1, performance.now() - startT)
    if (dragY > 120 || (dragY > 24 && v > 0.6)) open = false
    else dragY = 0
  }
</script>

<dialog bind:this={dialog} class="sheet" class:shown aria-label={title} oncancel={cancel} onclick={backdrop}>
  <div
    bind:this={panel}
    class="panel"
    class:dragging
    class:pull-in={shown && !morphed}
    style:view-transition-name={vtName}
    style:transform={dragY ? `translate3d(0, ${dragY}px, 0)` : undefined}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions (drag-to-close is a pointer extra; Esc and the close button cover keyboards) -->
    <header onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}>
      <span class="handle" aria-hidden="true"></span>
      <h2>{title}</h2>
      <Button variant="icon" icon="close" label="Đóng" sound={false} onclick={() => (open = false)} />
    </header>
    <div class="body">{@render children()}</div>
  </div>
</dialog>

<style>
  .sheet {
    position: fixed; inset: 0; width: 100%; max-width: none; height: 100%; max-height: none;
    margin: 0; padding: 0; border: 0; background: transparent; color: var(--ink);
    display: flex; align-items: flex-end; justify-content: center; overflow: hidden;
  }
  .sheet:not([open]) { display: none; }
  .sheet::backdrop { background: var(--scrim); opacity: 0; transition: opacity var(--t-std) var(--ease-out); }
  .sheet.shown::backdrop { opacity: 1; }
  .panel {
    width: 100%; max-height: calc(100dvh - 48px - var(--safe-t));
    display: flex; flex-direction: column;
    position: relative; background: var(--surface); border-radius: var(--r-sheet) var(--r-sheet) 0 0;
    padding-bottom: var(--safe-b);
    transform: translate3d(0, 100%, 0);
    transition: transform var(--t-large) var(--ease-out);
  }
  .shown .panel { transform: none; }
  .panel::before {
    content: ''; position: absolute; top: 0; bottom: 0; left: 14px; width: 1px; background: var(--accent-soft);
    pointer-events: none;
  }
  .panel.dragging { transition: none; }
  header {
    position: relative; display: flex; align-items: center; gap: 8px;
    padding: 16px 8px 4px 30px; touch-action: none; user-select: none;
  }
  h2 { flex: 1; font-size: var(--fs-lg); }
  .handle {
    position: absolute; top: 6px; left: 50%; width: 36px; height: 4px; margin-left: -18px;
    border-radius: 2px; background: var(--line);
  }
  .body { overflow-y: auto; overscroll-behavior: contain; padding: 8px 20px 24px 30px; padding-left: max(30px, var(--safe-l)); padding-right: max(20px, var(--safe-r)); }
  @media (min-width: 600px) {
    .sheet { align-items: center; }
    .panel {
      width: min(520px, calc(100% - 48px)); max-height: min(720px, calc(100dvh - 64px));
      border-radius: var(--r-sheet); border: 1px solid var(--line); padding-bottom: 0;
      opacity: 0; transform: none; transition: opacity var(--t-std) var(--ease-out);
    }
    .shown .panel { opacity: 1; }
    .panel::before { left: 18px; }
    .body { padding-left: 36px; }
    header { padding-left: 36px; }
    header { padding-top: 12px; touch-action: auto; }
    .handle { display: none; }
  }
</style>
