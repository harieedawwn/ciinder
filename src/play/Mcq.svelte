<script lang="ts">
  import { optionOrder } from '../core/attempt'
  import type { McqItem } from '../core/types'
  import { ink } from '../lib/ink'
  import { play } from '../lib/sound'
  import { LETTERS, type KindProps } from './registry'

  let { item, answer, onanswer, seed, locked, reveal }: KindProps<McqItem> = $props()

  const order = $derived(optionOrder(item, seed))
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
      <span class="text"><span class:hl={opt.correct} class:strike={sel && !opt.correct} class:on={reveal}>{opt.text}</span></span>
    </button>
  {/each}
</div>

<style>
  .multi { font-size: var(--fs-sm); color: var(--muted); }
  .opts { display: grid; gap: 8px; }
  .opt {
    display: flex; align-items: flex-start; gap: 12px; width: 100%; min-height: 48px; padding: 11px 14px;
    text-align: left; border-radius: var(--r-ctl); border: 1px solid var(--line); background: var(--raised);
    box-shadow: inset 0 0 0 0 var(--accent); transition: box-shadow var(--t-std) var(--ease-out), border-color var(--t-std) var(--ease-out);
  }
  .opt.sel { border-color: var(--accent); box-shadow: inset 2px 0 0 0 var(--accent); }
  .opt.good { border-color: var(--good); }
  .opt.bad { border-color: var(--bad); box-shadow: inset 2px 0 0 0 var(--bad); }
  .opt[aria-disabled='true'] { cursor: default; }
  .key {
    flex: none; display: grid; place-items: center; width: 26px; height: 26px; margin-top: -1px;
    border-radius: 50%; border: 1px solid var(--line); font-size: var(--fs-sm); font-weight: 600; color: var(--muted);
  }
  .key.box { border-radius: 6px; }
  .sel .key { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
  .bad .key { background: var(--bad); border-color: var(--bad); color: var(--on-accent); }
  .good .key { border-color: var(--good); color: var(--good); }
  .sel.good .key { background: var(--good); color: var(--on-accent); }
  .text { flex: 1; min-width: 0; font-size: var(--fs-md); line-height: 1.45; overflow-wrap: anywhere; white-space: pre-wrap; }
  @media (hover: hover) { .opt:not([aria-disabled='true']):hover { border-color: var(--muted); } .opt.sel:hover { border-color: var(--accent); } }
</style>
