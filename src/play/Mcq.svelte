<script lang="ts">
  import Rich from '../render/Rich.svelte'
  import { optionOrder } from '../core/attempt'
  import type { McqItem } from '../core/types'
  import { ink } from '../lib/ink'
  import { play } from '../lib/sound'
  import Mark from '../ui/Mark.svelte'
  import { LETTERS, type KindProps } from './registry'

  let { item, answer, onanswer, seed, mixOptions = true, locked, reveal }: KindProps<McqItem> = $props()

  const order = $derived(optionOrder(item, seed, mixOptions))
  const picks = $derived(answer?.kind === 'mcq' ? answer.picks : [])

  function toggle(i: number) {
    if (locked) return
    const on = picks.includes(i)
    let next: number[]
    if (item.multi) next = on ? picks.filter((p) => p !== i) : [...picks, i].sort((a, b) => a - b)
    else if (on) return
    else next = [i]
    play(on ? 'deselect' : 'select')
    onanswer({ kind: 'mcq', picks: next })
  }

  export function choose(n: number) {
    const i = order[n - 1]
    if (i !== undefined) toggle(i)
  }
</script>

{#if item.multi}<p class="multi">Chọn nhiều đáp án</p>{/if}
<div class="opts" role={item.multi ? 'group' : 'radiogroup'}>
  {#each order as oi, d (oi)}
    {@const opt = item.options[oi]}
    {@const sel = picks.includes(oi)}
    {@const bad = reveal && sel && !opt.correct}
    <button
      class="opt"
      class:sel
      class:good={reveal && opt.correct}
      class:bad
      class:shake={bad}
      role={item.multi ? 'checkbox' : 'radio'}
      aria-checked={sel}
      aria-disabled={locked}
      onclick={() => toggle(oi)}
      use:ink
    >
      <span class="key" class:box={item.multi}>{LETTERS[d]}</span>
      <span class="text">{#if opt.correct}<Mark on={reveal}><Rich inline src={opt.text} /></Mark>{:else}<span class="strike" class:on={reveal && sel}><Rich inline src={opt.text} /></span>{/if}</span>
    </button>
  {/each}
</div>

<style>
  .multi { font-size: var(--fs-sm); color: var(--muted); }
  .opts { display: grid; grid-template-columns: minmax(0, 1fr); margin: 0 -4px; }
  .opt {
    display: flex; align-items: flex-start; gap: 12px; width: 100%; min-height: 48px; padding: 11px 4px;
    text-align: left; border-top: 1px solid var(--line); border-radius: 0; transition: background-color var(--t-std) var(--ease-out);
  }
  .opt:first-child { border-top: 0; }
  .opt.sel { background: var(--accent-soft); }
  .opt[aria-disabled='true'] { cursor: default; }
  .key {
    flex: none; display: grid; place-items: center; width: 24px; height: 24px; margin-top: -1px;
    border-radius: 6px; border: 1px solid var(--muted); font-size: var(--fs-sm); font-weight: 600; color: var(--muted);
    transition: background-color var(--t-std) var(--ease-out);
  }
  .sel .key { background: var(--ink); border-color: var(--ink); color: var(--surface); }
  .good .key { border-color: var(--good); color: var(--good); }
  .sel.good .key { background: var(--good); color: var(--surface); }
  .bad .key { border-color: var(--bad); color: var(--bad); }
  .sel.bad .key { background: var(--bad); color: var(--surface); }
  .text { flex: 1; min-width: 0; font-size: var(--fs-md); line-height: 1.45; overflow-wrap: anywhere; }
  @media (hover: hover) { .opt:not([aria-disabled='true']):hover .key { border-color: var(--ink); } }
</style>
