<script lang="ts">
  import Rich from '../render/Rich.svelte'
  import { tick } from 'svelte'
  import { flip } from 'svelte/animate'
  import { cubicOut } from 'svelte/easing'
  import { orderStart } from '../core/attempt'
  import type { OrderItem } from '../core/types'
  import { play } from '../lib/sound'
  import { motionReduced } from '../state/settings.svelte'
  import Icon from '../ui/Icon.svelte'
  import { drag } from './drag'
  import type { KindProps } from './registry'

  let { item, answer, onanswer, seed, locked, reveal }: KindProps<OrderItem> = $props()

  const seq = $derived(answer?.kind === 'order' ? answer.sequence : orderStart(item, seed))
  let list = $state<HTMLOListElement>()
  let dragging = $state<number | null>(null)

  function place(oi: number, to: number) {
    const from = seq.indexOf(oi)
    if (locked || from === to || to < 0 || to >= seq.length) return
    const next = seq.slice()
    next.splice(from, 1)
    next.splice(to, 0, oi)
    play('reorder')
    onanswer({ kind: 'order', sequence: next })
  }

  async function step(oi: number, d: -1 | 1) {
    place(oi, seq.indexOf(oi) + d)
    await tick()
    const row = list?.querySelector(`[data-row="${oi}"]`)
    const btn = row?.querySelector<HTMLButtonElement>(`[data-dir="${d}"]:not(:disabled)`) ?? row?.querySelector<HTMLButtonElement>('[data-dir]:not(:disabled)')
    btn?.focus()
  }

  /** Live reorder: the dragged row takes the slot whose rows' midpoints are above the pointer. */
  function over(oi: number, y: number) {
    if (!list) return
    let to = 0
    for (const el of list.querySelectorAll<HTMLElement>('[data-row]')) {
      if (Number(el.dataset.row) === oi) continue
      const r = el.getBoundingClientRect()
      if (y > r.top + r.height / 2) to++
    }
    place(oi, to)
  }

  const motion = (oi: number) => ({ duration: dragging === oi || motionReduced() ? 0 : 220, easing: cubicOut })
</script>

<ol class="rows" class:locked bind:this={list} aria-label="Thứ tự">
  {#each seq as oi, pos (oi)}
    {@const good = reveal && oi === pos}
    {@const bad = reveal && oi !== pos}
    <li
      class="row"
      class:good
      class:bad
      class:shake={bad}
      data-row={oi}
      animate:flip={motion(oi)}
      use:drag={{
        disabled: locked,
        handle: (n) => n.querySelector<HTMLElement>('.grip'),
        onstart: () => ((dragging = oi), play('drag-start')),
        onmove: (_, y) => over(oi, y),
        onend: () => ((dragging = null), play('drop')),
      }}
    >
      <span class="grip" aria-hidden="true"><Icon name="grip" size={20} /></span>
      <span class="key">{pos + 1}</span>
      <span class="text"><span class:hl={good} class:strike={bad} class:on={reveal}><Rich inline src={item.items[oi]} /></span></span>
      {#if bad}<span class="fix" aria-label="Vị trí đúng {oi + 1}">{oi + 1}</span>{/if}
      {#if !locked}
        <span class="moves">
          <button class="mv" data-dir="-1" aria-label="Lên" disabled={pos === 0} onclick={() => step(oi, -1)}><Icon name="up" size={20} /></button>
          <button class="mv" data-dir="1" aria-label="Xuống" disabled={pos === seq.length - 1} onclick={() => step(oi, 1)}><Icon name="down" size={20} /></button>
        </span>
      {/if}
    </li>
  {/each}
</ol>

<style>
  .rows { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; padding: 0; list-style: none; }
  .row {
    display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 4px 4px 4px 0;
    border-radius: var(--r-ctl); border: 1px solid var(--line); background: var(--raised);
    transition: border-color var(--t-std) var(--ease-out);
  }
  .row.good { border-color: var(--good); }
  .row.bad { border-color: var(--bad); box-shadow: inset 2px 0 0 0 var(--bad); }
  .grip { flex: none; display: grid; place-items: center; width: 40px; align-self: stretch; color: var(--muted); cursor: grab; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
  .locked .grip { visibility: hidden; }
  .key, .fix {
    flex: none; display: grid; place-items: center; width: 26px; height: 26px; margin-left: -6px;
    border-radius: 50%; border: 1px solid var(--line); font-size: var(--fs-sm); font-weight: 600; color: var(--muted);
  }
  .good .key { border-color: var(--good); color: var(--good); }
  .bad .key { background: var(--bad); border-color: var(--bad); color: var(--on-accent); }
  .fix { margin: 0 8px 0 0; border-color: var(--good); color: var(--good); }
  .text { flex: 1; min-width: 0; padding: 8px 0; font-size: var(--fs-md); line-height: 1.45; overflow-wrap: anywhere; }
  .moves { flex: none; display: flex; }
  .mv { display: grid; place-items: center; width: 40px; height: 44px; border-radius: var(--r-ctl); color: var(--muted); }
  .mv:disabled { opacity: 0.3; }
  @media (hover: hover) { .mv:not(:disabled):hover { color: var(--ink); background: var(--bg); } }
</style>
