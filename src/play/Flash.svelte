<script lang="ts">
  import Rich from '../render/Rich.svelte'
  import type { Mastery } from '../core/grade'
  import type { FlashItem } from '../core/types'
  import { play } from '../lib/sound'
  import Rate, { RATES } from './Rate.svelte'
  import type { KindProps } from './registry'

  let { item, answer, onanswer, locked }: KindProps<FlashItem> = $props()

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
  <span class="face front" aria-hidden={back}><Rich inline src={item.prompt} /></span>
  <span class="face rear" aria-hidden={!back}><Rich src={item.back} /></span>
</button>

{#if back || rating}
  <Rate {rating} {locked} onrate={rate} />
{/if}

<style>
  .flip {
    display: grid; grid-template-columns: minmax(0, 1fr); width: 100%; min-height: 220px; perspective: 1200px;
    border-radius: var(--r-card); text-align: center; -webkit-tap-highlight-color: transparent;
  }
  .face {
    grid-area: 1 / 1; position: relative; display: grid; place-items: center; padding: 24px 20px;
    border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); box-shadow: var(--shadow);
    font-size: var(--fs-lg); line-height: 1.5; overflow-wrap: anywhere;
    backface-visibility: hidden; -webkit-backface-visibility: hidden;
    transition: transform var(--t-large) var(--ease-out), opacity var(--t-micro) linear;
  }
  .face::before { content: ''; position: absolute; top: 0; bottom: 0; left: 18px; width: 1px; background: var(--accent-soft); }
  .front { font-size: var(--fs-xl); font-weight: 600; }
  .rear { transform: rotateY(180deg); text-align: left; place-items: center start; }
  .back .front { transform: rotateY(-180deg); }
  .back .rear { transform: rotateY(0); }
  /* Reduced motion: crossfade instead of the 3D turn. */
  :global([data-motion='reduce']) .flip .face { transform: none; }
  :global([data-motion='reduce']) .rear, :global([data-motion='reduce']) .back .front { opacity: 0; }
  :global([data-motion='reduce']) .back .rear { opacity: 1; }
</style>
