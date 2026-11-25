<script lang="ts">
  import type { SetEntry } from '../../state/library.svelte'
  import { tiltFor } from '../../ui/desk'
  import Fingerprint from '../../ui/Fingerprint.svelte'
  import IndexCard from '../../ui/IndexCard.svelte'
  import Mark from '../../ui/Mark.svelte'
  import Menu, { type MenuItem } from '../../ui/Menu.svelte'
  import { setPrint, type Print } from './print'

  let { entry, actions, index, onopen }: { entry: SetEntry; actions: MenuItem[]; index: number; onopen: (el: HTMLElement | null) => void } = $props()

  let slot = $state<HTMLElement | null>(null)
  const pct = $derived(entry.lastScore === undefined ? undefined : Math.round(entry.lastScore * 100))
  let print = $state<Print | null>(null)
  $effect(() => {
    const id = entry.id
    void entry.lastScore
    void setPrint(id).then((p) => { if (entry.id === id) print = p })
  })
  const unfinished = $derived(!!print && print.done.some((d) => !d))
</script>

<div class="slot" bind:this={slot} style="--tilt:{tiltFor(entry.id)}; --i:{index}">
  <IndexCard class="tilt press fall {unfinished ? 'stack' : ''}">
    <button class="main" onclick={() => onopen(slot)}>
      <h2>{entry.title}</h2>
      <p class="meta">
        {#if entry.subject}<span>{entry.subject}</span>{/if}
        <span class="num">{entry.count} câu</span>
      </p>
      {#if print}<Fingerprint kinds={print.kinds} done={print.done} />{/if}
      {#if pct !== undefined}<span class="score num"><Mark on strong>{pct}%</Mark></span>{/if}
    </button>
    <div class="more"><Menu items={actions} label="Tùy chọn" /></div>
  </IndexCard>
</div>

<style>
  .slot { position: relative; }
  .slot:has(:global([aria-expanded="true"])) { z-index: 2; }
  .slot :global(.card) { height: 100%; }
  .main { display: grid; width: 100%; text-align: left; gap: 8px; padding: 0 36px 0 0; color: inherit; align-content: start; }
  h2 { font-size: 1.25rem; font-weight: 600; line-height: 1.25; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .meta { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: var(--fs-sm); color: var(--muted); }
  .score { font-size: var(--fs-sm); font-weight: 600; justify-self: start; margin-left: 4px; }
  .more { position: absolute; top: 6px; right: 4px; }
</style>
