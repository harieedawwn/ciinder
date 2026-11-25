<script lang="ts">
  import Rich from '../../render/Rich.svelte'
  import type { Item, NoteItem } from '../../core/types'
  import { play } from '../../lib/sound'
  import Note from '../../play/Note.svelte'
  import { REGISTRY, type KindApi } from '../../play/registry'
  import Button from '../../ui/Button.svelte'
  import IndexCard from '../../ui/IndexCard.svelte'
  import type { Player } from './player.svelte'

  let { player, item }: { player: Player; item: Item } = $props()

  let api = $state<KindApi>()
  $effect(() => {
    if (!api) return
    const id = item.id
    player.apis.set(id, api)
    return () => {
      if (player.apis.get(id) === api) player.apis.delete(id)
    }
  })

  const Kind = $derived(REGISTRY[item.kind])
  const note = $derived(player.note(item) as NoteItem | undefined)
  const score = $derived(player.shown(item.id))
  const reveal = $derived(score !== undefined)
  const verdict = $derived(score === undefined ? '' : score === 1 ? 'Đúng' : score === 0 ? 'Sai' : 'Đúng một phần')
  const behind = $derived(Math.min(2, player.items.length - 1 - player.pos))
  let hint = $state(false)
  let explain = $state(false)

  function toggle(which: 'hint' | 'explain') {
    if (which === 'hint') hint = !hint
    else explain = !explain
    play((which === 'hint' ? hint : explain) ? 'expand' : 'collapse')
  }
</script>

<IndexCard class={behind > 1 ? 'stack' : behind === 1 ? 'stack stack-1' : ''} aria-label="Câu {player.pos + 1}">
<article class="inner">
  <p class="count num">{player.pos + 1} / {player.items.length}</p>
  {#if note}<Note item={note} />{/if}
  {#if item.kind !== 'cloze' && item.kind !== 'flash'}<div class="prompt" role="heading" aria-level="2"><Rich src={item.prompt} /></div>{/if}
  {#if Kind}
    <Kind bind:this={api} {item} answer={player.answer(item.id)} onanswer={(a) => player.setAnswer(item.id, a)} seed={player.attempt.seed} mixOptions={!player.attempt.fixedOptions} locked={player.locked(item.id)} {reveal} {score} onnext={player.last ? undefined : () => player.next()} />
  {/if}

  {#if reveal}
    <div class="after">
      <p class="verdict {score === 1 ? 'good' : 'bad'}" role="status">{verdict}</p>
      {#if item.explain}
        <Button variant="quiet" icon="down" sound={false} aria-expanded={explain} onclick={() => toggle('explain')}>Giải thích</Button>
      {/if}
    </div>
    {#if explain && item.explain}<div class="more"><Rich src={item.explain} /></div>{/if}
  {:else if item.hint && player.practice && !player.review}
    <div class="after">
      <Button variant="quiet" icon="hint" sound={false} aria-expanded={hint} onclick={() => toggle('hint')}>Gợi ý</Button>
    </div>
    {#if hint}<div class="more"><Rich src={item.hint} /></div>{/if}
  {/if}
</article>
</IndexCard>

<style>
  .inner { container: card / inline-size; display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; align-content: start; }
  .count { font-size: var(--fs-xs); font-weight: 600; color: var(--muted); }
  .prompt { font-size: var(--fs-lg); font-weight: 500; line-height: 1.5; overflow-wrap: anywhere; }
  .after { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 12px; margin: -4px 0 -8px; }
  .after :global(.quiet) { color: var(--muted); }
  .after > :global(.quiet:first-child) { margin-left: -12px; }
  .verdict { font-weight: 600; }
  .verdict.good { color: var(--good); }
  .verdict.bad { color: var(--bad); }
  .more { padding: 12px 14px; border-radius: var(--r-ctl); background: var(--bg); line-height: 1.55; overflow-wrap: anywhere; }
</style>
