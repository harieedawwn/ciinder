<script lang="ts">
  import Rich from '../render/Rich.svelte'
  import { bankWords } from '../core/attempt'
  import { matchesAnswer } from '../core/normalize'
  import type { ClozeItem } from '../core/types'
  import { ink } from '../lib/ink'
  import { play } from '../lib/sound'
  import { wipe } from '../lib/wipe'
  import type { KindProps } from './registry'

  let { item, answer, onanswer, seed, locked, reveal }: KindProps<ClozeItem> = $props()

  const blanks = $derived(item.segments.flatMap((s) => (s.t === 'blank' ? [s.answers] : [])))
  const values = $derived(answer?.kind === 'cloze' ? answer.blanks : blanks.map(() => ''))
  const ok = $derived(blanks.map((a, i) => matchesAnswer(values[i] ?? '', a, { loose: item.loose })))
  /** Segment index → blank index. */
  const blankAt = $derived.by(() => {
    let n = 0
    return item.segments.map((s) => (s.t === 'blank' ? n++ : -1))
  })

  const words = $derived(item.bank ? bankWords(item, seed) : [])
  /** Which bank chips are placed: each filled blank takes the first free chip with the same text. */
  const used = $derived.by(() => {
    const taken = words.map(() => false)
    for (const v of values) {
      const i = words.findIndex((w, j) => !taken[j] && w === v)
      if (i >= 0) taken[i] = true
    }
    return taken
  })

  function set(i: number, v: string) {
    const next = blanks.map((_, j) => values[j] ?? '')
    next[i] = v
    onanswer({ kind: 'cloze', blanks: next })
  }

  function place(w: number) {
    if (locked || used[w]) return
    const i = blanks.findIndex((_, j) => !values[j])
    if (i < 0) return
    play('select')
    set(i, words[w])
  }

  function clear(i: number) {
    if (locked || !values[i]) return
    play('deselect')
    set(i, '')
  }

  export function choose(n: number) {
    if (item.bank) place(n - 1)
  }
</script>

<p class="text">
  {#each item.segments as seg, si (si)}
    {#if seg.t === 'text'}<Rich inline src={seg.text} />{:else}
      {@const b = blankAt[si]}
      {@const state = reveal ? (ok[b] ? 'good' : 'bad') : ''}
      {#if item.bank}
        <button class="slot {state}" class:filled={!!values[b]} aria-disabled={locked} aria-label="Ô {b + 1}" onclick={() => clear(b)}>{#if values[b]}<Rich inline src={values[b]} />{:else}{' '}{/if}</button>
      {:else}
        <input
          class="slot {state}"
          value={values[b] ?? ''}
          readonly={locked}
          size={Math.max(4, Math.min(24, (blanks[b][0] ?? '').length + 1))}
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          aria-label="Ô {b + 1}"
          oninput={(e) => set(b, e.currentTarget.value)}
        />
      {/if}
      {#if reveal && !ok[b]}<span class="fix hl" use:wipe>{blanks[b].join(' / ')}</span>{/if}
    {/if}
  {/each}
</p>

{#if item.bank}
  <div class="bank" role="group" aria-label="Ngân hàng từ">
    {#each words as w, i (i)}
      <button class="chip" class:used={used[i]} aria-disabled={locked || used[i]} onclick={() => place(i)} use:ink>{w}</button>
    {/each}
  </div>
{/if}

<style>
  .text { font-size: var(--fs-lg); line-height: 2.3; overflow-wrap: anywhere; }
  .slot {
    display: inline-block; min-width: 4.5em; max-width: 100%; height: 2em; padding: 0 8px; margin: 0 2px;
    vertical-align: baseline; border: 0; border-bottom: 2px solid var(--muted); border-radius: 6px 6px 0 0;
    background: var(--accent-soft); font-size: var(--fs-md); line-height: 2em; text-align: center;
    transition: border-color var(--t-std) var(--ease-out);
  }
  input.slot { width: auto; }
  input.slot:focus { border-bottom-color: var(--accent); outline: none; }
  button.slot.filled { background: var(--raised); border-bottom-color: var(--accent); font-weight: 500; }
  .slot.good { border-bottom-color: var(--good); background: var(--good-soft); }
  .slot.bad { border-bottom-color: var(--bad); background: var(--bad-soft); text-decoration: line-through; text-decoration-color: var(--bad); }
  .slot[aria-disabled='true'], input.slot[readonly] { cursor: default; }
  .fix { margin: 0 6px 0 4px; font-size: var(--fs-md); }
  .bank { display: flex; flex-wrap: wrap; gap: 8px; padding-top: 4px; }
  .chip {
    min-height: 40px; padding: 6px 12px; border-radius: var(--r-chip); border: 1px solid var(--line);
    background: var(--raised); box-shadow: var(--shadow); transition: opacity var(--t-std) var(--ease-out);
  }
  .chip.used { opacity: 0.3; box-shadow: none; }
  .chip[aria-disabled='true'] { cursor: default; }
</style>
