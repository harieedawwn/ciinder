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
  .rates { display: flex; gap: 6px; }
  .rate {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 40px; padding: 6px 8px;
    border-radius: var(--r-chip) var(--r-chip) 0 0; border: 1px solid var(--line); border-bottom: 0; background: var(--surface);
    font-size: var(--fs-xs); font-weight: 600; line-height: 1.25; color: var(--muted);
    transition: color var(--t-std) var(--ease-out), background-color var(--t-std) var(--ease-out);
  }
  .rate.sel { color: var(--ink); background: var(--mark); }
  .rate.again.sel { color: var(--bad); }
  .rate.known.sel { color: var(--good); }
  .rate[aria-disabled='true'] { cursor: default; }
  .key { font-size: var(--fs-xs); }
  @container card (max-width: 360px) { .key { display: none; } }
  @media (hover: hover) { .rate:not([aria-disabled='true']):hover { color: var(--ink); } }
</style>
