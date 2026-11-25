<script lang="ts">
  import Button from '../../ui/Button.svelte'
  import Sheet from '../../ui/Sheet.svelte'
  import type { Player } from './player.svelte'

  let { player, open = $bindable(false), onsubmit }: { player: Player; open?: boolean; onsubmit: () => void } = $props()

  function state(id: string): string {
    const s = player.shown(id)
    if (s !== undefined) return s === 1 ? 'good' : 'bad'
    return player.answered(id) ? 'done' : ''
  }

  function pick(i: number) {
    open = false
    player.moveTo(i)
  }
</script>

<Sheet bind:open title="Danh sách câu">
  <div class="grid">
    {#each player.items as it, i (it.id)}
      <button class="cell num {state(it.id)}" class:current={i === player.pos} aria-current={i === player.pos} onclick={() => pick(i)}>{i + 1}</button>
    {/each}
  </div>
  {#if !player.review}
    <div class="foot">
      <Button variant="primary" icon="check" onclick={() => { open = false; onsubmit() }}>{player.practice ? 'Xong' : 'Nộp bài'}</Button>
    </div>
  {/if}
</Sheet>

<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)); gap: 8px; }
  .cell {
    height: 44px; border-radius: var(--r-chip); border: 1px solid var(--line); background: var(--raised);
    font-weight: 500; color: var(--muted);
  }
  .cell.done { background: var(--accent-soft); color: var(--ink); border-color: transparent; }
  .cell.good { background: var(--good-soft); color: var(--good); border-color: transparent; }
  .cell.bad { background: var(--bad-soft); color: var(--bad); border-color: transparent; }
  .cell.current { box-shadow: inset 0 0 0 2px var(--accent); color: var(--ink); }
  .foot { display: grid; margin-top: 20px; }
</style>
