<script lang="ts">
  import { deal, leave } from './deal'
  import ItemView from './ItemView.svelte'
  import type { Player } from './player.svelte'

  let { player }: { player: Player } = $props()

  const behind = $derived(Math.min(2, player.items.length - 1 - player.pos))

  // Horizontal swipe navigates, unless it starts on a control or the user is selecting/scrolling.
  const CONTROL = 'button, input, textarea, select, a, label, [role="radio"], [role="checkbox"]'
  let sx = 0
  let sy = 0
  let tracking = false

  function down(e: PointerEvent) {
    tracking = e.pointerType === 'touch' && !(e.target as Element).closest(CONTROL)
    sx = e.clientX
    sy = e.clientY
  }
  function up(e: PointerEvent) {
    if (!tracking) return
    tracking = false
    const dx = e.clientX - sx
    const dy = e.clientY - sy
    if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.6) return
    if (dx < 0) player.next()
    else player.prev()
  }
</script>

<div class="deck" onpointerdown={down} onpointerup={up} onpointercancel={() => (tracking = false)} role="presentation">
  {#if behind > 1}<div class="edge e2" aria-hidden="true"></div>{/if}
  {#if behind > 0}<div class="edge e1" aria-hidden="true"></div>{/if}
  {#key player.item.id}
    <div class="slot" in:deal={{ dir: player.dir }} out:leave={{ dir: player.dir }}>
      <ItemView {player} item={player.item} />
    </div>
  {/key}
</div>

<style>
  .deck { display: grid; align-content: start; position: relative; touch-action: pan-y; padding-bottom: 10px; }
  .slot, .edge { grid-area: 1 / 1; }
  .slot { position: relative; z-index: 1; min-width: 0; }
  .edge {
    align-self: end; height: 40px; border-radius: var(--r-card); border: 1px solid var(--line); background: var(--surface);
  }
  .e1 { transform: translate3d(0, 5px, 0) scale(0.97); }
  .e2 { transform: translate3d(0, 10px, 0) scale(0.94); }
</style>
