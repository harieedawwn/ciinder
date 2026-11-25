<script lang="ts">
  import Button from '../../ui/Button.svelte'
  import type { Player } from './player.svelte'

  let { player, onprimary }: { player: Player; onprimary: () => void } = $props()

  const checking = $derived(player.checkable)
  const label = $derived(
    checking ? 'Kiểm tra' : !player.last ? 'Câu tiếp' : player.review || player.practice ? 'Xong' : 'Nộp bài',
  )
  const disabled = $derived(checking && !player.answered(player.item.id))
</script>

<nav class="controls" aria-label="Điều hướng câu hỏi">
  <Button variant="icon" icon="back" label="Câu trước" sound={false} disabled={player.pos === 0} onclick={() => player.prev()} />
  <Button variant="primary" icon={checking || player.last ? 'check' : 'next'} sound={!checking} {disabled} onclick={onprimary}>{label}</Button>
  {#if checking}
    <Button variant="icon" icon="next" label="Câu tiếp" sound={false} disabled={player.last} onclick={() => player.next()} />
  {:else}
    <span class="spacer"></span>
  {/if}
</nav>

<style>
  .controls {
    position: sticky; bottom: 0; z-index: 5;
    display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; gap: 12px;
    padding: 12px 0 calc(12px + var(--safe-b)); background: var(--bg);
  }
  .controls :global(.primary) { width: 100%; }
  .spacer { width: 44px; }
</style>
