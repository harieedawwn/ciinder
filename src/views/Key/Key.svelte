<script lang="ts">
  // Printable question sheet / answer key of the selection chosen on the start panel (docs/PHASES.md Phase 13).
  import Rich from '../../render/Rich.svelte'
  import { selectItems } from '../../core/attempt'
  import { parse } from '../../core/parse'
  import type { Item, QuizSet } from '../../core/types'
  import { PLAYABLE } from '../../play/registry'
  import { getSet } from '../../state/library.svelte'
  import { go } from '../../state/router.svelte'
  import Button from '../../ui/Button.svelte'
  import Mark from '../../ui/Mark.svelte'
  import Segmented from '../../ui/Segmented.svelte'
  import { loadPrefs } from '../Home/startPrefs'
  import { keyPrompt, keyRows } from './key'

  let { id }: { id: string } = $props()

  let quiz = $state<QuizSet | null>(null)
  let items = $state<Item[]>([])
  let missing = $state(false)
  let view = $state<'paper' | 'key'>('key')
  const VIEWS = [
    { id: 'paper', name: 'Đề' },
    { id: 'key', name: 'Đáp án' },
  ] as const

  $effect(() => {
    void getSet(id).then((rec) => {
      if (!rec) return void (missing = true)
      const set = parse(rec.source).set
      const p = loadPrefs(id)
      const picked = new Set(selectItems(set, { kinds: p?.kinds ?? [], sections: p?.sections ?? [], count: p?.count ?? 0, seed: p?.seed ?? 0 }, PLAYABLE))
      quiz = set
      items = set.items.filter((it) => picked.has(it.id))
    })
  })

  const answers = $derived(view === 'key')
</script>

{#if quiz}
  <section class="key">
    <div class="bar">
      <Button variant="quiet" icon="back" onclick={() => go('/')}>Thư viện</Button>
      <Segmented bind:value={view} options={VIEWS} label="Đề hay đáp án" />
      <Button variant="primary" icon="file" onclick={() => window.print()}>In</Button>
    </div>
    <h1>{quiz.title}</h1>
    <ol>
      {#each items as it, n (it.id)}
        {@const rows = keyRows(it, answers)}
        <li>
          <p class="q"><span class="n num">{n + 1}.</span> <Rich src={keyPrompt(it, answers)} /></p>
          {#if rows.length}
            <ul class="rows">
              {#each rows as r, i (i)}
                <li class:good={r.good}>
                  {#if r.good}<Mark strong><Rich inline src={r.text} /></Mark>{:else}<Rich inline src={r.text} />{/if}
                </li>
              {/each}
            </ul>
          {/if}
          {#if answers && it.explain}<div class="explain"><Rich src={it.explain} /></div>{/if}
        </li>
      {/each}
    </ol>
  </section>
{:else if missing}
  <section class="key"><p>Không tìm thấy bộ câu hỏi.</p><Button icon="back" onclick={() => go('/')}>Thư viện</Button></section>
{/if}

<style>
  .key {
    display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; align-content: start; max-width: 720px; margin: 0 auto;
    padding: 8px max(16px, var(--safe-r)) calc(32px + var(--safe-b)) max(16px, var(--safe-l));
  }
  .bar { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; }
  h1 { font-size: var(--fs-xl); overflow-wrap: anywhere; }
  ol { display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; list-style: none; padding: 0; }
  li { min-width: 0; }
  .q { display: flex; gap: 8px; font-weight: 600; }
  .q > :global(*:last-child) { min-width: 0; overflow-wrap: anywhere; }
  .n { flex: none; }
  .rows { display: grid; grid-template-columns: minmax(0, 1fr); gap: 6px; list-style: none; margin: 8px 0 0 24px; padding: 0; overflow-wrap: anywhere; }
  .explain { margin: 8px 0 0 24px; color: var(--muted); font-size: var(--fs-sm); overflow-wrap: anywhere; }

  @media print {
    @page { size: A4; margin: 18mm; }
    :global(body) { background: #fff !important; color: #000 !important; }
    :global(header.bar), .bar { display: none !important; }
    .key { max-width: none; padding: 0; color: #000; }
    .explain { color: #000; }
    li { break-inside: avoid; }
    ol > li { break-inside: avoid; }
  }
</style>
