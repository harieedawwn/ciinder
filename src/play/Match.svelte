<script lang="ts">
  import Rich from '../render/Rich.svelte'
  import { matchRights } from '../core/attempt'
  import type { MatchItem } from '../core/types'
  import { ink } from '../lib/ink'
  import { play } from '../lib/sound'
  import type { KindProps } from './registry'

  let { item, answer, onanswer, seed, locked, reveal }: KindProps<MatchItem> = $props()

  const rightsCol = $derived(matchRights(item, seed))
  const rights = $derived(answer?.kind === 'match' ? answer.rights : item.pairs.map(() => null))
  /** Selected side waiting for its partner. */
  let pick = $state<{ side: 'l'; i: number } | { side: 'r'; text: string } | null>(null)

  /** Left index paired with a right-hand text, or -1. */
  const owner = (text: string) => rights.indexOf(text)

  function commit(next: (string | null)[]) {
    onanswer({ kind: 'match', rights: next })
  }

  function pair(li: number, text: string) {
    const next = rights.map((r) => (r === text ? null : r))
    next[li] = text
    pick = null
    play('snap')
    commit(next)
  }

  function tapLeft(li: number) {
    if (locked) return
    if (pick?.side === 'r') return pair(li, pick.text)
    if (pick?.side === 'l' && pick.i === li) return ((pick = null), play('deselect'))
    if (rights[li] !== null && !pick) commit(rights.map((r, i) => (i === li ? null : r)))
    pick = { side: 'l', i: li }
    play('select')
  }

  function tapRight(text: string) {
    if (locked) return
    if (pick?.side === 'l') return pair(pick.i, text)
    if (pick?.side === 'r' && pick.text === text) return ((pick = null), play('deselect'))
    if (owner(text) !== -1 && !pick) commit(rights.map((r) => (r === text ? null : r)))
    pick = { side: 'r', text }
    play('select')
  }

  /** Keys 1–9: pick a left item, then a right one. */
  export function choose(n: number) {
    if (pick?.side === 'l') {
      const text = rightsCol[n - 1]
      if (text !== undefined) tapRight(text)
    } else if (n <= item.pairs.length) tapLeft(n - 1)
  }
</script>

<div class="cols">
  <div class="col" role="group" aria-label="Cột trái">
    {#each item.pairs as p, li (li)}
      {@const chosen = rights[li]}
      {@const good = reveal && chosen === p.right}
      {@const bad = reveal && chosen !== p.right}
      <button
        class="cell"
        class:sel={pick?.side === 'l' && pick.i === li}
        class:paired={chosen !== null}
        class:good
        class:bad
        class:shake={bad}
        aria-pressed={pick?.side === 'l' && pick.i === li}
        aria-disabled={locked}
        onclick={() => tapLeft(li)}
        use:ink
      >
        <span class="key">{li + 1}</span>
        <span class="text">
          <Rich inline src={p.left} />
          {#if bad}<span class="fix"><span class="hl" class:on={reveal}><Rich inline src={p.right} /></span></span>{/if}
        </span>
      </button>
    {/each}
  </div>
  <div class="col" role="group" aria-label="Cột phải">
    {#each rightsCol as text, ri (ri)}
      {@const li = owner(text)}
      {@const good = reveal && li !== -1 && item.pairs[li].right === text}
      {@const bad = reveal && li !== -1 && !good}
      <button
        class="cell"
        class:sel={pick?.side === 'r' && pick.text === text}
        class:paired={li !== -1}
        class:good
        class:bad
        aria-pressed={pick?.side === 'r' && pick.text === text}
        aria-disabled={locked}
        aria-label={li !== -1 ? `${text}, nối với ${li + 1}` : undefined}
        onclick={() => tapRight(text)}
        use:ink
      >
        <span class="key">{li !== -1 ? li + 1 : ''}</span>
        <span class="text"><span class:strike={bad} class:on={reveal}><Rich inline src={text} /></span></span>
      </button>
    {/each}
  </div>
</div>

<style>
  .cols { display: grid; gap: 16px; }
  @container card (min-width: 520px) { .cols { grid-template-columns: 1fr 1fr; align-items: start; } }
  .col { display: grid; gap: 8px; }
  .cell {
    display: flex; align-items: flex-start; gap: 12px; width: 100%; min-height: 48px; padding: 11px 14px;
    text-align: left; border-radius: var(--r-ctl); border: 1px solid var(--line); background: var(--raised);
    transition: box-shadow var(--t-std) var(--ease-out), border-color var(--t-std) var(--ease-out);
  }
  .cell.paired { background: var(--accent-soft); }
  .cell.sel { border-color: var(--accent); box-shadow: inset 2px 0 0 0 var(--accent); }
  .cell.good { border-color: var(--good); background: var(--raised); }
  .cell.bad { border-color: var(--bad); box-shadow: inset 2px 0 0 0 var(--bad); background: var(--raised); }
  .cell[aria-disabled='true'] { cursor: default; }
  .key {
    flex: none; display: grid; place-items: center; width: 26px; height: 26px; margin-top: -1px;
    border-radius: 50%; border: 1px solid var(--line); font-size: var(--fs-sm); font-weight: 600; color: var(--muted);
  }
  .paired .key { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
  .good .key { background: var(--good); border-color: var(--good); }
  .bad .key { background: var(--bad); border-color: var(--bad); }
  .text { flex: 1; min-width: 0; font-size: var(--fs-md); line-height: 1.45; overflow-wrap: anywhere; }
  .fix { display: block; margin-top: 4px; }
  @media (hover: hover) { .cell:not([aria-disabled='true']):hover { border-color: var(--muted); } .cell.sel:hover { border-color: var(--accent); } }
</style>
