<script lang="ts">
  import { deal, leave } from './deal'
  import ItemView from './ItemView.svelte'
  import type { Player } from './player.svelte'

  let { player }: { player: Player } = $props()

  // Horizontal swipe navigates, unless it starts on a control or the user is selecting/scrolling.
  const CONTROL = 'button, input, textarea, select, a, label, [role="radio"], [role="checkbox"], [data-noswipe]'
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
  {#key player.item.id}
    <div class="slot" in:deal={{ dir: player.dir }} out:leave={{ dir: player.dir }}>
      <ItemView {player} item={player.item} />
    </div>
  {/key}
</div>

<style>
  .deck { display: grid; grid-template-columns: minmax(0, 1fr); align-content: start; position: relative; touch-action: pan-y; padding: 0 10px 12px 0; }
  .slot { grid-area: 1 / 1; position: relative; z-index: 1; min-width: 0; }
</style>
