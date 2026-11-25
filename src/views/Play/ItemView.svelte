<script lang="ts">
  import type { Item, NoteItem } from '../../core/types'
  import { play } from '../../lib/sound'
  import Note from '../../play/Note.svelte'
  import { REGISTRY, type KindApi } from '../../play/registry'
  import Button from '../../ui/Button.svelte'
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
  let hint = $state(false)
  let explain = $state(false)

  function toggle(which: 'hint' | 'explain') {
    if (which === 'hint') hint = !hint
    else explain = !explain
    play((which === 'hint' ? hint : explain) ? 'expand' : 'collapse')
  }
</script>

<article class="card" aria-label="Câu {player.pos + 1}">
  {#if note}<Note item={note} />{/if}
  {#if item.kind !== 'cloze' && item.kind !== 'flash'}<h2 class="prompt">{item.prompt}</h2>{/if}
  {#if Kind}
    <Kind bind:this={api} {item} answer={player.answer(item.id)} onanswer={(a) => player.setAnswer(item.id, a)} seed={player.attempt.seed} locked={player.locked(item.id)} {reveal} {score} />
  {/if}

  {#if reveal}
    <div class="after">
      <p class="verdict {score === 1 ? 'good' : 'bad'}" role="status">{verdict}</p>
      {#if item.explain}
        <Button variant="quiet" icon="down" sound={false} aria-expanded={explain} onclick={() => toggle('explain')}>Giải thích</Button>
      {/if}
    </div>
    {#if explain && item.explain}<p class="more">{item.explain}</p>{/if}
  {:else if item.hint && player.practice && !player.review}
    <div class="after">
      <Button variant="quiet" icon="hint" sound={false} aria-expanded={hint} onclick={() => toggle('hint')}>Gợi ý</Button>
    </div>
    {#if hint}<p class="more">{item.hint}</p>{/if}
  {/if}
</article>

<style>
  .card {
    container: card / inline-size;
    display: grid; gap: 16px; align-content: start; padding: 20px;
    background: var(--raised); border: 1px solid var(--line); border-radius: var(--r-card); box-shadow: var(--shadow);
  }
  .prompt { font-size: var(--fs-lg); font-weight: 500; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; }
  .after { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 12px; margin: -4px 0 -8px; }
  .after :global(.quiet) { color: var(--muted); }
  .after > :global(.quiet:first-child) { margin-left: -12px; }
  .verdict { font-weight: 600; }
  .verdict.good { color: var(--good); }
  .verdict.bad { color: var(--bad); }
  .more { padding: 12px 14px; border-radius: var(--r-ctl); background: var(--bg); line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }
  @media (max-width: 420px) { .card { padding: 16px; } }
</style>
