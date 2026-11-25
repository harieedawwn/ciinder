<script lang="ts">
  import Rich from '../render/Rich.svelte'
  import { groupTray } from '../core/attempt'
  import type { GroupItem } from '../core/types'
  import { play } from '../lib/sound'
  import { drag, dropTarget } from './drag'
  import type { KindProps } from './registry'

  let { item, answer, onanswer, seed, locked, reveal }: KindProps<GroupItem> = $props()

  type Spot = number | null
  const tray = $derived(groupTray(item, seed))
  const placements = $derived(answer?.kind === 'group' ? answer.placements : item.groups.map((g) => g.items.map((): Spot => null)))
  const at = (g: number, i: number): Spot => placements[g]?.[i] ?? null
  const key = (g: number, i: number) => `${g}:${i}`

  let picked = $state<string | null>(null)
  /** Drop zone under the dragged chip: group index, 'tray', or null. */
  let hover = $state<number | 'tray' | null>(null)

  function toggle(g: number, i: number) {
    if (locked) return
    const k = key(g, i)
    picked = picked === k ? null : k
    play(picked ? 'select' : 'deselect')
  }

  function put(g: number, i: number, spot: Spot) {
    picked = null
    if (at(g, i) === spot) return
    const next = placements.map((row) => row.slice())
    next[g][i] = spot
    play('drop')
    onanswer({ kind: 'group', placements: next })
  }

  function putPicked(spot: Spot) {
    if (locked || !picked) return
    const [g, i] = picked.split(':').map(Number)
    put(g, i, spot)
  }

  const zone = (x: number, y: number): number | 'tray' | null => {
    const v = dropTarget(x, y)?.dataset.drop
    return v === undefined ? null : v === 'tray' ? 'tray' : Number(v)
  }

  /** Keys 1–9: with a chip picked, place it in group n; otherwise pick the n-th tray chip. */
  export function choose(n: number) {
    if (picked) {
      if (n <= item.groups.length) putPicked(n - 1)
      return
    }
    const free = tray.filter(([g, i]) => at(g, i) === null)[n - 1]
    if (free) toggle(free[0], free[1])
  }
</script>

{#snippet chip(g: number, i: number)}
  {@const spot = at(g, i)}
  {@const good = reveal && spot === g}
  {@const bad = reveal && spot !== g}
  <button
    class="chip"
    class:sel={picked === key(g, i)}
    class:good
    class:bad
    class:shake={bad}
    aria-pressed={picked === key(g, i)}
    aria-disabled={locked}
    onclick={() => toggle(g, i)}
    use:drag={{
      disabled: locked,
      onstart: () => ((picked = null), play('drag-start')),
      onmove: (x, y) => (hover = zone(x, y)),
      onend: (x, y, cancelled) => {
        const z = cancelled ? null : zone(x, y)
        hover = null
        if (z !== null) put(g, i, z === 'tray' ? null : z)
      },
    }}
  >
    <span class:strike={bad} class:on={reveal}><Rich inline src={item.groups[g].items[i]} /></span>
    {#if bad}<span class="fix"><span class="hl" class:on={reveal}><Rich inline src={item.groups[g].name} /></span></span>{/if}
  </button>
{/snippet}

<!-- Zones are also tap targets for a picked chip; their keyboard path is the zone title button. -->
<div class="zones" class:armed={picked !== null}>
  {#each item.groups as grp, b (b)}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="box" class:over={hover === b} data-drop={b} onclick={(e) => e.target === e.currentTarget && putPicked(b)}>
      <button class="name" aria-disabled={locked || !picked} onclick={() => putPicked(b)}>
        <span class="key">{b + 1}</span><Rich inline src={grp.name} />
      </button>
      <div class="chips">
        {#each tray as [g, i] (key(g, i))}
          {#if at(g, i) === b}{@render chip(g, i)}{/if}
        {/each}
      </div>
    </div>
  {/each}
</div>

{#if !locked || tray.some(([g, i]) => at(g, i) === null)}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="tray chips" class:over={hover === 'tray'} data-drop="tray" aria-label="Chưa xếp" onclick={(e) => e.target === e.currentTarget && putPicked(null)}>
    {#each tray as [g, i] (key(g, i))}
      {#if at(g, i) === null}{@render chip(g, i)}{/if}
    {/each}
  </div>
{/if}

<style>
  .zones { display: grid; gap: 8px; }
  @container card (min-width: 520px) { .zones { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); } }
  .box {
    display: grid; gap: 8px; align-content: start; min-height: 96px; padding: 8px;
    border: 1px solid var(--line); border-radius: var(--r-ctl); background: var(--bg);
    transition: border-color var(--t-std) var(--ease-out);
  }
  .armed .box { border-style: dashed; border-color: var(--accent); }
  .box.over, .tray.over { border-color: var(--accent); background: var(--accent-soft); }
  .name {
    display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 6px;
    text-align: left; font-weight: 600; border-radius: var(--r-chip);
  }
  .name[aria-disabled='true'] { cursor: default; }
  .key {
    flex: none; display: grid; place-items: center; width: 22px; height: 22px;
    border-radius: 50%; border: 1px solid var(--line); font-size: var(--fs-xs); color: var(--muted);
  }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .tray { min-height: 56px; padding: 8px; border: 1px dashed var(--line); border-radius: var(--r-ctl); }
  .chip {
    display: grid; gap: 2px; min-height: 40px; max-width: 100%; padding: 8px 12px; text-align: left;
    border: 1px solid var(--line); border-radius: var(--r-chip); background: var(--raised); box-shadow: var(--shadow);
    font-size: var(--fs-md); line-height: 1.35; overflow-wrap: anywhere; cursor: grab;
    user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
    transition: border-color var(--t-std) var(--ease-out);
  }
  .chip.sel { border-color: var(--accent); box-shadow: inset 2px 0 0 0 var(--accent); }
  .chip.good { border-color: var(--good); }
  .chip.bad { border-color: var(--bad); box-shadow: inset 2px 0 0 0 var(--bad); }
  .chip[aria-disabled='true'] { cursor: default; }
  .fix { font-size: var(--fs-sm); }
  @media (hover: hover) {
    .chip:not([aria-disabled='true']):hover { border-color: var(--muted); }
    .chip.sel:hover { border-color: var(--accent); }
    .armed .name:hover { background: var(--accent-soft); }
  }
</style>
