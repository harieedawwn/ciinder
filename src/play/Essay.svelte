<script lang="ts">
  // Essay study: three modes, each ending in a self-rating; Xong goes to the next card.
  import type { Mastery } from '../core/grade'
  import type { EssayItem } from '../core/types'
  import { play } from '../lib/sound'
  import Rich from '../render/Rich.svelte'
  import { essayMode, type EssayMode } from '../state/session.svelte'
  import Button from '../ui/Button.svelte'
  import Segmented from '../ui/Segmented.svelte'
  import Masks from './essay/Masks.svelte'
  import Recall from './essay/Recall.svelte'
  import Reveal from './essay/Reveal.svelte'
  import Rate, { RATES } from './Rate.svelte'
  import type { KindProps } from './registry'

  let { item, answer, onanswer, locked, onnext }: KindProps<EssayItem> = $props()

  const MODES: readonly { id: EssayMode; name: string }[] = [
    { id: 'read', name: 'Đọc dần' },
    { id: 'mask', name: 'Che từ khóa' },
    { id: 'recall', name: 'Tự nhớ' },
  ]

  const rating = $derived(answer?.kind === 'essay' ? answer.rating : null)
  let finished = $state(false)

  function rate(m: Mastery) {
    if (locked || m === rating) return
    play(m === 'known' ? 'success' : 'select')
    onanswer({ kind: 'essay', rating: m })
  }

  /** Keys 1–3 rate once the answer has been studied. */
  export function choose(n: number) {
    const r = RATES[n - 1]
    if (r && (finished || rating)) rate(r[0])
  }
</script>

{#if locked}
  <div class="answer"><Rich src={item.answer} kw /></div>
{:else}
  <Segmented bind:value={essayMode.mode} options={MODES} label="Cách học" />
  <div class="answer">
    {#key essayMode.mode}
      {#if essayMode.mode === 'read'}
        <Reveal src={item.answer} ondone={() => (finished = true)} />
      {:else if essayMode.mode === 'mask'}
        <Masks src={item.answer} keywords={item.keywords} ondone={() => (finished = true)} />
      {:else}
        <Recall src={item.answer} ondone={() => (finished = true)} />
      {/if}
    {/key}
  </div>
{/if}

{#if finished || rating}
  <Rate {rating} {locked} onrate={rate} />
  {#if rating && onnext && !locked}
    <div class="done"><Button variant="primary" icon="next" onclick={onnext}>Xong</Button></div>
  {/if}
{/if}

<style>
  .answer {
    position: relative; max-width: 68ch; padding: 14px 16px 14px 30px; background: var(--surface);
    border: 1px solid var(--line); border-radius: var(--r-card); box-shadow: var(--shadow);
  }
  .answer::before { content: ''; position: absolute; top: 0; bottom: 0; left: 14px; width: 1px; background: var(--accent-soft); }
  .answer :global(.rich) { font-family: var(--font-read); font-size: 1.0625rem; line-height: 1.7; }
  .done { display: grid; }
</style>
