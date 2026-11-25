<script lang="ts">
  import Rich from '../render/Rich.svelte'
  import { optionOrder } from '../core/attempt'
  import type { TfItem } from '../core/types'
  import { ink } from '../lib/ink'
  import { play } from '../lib/sound'
  import { TF_LETTERS, type KindProps } from './registry'

  let { item, answer, onanswer, seed, locked, reveal }: KindProps<TfItem> = $props()

  const order = $derived(optionOrder(item, seed))
  const marks = $derived(answer?.kind === 'tf' ? answer.marks : item.statements.map(() => null))

  function mark(i: number, v: boolean) {
    if (locked) return
    const next = [...marks]
    const off = next[i] === v
    next[i] = off ? null : v
    play(off ? 'deselect' : 'select')
    onanswer({ kind: 'tf', marks: next })
  }

  /** 1–9 cycles statement n: Đúng → Sai → empty. */
  export function choose(n: number) {
    const i = order[n - 1]
    if (i === undefined) return
    mark(i, marks[i] === true ? false : marks[i] === false ? false : true)
  }
</script>

<ol class="list">
  {#each order as si, d (si)}
    {@const st = item.statements[si]}
    {@const m = marks[si]}
    {@const right = m === st.correct}
    <li class="row" class:shake={reveal && !right}>
      <span class="label">{TF_LETTERS[d]})</span>
      <span class="text"><span class="hl" class:on={reveal && right}><Rich inline src={st.text} /></span></span>
      <span class="pair" role="radiogroup" aria-label="{TF_LETTERS[d]})">
        {#each [true, false] as v (v)}
          <button
            role="radio"
            aria-checked={m === v}
            aria-disabled={locked}
            aria-label={v ? 'Đúng' : 'Sai'}
            class:sel={m === v}
            class:good={reveal && st.correct === v}
            class:bad={reveal && m === v && st.correct !== v}
            onclick={() => mark(si, v)}
            use:ink>{v ? 'Đ' : 'S'}</button
          >
        {/each}
      </span>
    </li>
  {/each}
</ol>

<style>
  .list { list-style: none; padding: 0; display: grid; gap: 8px; }
  .row {
    display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px;
    padding: 8px 8px 8px 14px; border: 1px solid var(--line); border-radius: var(--r-ctl); background: var(--raised);
  }
  .label { align-self: start; padding-top: 1px; font-weight: 600; color: var(--muted); }
  .text { min-width: 0; line-height: 1.45; overflow-wrap: anywhere; }
  .pair { display: flex; gap: 4px; }
  button {
    width: 44px; height: 44px; border-radius: var(--r-ctl); border: 1px solid var(--line);
    font-weight: 600; color: var(--muted); transition: border-color var(--t-std) var(--ease-out);
  }
  button.sel { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
  button.good { border-color: var(--good); color: var(--good); background: var(--good-soft); }
  button.sel.good { background: var(--good); color: var(--on-accent); }
  button.bad { background: var(--bad); border-color: var(--bad); color: var(--on-accent); }
  button[aria-disabled='true'] { cursor: default; }
  @container card (max-width: 360px) { .row { grid-template-columns: auto 1fr; } .pair { grid-column: 2; } }
</style>
