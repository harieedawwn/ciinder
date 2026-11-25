<script lang="ts" module>
  import type { Mastery } from '../core/grade'

  export const RATES: [Mastery, string][] = [
    ['again', 'Chưa thuộc'],
    ['partial', 'Nhớ một phần'],
    ['known', 'Đã thuộc'],
  ]
</script>

<script lang="ts">
  // Self-rating row shared by flash and essay (keys 1–3).
  import { ink } from '../lib/ink'

  let { rating, locked, onrate }: { rating: Mastery | null; locked: boolean; onrate: (m: Mastery) => void } = $props()
</script>

<div class="rates" role="radiogroup" aria-label="Mức độ nhớ">
  {#each RATES as [m, label], i (m)}
    <button class="rate {m}" class:sel={rating === m} role="radio" aria-checked={rating === m} aria-disabled={locked} onclick={() => onrate(m)} use:ink>
      <span class="key">{i + 1}</span>{label}
    </button>
  {/each}
</div>

<style>
  .rates { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .rate {
    display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; padding: 8px;
    border-radius: var(--r-ctl); border: 1px solid var(--line); background: var(--raised);
    font-size: var(--fs-sm); font-weight: 600; line-height: 1.25;
    transition: border-color var(--t-std) var(--ease-out), box-shadow var(--t-std) var(--ease-out);
  }
  .rate.sel { border-color: var(--accent); box-shadow: inset 0 -2px 0 0 var(--accent); }
  .rate.again.sel { border-color: var(--bad); box-shadow: inset 0 -2px 0 0 var(--bad); }
  .rate.known.sel { border-color: var(--good); box-shadow: inset 0 -2px 0 0 var(--good); }
  .rate[aria-disabled='true'] { cursor: default; }
  .key { font-size: var(--fs-xs); color: var(--muted); }
  @container card (max-width: 360px) { .key { display: none; } }
  @media (hover: hover) { .rate:not([aria-disabled='true']):hover { border-color: var(--muted); } }
</style>
