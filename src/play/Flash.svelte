<script lang="ts">
  import type { Mastery } from '../core/grade'
  import type { FlashItem } from '../core/types'
  import { ink } from '../lib/ink'
  import { play } from '../lib/sound'
  import type { KindProps } from './registry'

  let { item, answer, onanswer, locked }: KindProps<FlashItem> = $props()

  const RATES: [Mastery, string][] = [
    ['again', 'Chưa thuộc'],
    ['partial', 'Nhớ một phần'],
    ['known', 'Đã thuộc'],
  ]
  const rating = $derived(answer?.kind === 'flash' ? answer.rating : null)
  let back = $state(false)

  function flip() {
    back = !back
    play(back ? 'expand' : 'collapse')
  }

  function rate(m: Mastery) {
    if (locked || m === rating) return
    play('select')
    onanswer({ kind: 'flash', rating: m })
  }

  /** Keys 1–3 rate once the back is shown; any key flips first. */
  export function choose(n: number) {
    if (!back) return flip()
    const r = RATES[n - 1]
    if (r) rate(r[0])
  }
</script>

<button class="flip" class:back aria-pressed={back} aria-label={back ? 'Mặt sau' : 'Mặt trước'} onclick={flip}>
  <span class="face front" aria-hidden={back}>{item.prompt}</span>
  <span class="face rear" aria-hidden={!back}>{item.back}</span>
</button>

{#if back || rating}
  <div class="rates" role="radiogroup" aria-label="Mức độ nhớ">
    {#each RATES as [m, label], i (m)}
      <button class="rate {m}" class:sel={rating === m} role="radio" aria-checked={rating === m} aria-disabled={locked} onclick={() => rate(m)} use:ink>
        <span class="key">{i + 1}</span>{label}
      </button>
    {/each}
  </div>
{/if}

<style>
  .flip {
    display: grid; width: 100%; min-height: 220px; perspective: 1200px;
    border-radius: var(--r-card); text-align: center; -webkit-tap-highlight-color: transparent;
  }
  .face {
    grid-area: 1 / 1; display: grid; place-items: center; padding: 24px 20px;
    border: 1px solid var(--line); border-radius: var(--r-card); background: var(--bg);
    font-size: var(--fs-lg); line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere;
    backface-visibility: hidden; -webkit-backface-visibility: hidden;
    transition: transform var(--t-large) var(--ease-out), opacity var(--t-micro) linear;
  }
  .front { font-size: var(--fs-xl); font-weight: 600; }
  .rear { transform: rotateY(180deg); background: var(--raised); text-align: left; place-items: center start; }
  .back .front { transform: rotateY(-180deg); }
  .back .rear { transform: rotateY(0); }
  /* Reduced motion: crossfade instead of the 3D turn. */
  :global([data-motion='reduce']) .flip .face { transform: none; }
  :global([data-motion='reduce']) .rear, :global([data-motion='reduce']) .back .front { opacity: 0; }
  :global([data-motion='reduce']) .back .rear { opacity: 1; }
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
